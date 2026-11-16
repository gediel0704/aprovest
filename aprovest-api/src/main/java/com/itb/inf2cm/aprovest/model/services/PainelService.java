package com.itb.inf2cm.aprovest.model.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itb.inf2cm.aprovest.model.entity.*;
import com.itb.inf2cm.aprovest.model.repository.*;

/** RF07 Painel da Meta, UC010, UC018 Plano de estudo, UC019 / RF15 Histórico, RF12 Ranking e RF19 Relatório. */
@Service
public class PainelService {

    private final EstudoService estudoService;
    private final AcessoService acessoService;
    private final SessaoEstudoRepository sessaoRepository;
    private final RespostaRepository respostaRepository;
    private final ProficienciaRepository proficienciaRepository;
    private final RevisaoRepository revisaoRepository;
    private final AvaliacaoRedacaoRepository avaliacaoRepository;
    private final MaterialRepository materialRepository;
    private final LeituraMaterialRepository leituraRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final QuestaoRepository questaoRepository;
    private final BolsaMeritoRepository bolsaRepository;

    public PainelService(EstudoService estudoService, AcessoService acessoService, SessaoEstudoRepository sessaoRepository,
                         RespostaRepository respostaRepository, ProficienciaRepository proficienciaRepository,
                         RevisaoRepository revisaoRepository, AvaliacaoRedacaoRepository avaliacaoRepository,
                         MaterialRepository materialRepository, LeituraMaterialRepository leituraRepository,
                         DisciplinaRepository disciplinaRepository, QuestaoRepository questaoRepository,
                         BolsaMeritoRepository bolsaRepository) {
        this.estudoService = estudoService;
        this.acessoService = acessoService;
        this.sessaoRepository = sessaoRepository;
        this.respostaRepository = respostaRepository;
        this.proficienciaRepository = proficienciaRepository;
        this.revisaoRepository = revisaoRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.materialRepository = materialRepository;
        this.leituraRepository = leituraRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.questaoRepository = questaoRepository;
        this.bolsaRepository = bolsaRepository;
    }

    private String vestibularPadrao(Usuario u, String sigla) {
        if (sigla != null && !sigla.isBlank()) return sigla.toUpperCase();
        if (u.getVestibularesAlvo() != null && !u.getVestibularesAlvo().isBlank()) return u.getVestibularesAlvo().split(",")[0].trim();
        return "ENEM";
    }

