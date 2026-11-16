package com.itb.inf2cm.aprovest.model.services.redacao;

import java.util.List;
import java.util.Map;

/**
 * Grades OFICIAIS de correção de redação de cada banca.
 * <ul>
 *   <li>ENEM (INEP - Cartilha do Participante): 5 competências de 0 a 200 (níveis de 40 em 40), total 1000.</li>
 *   <li>FUVEST (critérios publicados pela FUVEST): 4 quesitos com notas de 1 a 4 e pesos 3, 2, 3 e 2 (máx. 40 pontos ponderados).</li>
 *   <li>UNICAMP (Diretrizes de Avaliação da Redação - Comvest): Pt 0-2, G 0-3, Lt 0-3 e CeC 1-4 (total 12).</li>
 * </ul>
 */
public final class GradeCorrecao {

    public record Criterio(String codigo, String nome, String descricao, int minimo, int maximo, int passo, int peso, List<String> niveis) {
        public boolean valido(int nota) {
            return nota >= minimo && nota <= maximo && (nota - minimo) % passo == 0;
        }

        public int ajustar(double nota) {
            int n = (int) Math.round((nota - minimo) / passo) * passo + minimo;
            return Math.max(minimo, Math.min(maximo, n));
        }
    }

    public record Grade(String sigla, String banca, String escala, int notaMaxima, String regrasAnulacao, List<Criterio> criterios) {
        public Criterio criterio(String codigo) {
            return criterios.stream().filter(c -> c.codigo().equalsIgnoreCase(codigo)).findFirst().orElse(null);
        }

        /** FUVEST usa soma ponderada; ENEM e UNICAMP, soma simples. */
        public int total(Map<String, Integer> notas) {
            return criterios.stream().mapToInt(c -> notas.getOrDefault(c.codigo(), c.minimo()) * c.peso()).sum();
        }
    }

