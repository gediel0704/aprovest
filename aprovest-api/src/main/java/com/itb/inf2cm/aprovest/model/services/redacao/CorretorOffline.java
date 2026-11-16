package com.itb.inf2cm.aprovest.model.services.redacao;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.itb.inf2cm.aprovest.model.services.redacao.GradeCorrecao.Criterio;
import com.itb.inf2cm.aprovest.model.services.redacao.GradeCorrecao.Grade;

/**
 * Corretor automático OFFLINE (sem IA generativa). É usado quando não há chave de API
 * configurada ou quando o serviço de IA está indisponível. Mede indicadores objetivos do
 * texto (estrutura, coesão, aderência ao tema, gênero, proposta de intervenção, desvios
 * comuns) e os converte para os níveis da grade oficial de cada banca.
 * O resultado é sempre apresentado ao aluno como ESTIMATIVA POR REGRAS.
 */
public final class CorretorOffline {

    public record Resultado(boolean anulada, String motivo, Map<String, Integer> notas, Map<String, String> comentarios,
                            String feedbackGeral, List<String> pontosFortes, List<String> melhorias) {}

    private static final List<String> CONECTIVOS = List.of(
            "alem disso", "ademais", "outrossim", "portanto", "logo", "assim", "dessa forma", "desse modo", "dessa maneira",
            "contudo", "entretanto", "no entanto", "todavia", "porem", "mas ", "embora", "ainda que", "apesar de",
            "visto que", "uma vez que", "ja que", "porque", "pois", "haja vista", "em virtude de", "devido a",
            "consequentemente", "por conseguinte", "em suma", "em sintese", "por fim", "finalmente", "primeiramente",
            "em primeiro lugar", "em segundo lugar", "nesse sentido", "nesse contexto", "sob essa otica", "diante disso",
            "por outro lado", "de modo que", "a fim de", "para que", "com efeito", "isto e", "ou seja", "tambem", "inclusive");
    private static final List<String> INFORMAIS = List.of(" vc ", " pq ", " ta ", " ne ", " kkk", " tipo assim", " mano ", " a gente ", " pra ", " to ", " tô ");
    private static final List<String> DESVIOS = List.of("concerteza", "derrepente", "agente faz", "menas", "a nivel de", "fazem anos",
            "houveram", "haviam muitos", "mal educado", "a partir de agora em diante", "de mais a mais", "excessão", "previlegio",
            "beneficiente", "porisso", "apartir", "atravez", "encima de", "nada haver");
    private static final List<String> AGENTES = List.of("governo", "estado", "ministerio", "secretaria", "poder publico", "escola",
            "instituicoes de ensino", "midia", "imprensa", "ongs", "organizacoes nao governamentais", "familia", "sociedade civil",
            "congresso", "poder legislativo", "prefeitura", "empresas", "universidades", "conselho");
    private static final List<String> ACOES = List.of("deve", "devem", "cabe", "compete", "e necessario", "e preciso", "precisa",
            "promover", "criar", "implementar", "ampliar", "investir", "fiscalizar", "garantir", "desenvolver", "realizar", "incentivar");
    private static final List<String> MEIOS = List.of("por meio de", "mediante", "atraves de", "por intermedio", "com o auxilio de", "via ");
    private static final List<String> FINALIDADES = List.of("a fim de", "para que", "com o objetivo de", "com a finalidade de", "com o intuito de", "visando");
    private static final List<String> DETALHES = List.of("ou seja", "isto e", "como, por exemplo", "por exemplo", "tais como", "a exemplo de");
    private static final List<String> REPERTORIO = List.of("segundo", "de acordo com", "conforme", "constituicao", "ibge", "onu", "oms",
            "lei ", "artigo", "filosofo", "sociologo", "pesquisa", "dados", "estudo", "historia", "seculo", "obra", "autor");
    private static final Set<String> STOP = Set.of("que", "para", "como", "mais", "uma", "com", "por", "dos", "das", "nos", "nas", "seu", "sua",
            "isso", "esse", "essa", "este", "esta", "sao", "pelo", "pela", "entre", "sobre", "quando", "muito", "tambem", "ainda", "ser", "tem",
            "foi", "pois", "mas", "assim", "forma", "modo", "sociedade", "brasil", "brasileira", "brasileiro", "pessoas", "nao", "onde");