    /** RF07 - Painel da Meta por vestibular. Não é nota oficial nem probabilidade de aprovação (UC010). */
    @Transactional
    public Map<String, Object> painel(Usuario u, String sigla) {
        Vestibular v = estudoService.vestibular(vestibularPadrao(u, sigla));
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("vestibular", Map.of("sigla", v.getSigla(), "nome", v.getNome(), "organizadora", v.getOrganizadora(), "site", v.getSiteOficial()));
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("curso", u.getCursoAlvo());
        meta.put("universidade", u.getUniversidadeAlvo());
        meta.put("vestibulares", u.getVestibularesAlvo());
        r.put("meta", meta);
        r.put("status", estudoService.status(u));

        // Evolução: diagnósticos e simulados concluídos
        List<SessaoEstudo> avaliacoes = sessaoRepository.findByUsuarioIdOrderByIniciadaEmDesc(u.getId()).stream()
                .filter(s -> s.getVestibular().getId().equals(v.getId()) && !"BANCA".equals(s.getModo())
                        && !"EM_ANDAMENTO".equals(s.getStatus()) && s.getNotaEstimada() != null)
                .toList();
        List<Map<String, Object>> evolucao = new ArrayList<>();
        for (int i = Math.min(avaliacoes.size(), 12) - 1; i >= 0; i--) {
            SessaoEstudo s = avaliacoes.get(i);
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("id", s.getId());
            p.put("data", s.getConcluidaEm());
            p.put("modo", s.getModo());
            p.put("tipo", s.getTipoSimulado());
            p.put("nota", s.getNotaEstimada());
            p.put("percentil", s.getPercentil());
            p.put("acertos", s.getAcertos());
            p.put("total", s.getTotalQuestoes());
            evolucao.add(p);
        }
        r.put("evolucao", evolucao);
        List<SessaoEstudo> ultimosSimulados = avaliacoes.stream().filter(s -> "SIMULADO".equals(s.getModo())).limit(3).toList();
        BigDecimal projecao = ultimosSimulados.isEmpty()
                ? avaliacoes.stream().findFirst().map(SessaoEstudo::getNotaEstimada).orElse(null)
                : BigDecimal.valueOf(ultimosSimulados.stream().mapToDouble(s -> s.getNotaEstimada().doubleValue()).average().orElse(0)).setScale(1, RoundingMode.HALF_UP);
        r.put("projecaoNota", projecao);
        r.put("escala", EstudoService.escala(v.getSigla()));
        r.put("ultimoPercentil", ultimosSimulados.stream().map(SessaoEstudo::getPercentil).filter(Objects::nonNull).findFirst().orElse(null));
        r.put("aviso", "Projeções e percentis são estimativas internas da plataforma, não notas oficiais nem probabilidade de aprovação.");

        // Desempenho por disciplina e proficiência por tópico
        List<Map<String, Object>> disciplinas = new ArrayList<>();
        for (Object[] row : respostaRepository.desempenhoPorDisciplina(u.getId(), v.getId())) {
            long total = ((Number) row[1]).longValue();
            long acertos = ((Number) row[2]).longValue();
            disciplinas.add(Map.of("disciplina", row[0], "total", total, "acertos", acertos,
                    "percentual", total == 0 ? 0 : Math.round(acertos * 100.0 / total)));
        }
        disciplinas.sort(Comparator.comparingLong(m -> ((Number) m.get("percentual")).longValue()));
        r.put("desempenhoDisciplinas", disciplinas);
        List<Map<String, Object>> topicos = proficienciaRepository.findByUsuarioId(u.getId()).stream()
                .filter(p -> p.getTentativas() > 0)
                .sorted(Comparator.comparing(Proficiencia::getRating))
                .map(p -> Map.<String, Object>of("topico", p.getTopico().getNome(), "disciplina", p.getTopico().getDisciplina().getNome(),
                        "rating", p.getRating(), "acertos", p.getAcertos(), "tentativas", p.getTentativas(),
                        "nivel", nivelProficiencia(p.getRating().doubleValue())))
                .toList();
        r.put("proficienciaTopicos", topicos);

        // Redações
        r.put("redacoes", avaliacaoRepository.findByUsuarioIdOrderBySolicitadaEmDesc(u.getId()).stream()
                .filter(a -> "CONCLUIDA".equals(a.getStatus())).limit(6)
                .map(a -> Map.of("id", a.getId(), "tipo", a.getTipo(), "vestibular", a.getVestibular().getSigla(),
                        "titulo", a.getTituloSnapshot(), "nota", a.getNotaTotal(), "maxima", a.getNotaMaxima(),
                        "data", a.getConcluidaEm()))
                .toList());

        // Atividade dos últimos 14 dias e sequência de estudo
        Map<LocalDate, Long> porDia = respostaRepository.datasRespostas(u.getId(), LocalDate.now().minusDays(60).atStartOfDay()).stream()
                .collect(Collectors.groupingBy(LocalDateTime::toLocalDate, TreeMap::new, Collectors.counting()));
        List<Map<String, Object>> atividade = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusDays(i);
            atividade.add(Map.of("data", d.toString(), "questoes", porDia.getOrDefault(d, 0L)));
        }
        r.put("atividade", atividade);
        int sequencia = 0;
        LocalDate dia = porDia.containsKey(LocalDate.now()) ? LocalDate.now() : LocalDate.now().minusDays(1);
        while (porDia.containsKey(dia)) {
            sequencia++;
            dia = dia.minusDays(1);
        }
        r.put("sequenciaDias", sequencia);
        r.put("totalRespondidas", respostaRepository.countByUsuarioId(u.getId()));
        r.put("totalAcertos", respostaRepository.countByUsuarioIdAndCorretaTrue(u.getId()));
        r.put("recomendacoes", recomendacoes(u, v, topicos));
        return r;
    }

    private static String nivelProficiencia(double rating) {
        if (rating < 950) return "Precisa de atenção";
        if (rating < 1050) return "Em desenvolvimento";
        if (rating < 1150) return "Bom";
        return "Excelente";
    }

    private List<Map<String, Object>> recomendacoes(Usuario u, Vestibular v, List<Map<String, Object>> topicos) {
        List<Map<String, Object>> rec = new ArrayList<>();
        if (!sessaoRepository.existsByUsuarioIdAndVestibularIdAndModoAndStatus(u.getId(), v.getId(), "DIAGNOSTICO", "CONCLUIDA")) {
            rec.add(Map.of("tipo", "DIAGNOSTICO", "titulo", "Faça o diagnóstico inicial de " + v.getSigla(),
                    "descricao", "30 questões oficiais para calibrar seu nível por disciplina.", "link", "/aluno/diagnostico"));
        }
        long revisoes = revisaoRepository.countByUsuarioIdAndProximaRevisaoLessThanEqual(u.getId(), LocalDate.now());
        if (revisoes > 0) {
            rec.add(Map.of("tipo", "REVISAO", "titulo", revisoes + " questão(ões) para revisar hoje",
                    "descricao", "A repetição espaçada reforça o que você errou. Elas entram na sua banca diária.", "link", "/aluno/banca"));
        }
        topicos.stream().limit(3).forEach(t -> rec.add(Map.of("tipo", "TOPICO",
                "titulo", "Reforce: " + t.get("topico"),
                "descricao", t.get("disciplina") + " - " + t.get("acertos") + " acertos em " + t.get("tentativas") + " tentativas.",
                "link", "/aluno/biblioteca?busca=" + t.get("disciplina"))));
        if (rec.isEmpty()) {
            rec.add(Map.of("tipo", "BANCA", "titulo", "Mantenha o ritmo!", "descricao", "Responda sua banca diária e faça o simulado da semana.", "link", "/aluno/banca"));
        }
        return rec;
    }

    /** UC018 - Plano de estudo: heurística pelas taxas recentes de acerto (últimos 30 dias), não TRI. */
    public Map<String, Object> planoEstudo(Usuario u, String sigla) {
        Vestibular v = estudoService.vestibular(vestibularPadrao(u, sigla));
        Map<String, long[]> recentes = new HashMap<>();
        for (Object[] row : respostaRepository.desempenhoRecentePorDisciplina(u.getId(), v.getId(), LocalDateTime.now().minusDays(30))) {
            recentes.put((String) row[0], new long[]{((Number) row[1]).longValue(), ((Number) row[2]).longValue()});
        }
        Set<Long> lidos = leituraRepository.findByUsuarioId(u.getId()).stream().filter(LeituraMaterial::isConcluido)
                .map(l -> l.getMaterial().getId()).collect(Collectors.toSet());
        Set<String> disciplinasDoVestibular = new HashSet<>(questaoRepository.disciplinasDoVestibular(v.getId()));
        List<Map<String, Object>> itens = new ArrayList<>();
        for (Disciplina d : disciplinaRepository.findByCodStatusTrueOrderByNomeAsc()) {
            if (!disciplinasDoVestibular.contains(d.getNome())) continue;
            long[] c = recentes.get(d.getNome());
            Double taxa = c == null || c[0] == 0 ? null : c[1] * 100.0 / c[0];
            String prioridade = taxa == null ? "SEM_DADOS" : taxa < 50 ? "ALTA" : taxa < 70 ? "MEDIA" : "BAIXA";
            List<Map<String, Object>> conteudos = materialRepository.findByDisciplinaIdAndOficialFalseAndCodStatusTrue(d.getId()).stream()
                    .filter(m -> !lidos.contains(m.getId()))
                    .map(m -> Map.<String, Object>of("id", m.getId(), "titulo", m.getTitulo()))
                    .toList();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("disciplina", d.getNome());
            item.put("area", d.getArea());
            item.put("respondidas30d", c == null ? 0 : c[0]);
            item.put("taxaAcerto30d", taxa == null ? null : Math.round(taxa));
            item.put("prioridade", prioridade);
            item.put("questoesSugeridasSemana", switch (prioridade) { case "ALTA" -> 25; case "MEDIA" -> 15; case "BAIXA" -> 8; default -> 10; });
            item.put("conteudosNaoConcluidos", conteudos);
            itens.add(item);
        }
        List<String> ordem = List.of("ALTA", "SEM_DADOS", "MEDIA", "BAIXA");
        itens.sort(Comparator.comparingInt(m -> ordem.indexOf((String) m.get("prioridade"))));
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("vestibular", v.getSigla());
        r.put("criterio", "Prioridade calculada pelas taxas de acerto dos últimos 30 dias: abaixo de 50% = alta, de 50% a 70% = média, acima de 70% = baixa.");
        r.put("orientacaoInicial", recentes.isEmpty() ? "Ainda não há respostas recentes. Comece pelo diagnóstico e pela banca diária para personalizar o plano." : null);
        r.put("disciplinas", itens);
        return r;
    }

    /** UC019 / RF15 - Histórico completo. */
    public Map<String, Object> historico(Usuario u, int pagina) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("sessoes", estudoService.historicoSessoes(u));
        var respostas = respostaRepository.findByUsuarioIdOrderByRespondidaEmDesc(u.getId(), PageRequest.of(pagina, 30));
        r.put("respostas", respostas.getContent().stream().map(x -> Map.of(
                "data", x.getRespondidaEm(), "vestibular", x.getQuestao().getVestibular().getSigla(),
                "disciplina", x.getQuestao().getDisciplina().getNome(), "fonte", x.getQuestao().getFonteDescricao(),
                "marcada", x.getAlternativaMarcada(), "correta", x.isCorreta(), "modo", x.getSessao().getModo())).toList());
        r.put("totalRespostas", respostas.getTotalElements());
        r.put("paginas", respostas.getTotalPages());
        r.put("avaliacoes", avaliacaoRepository.findByUsuarioIdOrderBySolicitadaEmDesc(u.getId()));
        return r;
    }

    /** RF12 - Ranking mensal (somente alunos que consentiram com a exibição). */
    public Map<String, Object> ranking(Usuario u, String mes) {
        YearMonth ym = mes == null || mes.isBlank() ? YearMonth.now() : YearMonth.parse(mes);
        List<Object[]> linhas = respostaRepository.ranking(ym.atDay(1).atStartOfDay(), ym.plusMonths(1).atDay(1).atStartOfDay());
        List<Map<String, Object>> lista = new ArrayList<>();
        Integer minhaPosicao = null;
        for (int i = 0; i < linhas.size(); i++) {
            Object[] l = linhas.get(i);
            Long id = ((Number) l[0]).longValue();
            if (id.equals(u.getId())) minhaPosicao = i + 1;
            if (i < 100) {
                lista.add(Map.of("posicao", i + 1, "nome", abreviar((String) l[1]), "pontos",
                        BigDecimal.valueOf(((Number) l[2]).doubleValue()).setScale(1, RoundingMode.HALF_UP),
                        "acertos", l[3], "voce", id.equals(u.getId())));
            }
        }
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("mes", ym.toString());
        r.put("ranking", lista);
        r.put("minhaPosicao", minhaPosicao);
        r.put("participando", u.isRankingPublico());
        r.put("regra", "Pontuação = soma da dificuldade calibrada das questões acertadas no mês ÷ 100. Os 100 primeiros do mês encerrado recebem 1 mês de Plano Pro (bolsa por mérito).");
        r.put("bolsasDoMesAnterior", bolsaRepository.findByMesReferenciaOrderByPosicaoAsc(ym.minusMonths(1).toString()).size());
        return r;
    }

    private static String abreviar(String nome) {
        String[] p = nome.trim().split("\\s+");
        return p.length == 1 ? p[0] : p[0] + " " + p[p.length - 1].charAt(0) + ".";
    }

    /** RF19 - Dados consolidados para o relatório em PDF (gerado no navegador). */
    @Transactional
    public Map<String, Object> relatorio(Usuario u, String sigla) {
        Map<String, Object> r = painel(u, sigla);
        r.put("aluno", Map.of("nome", u.getNome(), "email", u.getEmail()));
        r.put("plano", planoEstudo(u, sigla));
        r.put("acessos", Map.of("pro", acessoService.isPro(u)));
        r.put("geradoEm", LocalDateTime.now());
        return r;
    }
}