    public static final Grade ENEM = new Grade("ENEM", "INEP - Exame Nacional do Ensino Médio",
            "0 a 1000 pontos (5 competências de 0 a 200)", 1000,
            "Nota zero total: fuga total ao tema; não obediência ao tipo dissertativo-argumentativo; texto com até 7 linhas; "
                    + "parte deliberadamente desconectada do tema; cópia dos textos motivadores sem produção própria. "
                    + "Desrespeito aos direitos humanos leva a nota 0 na Competência 5.",
            List.of(
                    new Criterio("C1", "Competência 1 - Domínio da modalidade escrita formal",
                            "Demonstrar domínio da modalidade escrita formal da língua portuguesa (ortografia, acentuação, concordância, regência, pontuação, estrutura sintática e registro).",
                            0, 200, 40, 1, List.of(
                            "0: desconhecimento da modalidade escrita formal.",
                            "40: domínio precário, com desvios gramaticais diversificados e frequentes.",
                            "80: domínio insuficiente, com muitos desvios.",
                            "120: domínio mediano, com alguns desvios.",
                            "160: bom domínio, com poucos desvios.",
                            "200: excelente domínio; desvios apenas excepcionais e sem reincidência.")),
                    new Criterio("C2", "Competência 2 - Compreensão da proposta e tipo textual",
                            "Compreender a proposta e aplicar conceitos das várias áreas do conhecimento para desenvolver o tema, dentro dos limites estruturais do texto dissertativo-argumentativo em prosa.",
                            0, 200, 40, 1, List.of(
                            "0: fuga ao tema ou não atendimento ao tipo dissertativo-argumentativo.",
                            "40: tangencia o tema ou apresenta domínio precário do tipo textual.",
                            "80: desenvolve o tema recorrendo à cópia dos motivadores ou com domínio insuficiente do tipo textual.",
                            "120: argumentação previsível e domínio mediano do tipo textual.",
                            "160: argumentação consistente, repertório produtivo e bom domínio do tipo textual.",
                            "200: argumentação consistente, repertório sociocultural legitimado, pertinente e produtivo; excelente domínio do tipo textual.")),
                    new Criterio("C3", "Competência 3 - Seleção e organização de argumentos",
                            "Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista (projeto de texto).",
                            0, 200, 40, 1, List.of(
                            "0: informações não relacionadas ao tema e sem defesa de ponto de vista.",
                            "40: informações pouco relacionadas ao tema ou incoerentes.",
                            "80: informações limitadas aos motivadores, pouco organizadas.",
                            "120: informações relacionadas ao tema, limitadas aos motivadores e pouco desenvolvidas.",
                            "160: informações organizadas, com indícios de autoria.",
                            "200: informações consistentes e organizadas, configurando autoria; projeto de texto estratégico.")),
                    new Criterio("C4", "Competência 4 - Mecanismos linguísticos de argumentação",
                            "Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação (coesão entre parágrafos e períodos).",
                            0, 200, 40, 1, List.of(
                            "0: não articula as informações.",
                            "40: articula as partes do texto de forma precária.",
                            "80: articulação insuficiente, com muitas inadequações e repertório limitado de recursos coesivos.",
                            "120: articulação mediana, com inadequações e repertório pouco diversificado.",
                            "160: articulação com poucas inadequações e repertório diversificado.",
                            "200: articulação muito bem feita, repertório diversificado de recursos coesivos.")),
                    new Criterio("C5", "Competência 5 - Proposta de intervenção",
                            "Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos: agente, ação, modo/meio, efeito/finalidade e detalhamento.",
                            0, 200, 40, 1, List.of(
                            "0: não apresenta proposta ou a proposta não se relaciona ao tema ou desrespeita os direitos humanos.",
                            "40: proposta vaga, precária ou relacionada apenas ao assunto.",
                            "80: proposta insuficiente (1 a 2 elementos) ou não articulada à discussão.",
                            "120: proposta mediana (3 elementos), relacionada ao tema e articulada à discussão.",
                            "160: proposta bem elaborada (4 elementos), articulada à discussão.",
                            "200: proposta muito bem elaborada e detalhada (5 elementos), articulada à discussão."))));

    public static final Grade FUVEST = new Grade("FUVEST", "FUVEST - Vestibular da USP",
            "Quesitos de 1 a 4 com pesos 3-2-3-2 (máximo de 40 pontos ponderados)", 40,
            "Nota zero: não abordagem do tema proposto; não atendimento à modalidade textual (tipo/gênero) da proposta escolhida; cópia integral ou parcial da coletânea.",
            List.of(
                    new Criterio("Q1", "Compreensão e desenvolvimento do tema, uso da coletânea e autoria (peso 3)",
                            "Compreender a frase temática e apropriar-se da coletânea de forma referenciada, com indícios de autoria e progressão do tema.",
                            1, 4, 1, 3, List.of(
                            "1: abordagem tangencial do tema, sem indícios de autoria e/ou com plágio da coletânea.",
                            "2: abordagem razoável, paráfrase superficial da coletânea e algum indício de autoria.",
                            "3: abordagem adequada, uso produtivo da coletânea e fortes indícios de autoria.",
                            "4: abordagem aprimorada, apropriação consistente da coletânea e robustos indícios de autoria.")),
                    new Criterio("Q2", "Atendimento à modalidade textual - tipo e gênero (peso 2)",
                            "Empregar a estrutura composicional do tipo e do gênero da proposta escolhida (ex.: dissertação ou carta).",
                            1, 4, 1, 2, List.of(
                            "1: atendimento parcial, com traços conflitantes de tipos e gêneros.",
                            "2: atendimento satisfatório, ainda que com traços de outras modalidades.",
                            "3: atendimento adequado; tipo e gênero nítidos, ainda que falte algum traço.",
                            "4: atendimento completo, com evidente domínio da estrutura composicional.")),
                    new Criterio("Q3", "Recursos linguísticos (coesão e coerência) e progressão textual (peso 3)",
                            "Relacionar fatos e argumentos com recursos coesivos que favoreçam a coerência e a progressão em prol do ponto de vista.",
                            1, 4, 1, 3, List.of(
                            "1: articulação razoável, poucos recursos e muitas falhas de composição.",
                            "2: articulação satisfatória, poucos recursos e algumas falhas.",
                            "3: boa articulação, recursos adequados e raras falhas.",
                            "4: ótima articulação, recursos aprimorados e composição consistente.")),
                    new Criterio("Q4", "Correção gramatical, convenção da escrita e adequação vocabular (peso 2)",
                            "Domínio da norma-padrão (morfologia, sintaxe, pontuação, ortografia e acentuação) e vocabulário adequado à modalidade.",
                            1, 4, 1, 2, List.of(
                            "1: rompe frequentemente convenções da escrita; domínio elementar.",
                            "2: rompe algumas vezes; domínio satisfatório.",
                            "3: rompe raramente; bom domínio.",
                            "4: rompe mínima e pontualmente; ótimo domínio."))));