    private CorretorOffline() {}

    static String norm(String s) {
        return Normalizer.normalize(s == null ? "" : s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }

    private static int contar(String texto, List<String> termos) {
        int c = 0;
        for (String t : termos) if (texto.contains(t)) c++;
        return c;
    }

    private static int ocorrencias(String texto, String termo) {
        int c = 0, i = 0;
        while ((i = texto.indexOf(termo, i)) >= 0) { c++; i += termo.length(); }
        return c;
    }

    public static Resultado corrigir(Grade grade, String tema, String proposta, String genero, String texto) {
        String bruto = texto == null ? "" : texto.trim();
        String t = " " + norm(bruto).replaceAll("\\s+", " ") + " ";
        String[] palavrasArr = bruto.isBlank() ? new String[0] : bruto.split("\\s+");
        int palavras = palavrasArr.length;
        List<String> paragrafos = Arrays.stream(bruto.split("\\n\\s*\\n|\\r?\\n")).map(String::trim).filter(p -> p.length() > 30).toList();
        int nParagrafos = paragrafos.size();
        String[] frases = bruto.split("[.!?]+\\s");
        double mediaFrase = frases.length == 0 ? 0 : (double) palavras / frases.length;
        int conectivos = contar(t, CONECTIVOS);
        int informais = contar(t, INFORMAIS);
        int desvios = contar(t, DESVIOS) + contarInicioMinusculo(bruto);
        int repertorio = contar(t, REPERTORIO) + (Pattern.compile("\\d").matcher(bruto).find() ? 1 : 0);
        double aderencia = aderencia(norm(tema + " " + (proposta == null ? "" : proposta)), t);
        double repeticao = maiorRepeticao(t, palavras);
        String ultimo = nParagrafos == 0 ? t : " " + norm(paragrafos.get(nParagrafos - 1)) + " ";

        Map<String, Integer> notas = new LinkedHashMap<>();
        Map<String, String> com = new LinkedHashMap<>();
        List<String> fortes = new ArrayList<>();
        List<String> melhorias = new ArrayList<>();

        boolean curto = palavras < 60;
        boolean fuga = aderencia < 0.08 && palavras > 60;
        if (curto || fuga) {
            String motivo = curto ? "Texto muito curto (menos de 60 palavras), o que leva à nota zero pelas regras da banca."
                    : "O texto não apresenta relação perceptível com o tema proposto (possível fuga ao tema).";
            grade.criterios().forEach(c -> { notas.put(c.codigo(), 0); com.put(c.codigo(), motivo); });
            return new Resultado(true, motivo, notas, com, motivo + " Reescreva o texto desenvolvendo o tema indicado.",
                    List.of(), List.of("Leia a proposta com atenção e desenvolva o tema em pelo menos 4 parágrafos."));
        }

        double nNorma = 1.0 - Math.min(1.0, (informais * 0.25 + desvios * 0.12 + (mediaFrase > 45 ? 0.25 : 0)));
        double nCoesao = Math.min(1.0, conectivos / 10.0) - (repeticao > 0.045 ? 0.15 : 0);
        double nTema = Math.min(1.0, aderencia * 1.6) * (palavras < 180 ? 0.7 : 1.0);
        double nRepertorio = Math.min(1.0, repertorio / 4.0);
        double nEstrutura = nParagrafos >= 4 && nParagrafos <= 6 ? 1.0 : nParagrafos == 3 ? 0.7 : nParagrafos >= 7 ? 0.8 : 0.4;

        switch (grade.sigla()) {
            case "FUVEST" -> {
                boolean carta = norm(genero).contains("carta");
                double nGenero = carta ? generoCarta(t) : Math.min(1.0, nEstrutura * (contar(t, List.of("prezad", "atenciosamente", "querido")) > 0 ? 0.6 : 1.0));
                put(grade, notas, "Q1", 1 + 3 * (0.6 * nTema + 0.4 * nRepertorio));
                put(grade, notas, "Q2", 1 + 3 * nGenero);
                put(grade, notas, "Q3", 1 + 3 * (0.7 * nCoesao + 0.3 * nEstrutura));
                put(grade, notas, "Q4", 1 + 3 * nNorma);
            }
            case "UNICAMP" -> {
                double nGenero = generoUnicamp(norm(genero), t);
                double nLeitura = Math.min(1.0, (contar(t, List.of("texto 1", "texto 2", "texto 3", "coletanea", "segundo", "de acordo com", "conforme", "como aponta", "como mostra")) + (Pattern.compile("\\d+%|\\d{2,}").matcher(bruto).find() ? 1 : 0)) / 3.0);
                put(grade, notas, "Pt", 2 * nTema);
                put(grade, notas, "G", 3 * nGenero);
                put(grade, notas, "Lt", 3 * nLeitura);
                put(grade, notas, "CeC", 1 + 3 * (0.5 * nNorma + 0.5 * nCoesao));
            }
            default -> {
                int elementos = (contar(ultimo, AGENTES) > 0 ? 1 : 0) + (contar(ultimo, ACOES) > 0 ? 1 : 0) + (contar(ultimo, MEIOS) > 0 ? 1 : 0)
                        + (contar(ultimo, FINALIDADES) > 0 ? 1 : 0) + (contar(ultimo, DETALHES) > 0 || ultimo.length() > 450 ? 1 : 0);
                put(grade, notas, "C1", 200 * Math.max(0.2, nNorma));
                put(grade, notas, "C2", 200 * (0.5 * nTema + 0.3 * nRepertorio + 0.2 * nEstrutura));
                put(grade, notas, "C3", 200 * (0.4 * nEstrutura + 0.3 * nTema + 0.3 * Math.min(1.0, palavras / 320.0)));
                put(grade, notas, "C4", 200 * Math.max(0.2, nCoesao));
                put(grade, notas, "C5", 40 * elementos);
                com.put("C5", "Elementos de intervenção identificados no último parágrafo: " + elementos + " de 5 (agente, ação, meio/modo, finalidade e detalhamento).");
                if (elementos < 5) melhorias.add("Complete a proposta de intervenção com agente, ação, meio, finalidade e detalhamento.");
                else fortes.add("Proposta de intervenção completa, com os cinco elementos.");
            }
        }

        // Comentários gerais por indicador
        for (Criterio c : grade.criterios()) {
            com.putIfAbsent(c.codigo(), comentarioPadrao(c, notas.get(c.codigo())));
        }
        if (conectivos >= 7) fortes.add("Bom repertório de conectivos (" + conectivos + " tipos diferentes).");
        else melhorias.add("Use conectivos variados entre parágrafos e períodos (encontrados: " + conectivos + ").");
        if (nParagrafos >= 4 && nParagrafos <= 6) fortes.add("Estrutura em " + nParagrafos + " parágrafos, adequada ao gênero.");
        else melhorias.add("Organize o texto em 4 ou 5 parágrafos (encontrados: " + nParagrafos + ").");
        if (informais + desvios > 0) melhorias.add("Revise desvios e marcas de informalidade (" + (informais + desvios) + " ocorrência(s) detectada(s)).");
        if (repertorio >= 3) fortes.add("Uso de repertório e dados para sustentar os argumentos.");
        else melhorias.add("Inclua repertório legitimado (dados, leis, autores, fatos históricos) relacionado ao tema.");
        if (aderencia < 0.3) melhorias.add("Retome explicitamente as palavras-chave do tema na introdução e na conclusão.");
        if (mediaFrase > 40) melhorias.add("Divida períodos muito longos (média de " + Math.round(mediaFrase) + " palavras por frase).");

        String geral = String.format("Correção automática por regras (sem IA generativa): %d palavras, %d parágrafos, %d conectivos distintos, aderência ao tema de %d%%. "
                + "As notas são uma estimativa baseada nos critérios oficiais de %s e podem diferir de uma banca real. Para uma avaliação qualitativa, solicite a correção humana.",
                palavras, nParagrafos, conectivos, Math.round(aderencia * 100), grade.banca());
        return new Resultado(false, "", notas, com, geral, fortes, melhorias);
    }

    private static void put(Grade grade, Map<String, Integer> notas, String codigo, double valor) {
        notas.put(codigo, grade.criterio(codigo).ajustar(valor));
    }

    private static String comentarioPadrao(Criterio c, Integer nota) {
        int idx = Math.max(0, Math.min(c.niveis().size() - 1, (nota - c.minimo()) / c.passo()));
        return "Nível estimado - " + c.niveis().get(idx);
    }

    private static int contarInicioMinusculo(String texto) {
        Matcher m = Pattern.compile("[.!?]\\s+([a-zà-ú])").matcher(texto);
        int c = 0;
        while (m.find()) c++;
        return Math.min(c, 4);
    }

    /** Proporção das palavras-chave do tema que aparecem no texto. */
    private static double aderencia(String tema, String texto) {
        Set<String> chaves = new HashSet<>();
        for (String p : tema.split("[^a-z0-9]+")) if (p.length() >= 5 && !STOP.contains(p)) chaves.add(p.substring(0, Math.min(p.length(), 7)));
        if (chaves.isEmpty()) return 0.5;
        long presentes = chaves.stream().filter(texto::contains).count();
        return (double) presentes / chaves.size();
    }

    private static double maiorRepeticao(String texto, int palavras) {
        if (palavras == 0) return 0;
        Map<String, Integer> freq = new HashMap<>();
        for (String p : texto.split("[^a-z]+")) if (p.length() >= 5 && !STOP.contains(p)) freq.merge(p, 1, Integer::sum);
        return freq.values().stream().mapToInt(Integer::intValue).max().orElse(0) / (double) palavras;
    }

    private static double generoCarta(String t) {
        int tracos = (contar(t, List.of("prezad", "caro ", "cara ", "senhor", "senhora", "querid")) > 0 ? 1 : 0)
                + (contar(t, List.of("atenciosamente", "cordialmente", "respeitosamente", "abracos", "um abraco", "sinceramente")) > 0 ? 1 : 0)
                + (t.contains(" nome ") ? 1 : 0)
                + (Pattern.compile("(sao paulo|campinas|\\d{1,2} de [a-z]+ de \\d{4})").matcher(t).find() ? 1 : 0);
        return tracos / 4.0;
    }

    private static double generoUnicamp(String genero, String t) {
        List<String> marcas;
        if (genero.contains("carta")) marcas = List.of("prezad", "senhor", "excelentissim", "atenciosamente", "cordialmente", "venho", "denuncia");
        else if (genero.contains("discurso")) marcas = List.of("senhoras e senhores", "senhor delegado", "excelentissim", "caros", "delegacao", "plenario", "obrigad");
        else if (genero.contains("comunicado")) marcas = List.of("senhores pais", "responsaveis", "prezad", "comunicamos", "informamos", "direcao", "atenciosamente");
        else if (genero.contains("projeto de lei") || genero.contains("apresentacao")) marcas = List.of("senhoras e senhores", "deputad", "projeto de lei", "apresentamos", "coletivo", "excelentissim", "camara");
        else marcas = List.of("portanto", "dessa forma", "em suma", "nesse sentido");
        return Math.min(1.0, contar(t, marcas) / 3.0);
    }
}
