package com.itb.inf2cm.aprovest.model.services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.StructuredOutputConfig;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.itb.inf2cm.aprovest.exceptions.BadRequest;
import com.itb.inf2cm.aprovest.exceptions.NotFound;
import com.itb.inf2cm.aprovest.model.entity.*;
import com.itb.inf2cm.aprovest.model.enums.TipoUsuario;
import com.itb.inf2cm.aprovest.model.repository.*;
import com.itb.inf2cm.aprovest.model.services.redacao.CorrecaoIaService;

/** Área administrativa: UC034, UC035, UC036, UC042 e RF18. */
@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    public record SugestaoTema(@JsonPropertyDescription("Título do tema no estilo da banca") String titulo,
                               @JsonPropertyDescription("ENEM, FUVEST ou UNICAMP") String vestibular,
                               @JsonPropertyDescription("Gênero textual sugerido") String genero,
                               @JsonPropertyDescription("Proposta/comando completo da redação") String proposta,
                               @JsonPropertyDescription("Por que este tema é tendência, relacionando com provas recentes") String justificativa) {}

    public record SugestaoQuestao(String disciplina, String topico,
                                  @JsonPropertyDescription("Ideia de questão a ser elaborada pela equipe") String ideia,
                                  @JsonPropertyDescription("Justificativa baseada nos dados de desempenho e nas provas recentes") String justificativa) {}

    public record Sugestoes(List<SugestaoTema> temas, List<SugestaoQuestao> questoes, String observacao) {}

    private final UsuarioRepository usuarioRepository;
    private final AssinaturaRepository assinaturaRepository;
    private final QuestaoRepository questaoRepository;
    private final RespostaRepository respostaRepository;
    private final SessaoEstudoRepository sessaoRepository;
    private final AvaliacaoRedacaoRepository avaliacaoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final BolsaMeritoRepository bolsaRepository;
    private final TemaRedacaoRepository temaRepository;
    private final EstadoIARepository estadoRepository;
    private final ProficienciaRepository proficienciaRepository;
    private final AcessoService acessoService;
    private final NotificacaoService notificacaoService;
    private final CorrecaoIaService correcaoIaService;
    private final VestibularRepository vestibularRepository;

    @Value("${app.ia.anthropic-api-key:}") private String apiKey;
    @Value("${app.ia.modelo:claude-opus-5-5}") private String modelo;

    public AdminService(UsuarioRepository usuarioRepository, AssinaturaRepository assinaturaRepository,
                        QuestaoRepository questaoRepository, RespostaRepository respostaRepository,
                        SessaoEstudoRepository sessaoRepository, AvaliacaoRedacaoRepository avaliacaoRepository,
                        PagamentoRepository pagamentoRepository, BolsaMeritoRepository bolsaRepository,
                        TemaRedacaoRepository temaRepository, EstadoIARepository estadoRepository,
                        ProficienciaRepository proficienciaRepository, AcessoService acessoService,
                        NotificacaoService notificacaoService, CorrecaoIaService correcaoIaService,
                        VestibularRepository vestibularRepository) {
        this.usuarioRepository = usuarioRepository;
        this.assinaturaRepository = assinaturaRepository;
        this.questaoRepository = questaoRepository;
        this.respostaRepository = respostaRepository;
        this.sessaoRepository = sessaoRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.bolsaRepository = bolsaRepository;
        this.temaRepository = temaRepository;
        this.estadoRepository = estadoRepository;
        this.proficienciaRepository = proficienciaRepository;
        this.acessoService = acessoService;
        this.notificacaoService = notificacaoService;
        this.correcaoIaService = correcaoIaService;
        this.vestibularRepository = vestibularRepository;
    }

    /** UC035 - Relatórios administrativos (pedagógicos e financeiros). */
    public Map<String, Object> resumo() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("usuarios", Map.of(
                "alunos", usuarioRepository.countByTipoUsuario(TipoUsuario.ALUNO),
                "corretores", usuarioRepository.countByTipoUsuario(TipoUsuario.CORRETOR),
                "admins", usuarioRepository.countByTipoUsuario(TipoUsuario.ADMIN),
                "proAtivos", assinaturaRepository.contarProAtivos(LocalDateTime.now())));
        Map<String, Long> porVest = new LinkedHashMap<>();
        for (Object[] row : questaoRepository.contarPorVestibular()) porVest.put((String) row[0], ((Number) row[1]).longValue());
        r.put("questoesPorVestibular", porVest);
        r.put("engajamento", Map.of(
                "respostas7d", respostaRepository.countByRespondidaEmAfter(LocalDateTime.now().minusDays(7)),
                "respostas30d", respostaRepository.countByRespondidaEmAfter(LocalDateTime.now().minusDays(30)),
                "simuladosConcluidos", sessaoRepository.countByModoAndStatus("SIMULADO", "CONCLUIDA"),
                "diagnosticosConcluidos", sessaoRepository.countByModoAndStatus("DIAGNOSTICO", "CONCLUIDA")));
        r.put("redacoes", Map.of(
                "iaConcluidas", avaliacaoRepository.countByTipoAndStatus("IA", "CONCLUIDA"),
                "humanasPendentes", avaliacaoRepository.countByTipoAndStatus("HUMANA", "PENDENTE"),
                "humanasAtribuidas", avaliacaoRepository.countByTipoAndStatus("HUMANA", "ATRIBUIDA"),
                "humanasConcluidas", avaliacaoRepository.countByTipoAndStatus("HUMANA", "CONCLUIDA")));
        List<Pagamento> pagamentos = pagamentoRepository.findByStatusOrderByCriadoEmDesc("APROVADO");
        Map<String, BigDecimal> receitaMes = new TreeMap<>();
        for (Pagamento p : pagamentos) receitaMes.merge(YearMonth.from(p.getCriadoEm()).toString(), p.getValor(), BigDecimal::add);
        r.put("financeiro", Map.of(
                "receitaTotal", pagamentos.stream().map(Pagamento::getValor).reduce(BigDecimal.ZERO, BigDecimal::add),
                "receitaPorMes", receitaMes,
                "transacoes", pagamentos.size(),
                "aviso", "Valores do checkout de demonstração: registros de acesso concedido, não receita real."));
        r.put("ultimosPagamentos", pagamentos.stream().limit(15).map(p -> Map.of("data", p.getCriadoEm(), "descricao", p.getDescricao(),
                "valor", p.getValor(), "metodo", p.getMetodo(), "aluno", p.getUsuario().getNome())).toList());
        r.put("questoesMaisErradas", questaoRepository.maisErradas(3, org.springframework.data.domain.PageRequest.of(0, 10)).stream()
                .map(q -> Map.of("id", q.getId(), "fonte", q.getFonteDescricao(), "disciplina", q.getDisciplina().getNome(),
                        "taxaAcerto", q.getTaxaAcerto(), "respostas", q.getTotalRespostas())).toList());
        r.put("ia", Map.of("configurada", correcaoIaService.iaConfigurada(), "modelo", correcaoIaService.modelo(), "pausada", correcaoIaService.estado().isPausado()));
        return r;
    }

    // ------------------------- Correção humana (UC034) -------------------------
    public List<AvaliacaoRedacao> correcoes(String status) {
        List<String> st = status == null || status.isBlank() ? List.of("PENDENTE", "ATRIBUIDA", "CONCLUIDA") : List.of(status);
        return avaliacaoRepository.findByTipoAndStatusInOrderBySolicitadaEmAsc("HUMANA", st);
    }

    public List<Map<String, Object>> corretores() {
        return usuarioRepository.findByTipoUsuarioAndCodStatusTrue(TipoUsuario.CORRETOR).stream().map(c -> Map.<String, Object>of(
                "id", c.getId(), "nome", c.getNome(), "email", c.getEmail(),
                "fila", avaliacaoRepository.findByCorretorIdAndStatusInOrderByPrazoAsc(c.getId(), List.of("ATRIBUIDA")).size())).toList();
    }

    @Transactional
    public AvaliacaoRedacao atribuir(Long avaliacaoId, Long corretorId) {
        AvaliacaoRedacao a = avaliacaoRepository.findById(avaliacaoId).orElseThrow(() -> new NotFound("Solicitação não encontrada."));
        if (!"HUMANA".equals(a.getTipo())) throw new BadRequest("Somente correções humanas podem ser atribuídas.");
        if ("CONCLUIDA".equals(a.getStatus())) throw new BadRequest("Correção já concluída: não é reatribuída.");
        Usuario corretor = usuarioRepository.findById(corretorId).orElseThrow(() -> new NotFound("Corretor não encontrado."));
        if (corretor.getTipo() != TipoUsuario.CORRETOR || !corretor.isCodStatus()) throw new BadRequest("O usuário escolhido não é um corretor ativo.");
        a.setCorretor(corretor);
        a.setStatus("ATRIBUIDA");
        avaliacaoRepository.save(a);
        notificacaoService.notificar(corretor, "Nova redação atribuída", "A redação \"" + a.getTituloSnapshot() + "\" foi atribuída a você. Prazo: "
                + a.getPrazo().toLocalDate(), "SISTEMA", "/corretor/correcao/" + a.getId());
        return a;
    }

    // ------------------------- Bolsas por mérito (RF12 / UC036) -------------------------
    @Transactional
    public Map<String, Object> concederBolsas(String mes) {
        YearMonth ym = YearMonth.parse(mes);
        if (!ym.isBefore(YearMonth.now())) throw new BadRequest("Só é possível conceder bolsas de um mês já encerrado.");
        if (bolsaRepository.existsByMesReferencia(ym.toString())) throw new BadRequest("As bolsas de " + ym + " já foram concedidas.");
        List<Object[]> ranking = respostaRepository.ranking(ym.atDay(1).atStartOfDay(), ym.plusMonths(1).atDay(1).atStartOfDay());
        int posicao = 0;
        List<BolsaMerito> concedidas = new ArrayList<>();
        for (Object[] linha : ranking) {
            if (posicao >= 100) break;
            Usuario u = usuarioRepository.findById(((Number) linha[0]).longValue()).orElse(null);
            if (u == null || u.getTipo() != TipoUsuario.ALUNO) continue;
            posicao++;
            BolsaMerito b = new BolsaMerito();
            b.setUsuario(u);
            b.setMesReferencia(ym.toString());
            b.setPosicao(posicao);
            b.setPontuacao(BigDecimal.valueOf(((Number) linha[2]).doubleValue()));
            concedidas.add(bolsaRepository.save(b));
            acessoService.ativarPro(u, 30, "BOLSA");
            notificacaoService.notificar(u, "Parabéns! Você ganhou uma bolsa por mérito",
                    "Você ficou em " + posicao + "º lugar no ranking de " + ym + " e ganhou 1 mês de Plano Pro.", "SISTEMA", "/aluno/acessos");
        }
        return Map.of("mes", ym.toString(), "bolsasConcedidas", concedidas.size(),
                "observacao", concedidas.isEmpty() ? "Nenhum aluno elegível no ranking do mês." : "Plano Pro de 30 dias ativado para os premiados.");
    }

    public List<BolsaMerito> bolsas() {
        return bolsaRepository.findTop200ByOrderByConcedidaEmDescPosicaoAsc();
    }

    // ------------------------- Serviço de IA (UC042) -------------------------
    @Transactional
    public EstadoIA pausarIa(Usuario admin, String motivo) {
        EstadoIA e = correcaoIaService.estado();
        e.setPausado(true);
        e.setMotivo(motivo == null || motivo.isBlank() ? "Pausa operacional" : motivo);
        e.setAtualizadoEm(LocalDateTime.now());
        e.setAtualizadoPor(admin.getEmail());
        return estadoRepository.save(e);
    }

    @Transactional
    public EstadoIA retomarIa(Usuario admin) {
        EstadoIA e = correcaoIaService.estado();
        e.setPausado(false);
        e.setMotivo(null);
        e.setAtualizadoEm(LocalDateTime.now());
        e.setAtualizadoPor(admin.getEmail());
        return estadoRepository.save(e);
    }

    public Map<String, Object> estadoIa() {
        EstadoIA e = correcaoIaService.estado();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("pausado", e.isPausado());
        m.put("motivo", e.getMotivo());
        m.put("atualizadoEm", e.getAtualizadoEm());
        m.put("atualizadoPor", e.getAtualizadoPor());
        m.put("configurada", correcaoIaService.iaConfigurada());
        m.put("modelo", correcaoIaService.iaConfigurada() ? correcaoIaService.modelo() : "corretor-offline (sem chave de API)");
        return m;
    }

    // ------------------------- RF18 - Sugestões de temas e questões com IA -------------------------
    @Transactional(readOnly = true)
    public Sugestoes sugestoes() {
        List<TemaRedacao> temas = temaRepository.findByCodStatusTrueOrderByAnoDescIdAsc();
        Map<String, double[]> desempenhoTopico = new HashMap<>();
        for (Proficiencia p : proficienciaRepository.findAll()) {
            String chave = p.getTopico().getDisciplina().getNome() + " / " + p.getTopico().getNome();
            double[] acc = desempenhoTopico.computeIfAbsent(chave, k -> new double[2]);
            acc[0] += p.getAcertos();
            acc[1] += p.getTentativas();
        }
        List<Map.Entry<String, double[]>> fracos = desempenhoTopico.entrySet().stream().filter(e -> e.getValue()[1] >= 3)
                .sorted(Comparator.comparingDouble(e -> e.getValue()[0] / e.getValue()[1])).limit(6).toList();
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                return sugestoesIa(temas, fracos);
            } catch (Exception e) {
                log.warn("Falha ao gerar sugestões com IA: {}", e.getMessage());
            }
        }
        return sugestoesOffline(temas, fracos);
    }

    private Sugestoes sugestoesIa(List<TemaRedacao> temas, List<Map.Entry<String, double[]>> fracos) {
        StringBuilder sb = new StringBuilder("Temas oficiais recentes cadastrados (banca, ano, título):\n");
        temas.forEach(t -> sb.append("- ").append(t.getVestibular().getSigla()).append(" ").append(t.getAno()).append(": ").append(t.getTitulo()).append("\n"));
        sb.append("\nTópicos com menor taxa de acerto entre os alunos da plataforma:\n");
        fracos.forEach(e -> sb.append("- ").append(e.getKey()).append(": ")
                .append(Math.round(e.getValue()[0] * 100 / e.getValue()[1])).append("% de acerto em ").append((int) e.getValue()[1]).append(" respostas\n"));
        sb.append("""

                Com base nesses dados e no padrão das provas recentes do ENEM (INEP), da FUVEST e da Unicamp (Comvest), sugira:
                - 3 novos temas de redação (um para cada banca), no estilo e no gênero característicos de cada uma, com proposta completa;
                - 4 ideias de questões para reforçar os tópicos com pior desempenho.
                As sugestões serão revisadas pela equipe pedagógica antes de qualquer publicação; não as apresente como questões oficiais.
                """);
        AnthropicClient client = AnthropicOkHttpClient.builder().apiKey(apiKey).build();
        var params = MessageCreateParams.builder()
                .model(modelo)
                .maxTokens(16000L)
                .system("Você é um especialista em vestibulares brasileiros que apoia a equipe pedagógica do AproVest. Responda em português do Brasil.")
                .addUserMessage(sb.toString())
                .outputConfig(StructuredOutputConfig.<Sugestoes>builder().effort(OutputConfig.Effort.MEDIUM).format(Sugestoes.class).build())
                .build();
        return client.messages().create(params).content().stream().flatMap(cb -> cb.text().stream()).map(t -> t.text())
                .findFirst().orElseThrow(() -> new IllegalStateException("Resposta vazia"));
    }

    private Sugestoes sugestoesOffline(List<TemaRedacao> temas, List<Map.Entry<String, double[]>> fracos) {
        List<SugestaoTema> st = List.of(
                new SugestaoTema("Desafios para a inclusão digital de idosos no Brasil", "ENEM", "Dissertativo-argumentativo",
                        "Redija texto dissertativo-argumentativo sobre o tema \"Desafios para a inclusão digital de idosos no Brasil\", apresentando proposta de intervenção que respeite os direitos humanos.",
                        "Os temas recentes do ENEM tratam de grupos invisibilizados e de cidadania (2021, 2022, 2023 e 2024)."),
                new SugestaoTema("Os limites da memória coletiva", "FUVEST", "Dissertativo-argumentativo",
                        "Redija uma dissertação em que exponha seu ponto de vista sobre o tema: Os limites da memória coletiva.",
                        "A FUVEST tem proposto temas filosóficos e abstratos (solidariedade em 2025, perdão em 2026)."),
                new SugestaoTema("Carta aberta à Câmara Municipal sobre arborização urbana", "UNICAMP", "Carta aberta",
                        "Você integra o grêmio estudantil e escreve uma carta aberta à Câmara Municipal: a) apresentando efeitos das ilhas de calor no bairro; b) propondo ações de arborização, com base na coletânea.",
                        "A Unicamp exige gêneros com interlocução definida (carta-denúncia, discurso, comunicado, apresentação de PL)."));
        List<SugestaoQuestao> sq = new ArrayList<>();
        for (Map.Entry<String, double[]> e : fracos) {
            String[] partes = e.getKey().split(" / ");
            sq.add(new SugestaoQuestao(partes[0], partes.length > 1 ? partes[1] : "", "Elaborar item contextualizado de nível intermediário sobre " + e.getKey() + ".",
                    "Taxa de acerto de " + Math.round(e.getValue()[0] * 100 / e.getValue()[1]) + "% na plataforma."));
        }
        return new Sugestoes(st, sq, "Sugestões geradas sem IA generativa (nenhuma chave de API configurada), a partir das tendências dos "
                + temas.size() + " temas oficiais cadastrados e do desempenho dos alunos.");
    }

    @Transactional
    public TemaRedacao aprovarSugestao(SugestaoTema s) {
        TemaRedacao t = new TemaRedacao();
        t.setTitulo(s.titulo());
        t.setProposta(s.proposta());
        t.setGenero(s.genero());
        t.setOrigem("SUGERIDO_IA");
        t.setAno(LocalDate.now().getYear());
        t.setFonteDescricao("Tema sugerido por IA e aprovado pela equipe AproVest (não oficial)");
        t.setVestibular(vestibularRepository.findBySigla(s.vestibular() == null ? "" : s.vestibular().toUpperCase())
                .orElseThrow(() -> new BadRequest("Vestibular da sugestão inválido.")));
        return temaRepository.save(t);
    }
}