    public static final Grade UNICAMP = new Grade("UNICAMP", "Comvest - Vestibular Unicamp",
            "Proposta temática (0-2) + Gênero (0-3) + Leitura dos textos (0-3) + Convenções da escrita e coesão (1-4) = 12 pontos", 12,
            "Redação anulada (zero): abordar outro tema; não cumprir nem a proposta temática nem o gênero; prevalência de cópias do enunciado e/ou dos textos da prova.",
            List.of(
                    new Criterio("Pt", "Proposta temática",
                            "Cumprimento das tarefas pedidas no enunciado (itens a e b) dentro do tema da proposta.",
                            0, 2, 1, 1, List.of("0: não cumpriu.", "1: cumpriu parcialmente.", "2: cumpriu plenamente.")),
                    new Criterio("G", "Gênero",
                            "Construção composicional (C), situação de produção (S) e interlocução solicitada (I) do gênero pedido.",
                            0, 3, 1, 1, List.of(
                            "0: não configura o gênero solicitado.",
                            "1: desenvolve mal o gênero: apresenta C, mas não S nem I, ou tem problemas em C.",
                            "2: desenvolve o gênero: configura C e S e/ou I.",
                            "3: desenvolve bem o gênero: explora C e configura S e I.")),
                    new Criterio("Lt", "Leitura do(s) texto(s) da coletânea",
                            "Uso crítico e produtivo da coletânea, compreensão global, inferências e ausência de erros de leitura.",
                            0, 3, 1, 1, List.of(
                            "0: uso insuficiente: menções ou paráfrases simples, cópia ou não uso.",
                            "1: uso inadequado: leitura superficial e/ou erro de leitura e/ou uso desvinculado do projeto de texto.",
                            "2: uso adequado: leitura mediana com compreensão global.",
                            "3: uso produtivo: leitura crítica, apropriação de acordo com o projeto de texto.")),
                    new Criterio("CeC", "Convenções da escrita e coesão",
                            "Escolhas lexicais e sintáticas e recursos coesivos adequados ao gênero.",
                            1, 4, 1, 1, List.of(
                            "1: escolhas inadequadas e/ou erros variados e recorrentes ou prevalência de paráfrase.",
                            "2: escolhas simples e/ou recursos coesivos simples, erros variados ou recorrentes.",
                            "3: escolhas adequadas e recursos coesivos adequados (admitem-se erros).",
                            "4: escolhas produtivas e recursos coesivos produtivos (erros eventuais)."))));

    private static final Map<String, Grade> GRADES = Map.of("ENEM", ENEM, "FUVEST", FUVEST, "UNICAMP", UNICAMP);

    public static Grade de(String sigla) {
        return GRADES.getOrDefault(sigla == null ? "ENEM" : sigla.toUpperCase(), ENEM);
    }

    private GradeCorrecao() {}
}
