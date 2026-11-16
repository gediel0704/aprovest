package com.itb.inf2cm.aprovest.model.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.exceptions.BadRequest;
import com.itb.inf2cm.aprovest.exceptions.NotFound;
import com.itb.inf2cm.aprovest.model.entity.*;
import com.itb.inf2cm.aprovest.model.repository.*;

/**
 * Motor de estudo do AproVest.
 * <ul>
 *   <li>RF02 / UC011 - Diagnóstico inicial com 30 questões oficiais distribuídas por disciplina.</li>
 *   <li>RF03 / UC012 - Banca adaptativa diária: itens calibrados pelo algoritmo Elo (modelo logístico de
 *       1 parâmetro da TRI, o mesmo princípio da Teoria de Resposta ao Item), priorizando tópicos fracos.</li>
 *   <li>RF17 - Repetição espaçada: erro = revisão no dia seguinte; acerto = revisão em 7 dias (intervalo cresce).</li>
 *   <li>RF06 / UC013 - Simulados cronometrados (semanal e mensal), com prazo validado no servidor,
 *       nota projetada na escala de cada vestibular e percentil com no mínimo 5 comparáveis.</li>
 * </ul>
 */
@Service
public class EstudoService {

    public static final int QTD_DIAGNOSTICO = 30;
    public static final int QTD_BANCA = 10;
    public static final int QTD_SIMULADO_SEMANAL = 30;
    public static final int QTD_SIMULADO_MENSAL = 60;
    public static final int MIN_SIMULADO = 30;
    public static final int MINUTOS_SEMANAL = 60;
    public static final int MINUTOS_MENSAL = 120;
    public static final int MIN_COMPARAVEIS = 5;

    private static final double K_ALUNO = 32;
    private static final double K_ALUNO_DIAGNOSTICO = 48;
    private static final double K_ITEM = 12;

    private final QuestaoRepository questaoRepository;
    private final SessaoEstudoRepository sessaoRepository;
    private final SessaoQuestaoRepository sessaoQuestaoRepository;
    private final RespostaRepository respostaRepository;
    private final ProficienciaRepository proficienciaRepository;
    private final RevisaoRepository revisaoRepository;
    private final VestibularRepository vestibularRepository;
    private final AcessoService acessoService;
    private final NotificacaoService notificacaoService;
    private final Random random = new Random();

    public EstudoService(QuestaoRepository questaoRepository, SessaoEstudoRepository sessaoRepository,
                         SessaoQuestaoRepository sessaoQuestaoRepository, RespostaRepository respostaRepository,
                         ProficienciaRepository proficienciaRepository, RevisaoRepository revisaoRepository,
                         VestibularRepository vestibularRepository, AcessoService acessoService,
                         NotificacaoService notificacaoService) {
        this.questaoRepository = questaoRepository;
        this.sessaoRepository = sessaoRepository;
        this.sessaoQuestaoRepository = sessaoQuestaoRepository;
        this.respostaRepository = respostaRepository;
        this.proficienciaRepository = proficienciaRepository;
        this.revisaoRepository = revisaoRepository;
        this.vestibularRepository = vestibularRepository;
        this.acessoService = acessoService;
        this.notificacaoService = notificacaoService;
    }

    public Vestibular vestibular(String sigla) {
        if (sigla == null) throw new BadRequest("Escolha o vestibular.");
        return vestibularRepository.findBySigla(sigla.trim().toUpperCase())
                .orElseThrow(() -> new NotFound("Vestibular não encontrado: " + sigla));
    }

    // =====================================================================
    // Situação do aluno (cotas, diagnóstico, sessões abertas)
    // =====================================================================
    public Map<String, Object> status(Usuario u) {
        Map<String, Object> r = new LinkedHashMap<>();
        boolean pro = acessoService.isPro(u);
        r.put("pro", pro);
        r.put("questoesHoje", acessoService.questoesBancaHoje(u));
        r.put("limiteQuestoesDia", acessoService.limiteQuestoesDia(u));
        r.put("creditos", acessoService.carteira(u).getSaldo());
        r.put("revisoesPendentes", revisaoRepository.countByUsuarioIdAndProximaRevisaoLessThanEqual(u.getId(), LocalDate.now()));
        LocalDateTime inicioSemana = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        r.put("simuladoSemanalDisponivel", pro || sessaoRepository.countByUsuarioIdAndModoAndTipoSimuladoAndIniciadaEmAfter(u.getId(), "SIMULADO", "SEMANAL", inicioSemana) == 0);
        r.put("simuladoMensalDisponivel", pro || sessaoRepository.countByUsuarioIdAndModoAndTipoSimuladoAndIniciadaEmAfter(u.getId(), "SIMULADO", "MENSAL", inicioMes) == 0);
        List<Map<String, Object>> porVestibular = new ArrayList<>();
        for (Vestibular v : vestibularRepository.findByCodStatusTrueOrderByIdAsc()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sigla", v.getSigla());
            m.put("nome", v.getNome());
            m.put("questoesDisponiveis", questaoRepository.countByVestibularIdAndCodStatusTrue(v.getId()));
            m.put("diagnosticoConcluido", sessaoRepository.existsByUsuarioIdAndVestibularIdAndModoAndStatus(u.getId(), v.getId(), "DIAGNOSTICO", "CONCLUIDA"));
            for (String modo : List.of("DIAGNOSTICO", "BANCA", "SIMULADO")) {
                sessaoRepository.findFirstByUsuarioIdAndVestibularIdAndModoAndStatusOrderByIniciadaEmDesc(u.getId(), v.getId(), modo, "EM_ANDAMENTO")
                        .ifPresent(s -> m.put("sessaoAberta" + modo, s.getId()));
            }
            porVestibular.add(m);
        }
        r.put("vestibulares", porVestibular);
        return r;
    }

    // =====================================================================
    // Início das sessões
    // =====================================================================
    @Transactional
    public Map<String, Object> iniciarDiagnostico(Usuario u, Requests.IniciarSessao req) {
        Vestibular v = vestibular(req.vestibular());
        var aberta = sessaoRepository.findFirstByUsuarioIdAndVestibularIdAndModoAndStatusOrderByIniciadaEmDesc(u.getId(), v.getId(), "DIAGNOSTICO", "EM_ANDAMENTO");
        if (aberta.isPresent()) return visao(u, aberta.get());
        List<Questao> itens = questaoRepository.findByVestibularIdAndCodStatusTrue(v.getId());
        if (itens.size() < QTD_DIAGNOSTICO) {
            throw new BadRequest("Itens insuficientes para o diagnóstico de " + v.getSigla() + " (mínimo de " + QTD_DIAGNOSTICO + ").");
        }
        List<Questao> escolhidas = selecionarPorDisciplina(itens, QTD_DIAGNOSTICO, 1050);
        return visao(u, criarSessao(u, v, "DIAGNOSTICO", null, escolhidas, null));
    }

    @Transactional
    public Map<String, Object> iniciarBanca(Usuario u, Requests.IniciarSessao req) {
        Vestibular v = vestibular(req.vestibular());
        var aberta = sessaoRepository.findFirstByUsuarioIdAndVestibularIdAndModoAndStatusOrderByIniciadaEmDesc(u.getId(), v.getId(), "BANCA", "EM_ANDAMENTO");
        if (aberta.isPresent()) return visao(u, aberta.get());

        long restante = acessoService.limiteQuestoesDia(u) - acessoService.questoesBancaHoje(u);
        if (restante <= 0) {
            throw new BadRequest(acessoService.isPro(u)
                    ? "Você atingiu o limite diário de questões. Volte amanhã!"
                    : "Você usou as " + acessoService.limiteQuestoesDia(u) + " questões gratuitas de hoje (RN02). Assine o Plano Pro para continuar.");
        }
        int quantidade = (int) Math.min(QTD_BANCA, restante);
        List<Questao> itens = questaoRepository.findByVestibularIdAndCodStatusTrue(v.getId());
        Set<Long> acertadasRecentes = new HashSet<>(respostaRepository.questoesAcertadasDesde(u.getId(), LocalDateTime.now().minusDays(30)));
        Map<Long, Double> ratingTopico = proficienciaRepository.findByUsuarioId(u.getId()).stream()
                .collect(Collectors.toMap(p -> p.getTopico().getId(), p -> p.getRating().doubleValue(), (a, b) -> a));

        List<Questao> escolhidas = new ArrayList<>();
        // 1) Revisões vencidas (repetição espaçada - RF17) deste vestibular: até metade da fila
        Set<Long> idsVest = itens.stream().map(Questao::getId).collect(Collectors.toSet());
        for (Revisao rv : revisaoRepository.findByUsuarioIdAndProximaRevisaoLessThanEqualOrderByProximaRevisaoAsc(u.getId(), LocalDate.now())) {
            if (escolhidas.size() >= Math.max(1, quantidade / 2)) break;
            if (idsVest.contains(rv.getQuestao().getId()) && rv.getQuestao().isCodStatus()) escolhidas.add(rv.getQuestao());
        }
        // 2) Itens adaptativos: tópicos mais fracos primeiro e dificuldade próxima da proficiência
        Set<Long> jaEscolhidas = escolhidas.stream().map(Questao::getId).collect(Collectors.toSet());
        // A pontuação (com um pequeno fator aleatório) é calculada uma única vez por item antes de ordenar
        Map<Long, Double> pontuacao = new HashMap<>();
        itens.forEach(q -> pontuacao.put(q.getId(), pontuacaoAdaptativa(q, ratingTopico)));
        List<Questao> candidatas = itens.stream()
                .filter(q -> !acertadasRecentes.contains(q.getId()) && !jaEscolhidas.contains(q.getId()))
                .sorted(Comparator.comparingDouble(q -> pontuacao.get(q.getId())))
                .toList();
        Map<Long, Integer> porDisciplina = new HashMap<>();
        for (Questao q : candidatas) {
            if (escolhidas.size() >= quantidade) break;
            int usadas = porDisciplina.getOrDefault(q.getDisciplina().getId(), 0);
            if (usadas >= 3) continue; // variedade: no máximo 3 itens da mesma disciplina por fila
            escolhidas.add(q);
            porDisciplina.put(q.getDisciplina().getId(), usadas + 1);
        }
        for (Questao q : candidatas) {
            if (escolhidas.size() >= quantidade) break;
            if (!escolhidas.contains(q)) escolhidas.add(q);
        }
        if (escolhidas.isEmpty()) throw new BadRequest("Não há novos itens disponíveis para " + v.getSigla() + " no momento.");
        return visao(u, criarSessao(u, v, "BANCA", null, escolhidas, null));
    }

    /** Menor pontuação = maior prioridade. Combina fraqueza do tópico e distância de dificuldade. */
    private double pontuacaoAdaptativa(Questao q, Map<Long, Double> ratingTopico) {
        double rating = ratingAluno(q, ratingTopico);
        double alvo = rating + 40; // item levemente acima do nível: probabilidade de acerto de ~45%
        double distancia = Math.abs(q.getDificuldade().doubleValue() - alvo);
        return (rating - 600) * 0.6 + distancia + random.nextDouble() * 60;
    }

    private double ratingAluno(Questao q, Map<Long, Double> ratingTopico) {
        return q.getTopicos().stream().mapToDouble(t -> ratingTopico.getOrDefault(t.getId(), 1000.0)).average().orElse(1000);
    }

    @Transactional
    public Map<String, Object> iniciarSimulado(Usuario u, Requests.IniciarSessao req) {
        Vestibular v = vestibular(req.vestibular());
        String tipo = "MENSAL".equalsIgnoreCase(req.tipoSimulado()) ? "MENSAL" : "SEMANAL";
        var aberta = sessaoRepository.findFirstByUsuarioIdAndVestibularIdAndModoAndStatusOrderByIniciadaEmDesc(u.getId(), v.getId(), "SIMULADO", "EM_ANDAMENTO");
        if (aberta.isPresent()) return visao(u, aberta.get());

        if (!acessoService.isPro(u)) {
            LocalDateTime desde = "SEMANAL".equals(tipo)
                    ? LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay()
                    : LocalDate.now().withDayOfMonth(1).atStartOfDay();
            long feitos = sessaoRepository.countByUsuarioIdAndModoAndTipoSimuladoAndIniciadaEmAfter(u.getId(), "SIMULADO", tipo, desde);
            if (feitos > 0) {
                if (Boolean.TRUE.equals(req.usarCredito())) {
                    acessoService.consumirCredito(u, "Simulado " + tipo.toLowerCase() + " extra - " + v.getSigla());
                } else {
                    throw new BadRequest("O plano gratuito inclui 1 simulado " + tipo.toLowerCase()
                            + " por período. Use 1 crédito para um simulado extra ou assine o Plano Pro.");
                }
            }
        }
        List<Questao> itens = questaoRepository.findByVestibularIdAndCodStatusTrue(v.getId());
        if (itens.size() < MIN_SIMULADO) {
            throw new BadRequest("Itens insuficientes para simulado de " + v.getSigla() + " (mínimo de " + MIN_SIMULADO + ").");
        }
        int quantidade = Math.min("MENSAL".equals(tipo) ? QTD_SIMULADO_MENSAL : QTD_SIMULADO_SEMANAL, itens.size());
        int minutos = "MENSAL".equals(tipo) ? MINUTOS_MENSAL : MINUTOS_SEMANAL;
        List<Questao> escolhidas = selecionarPorDisciplina(itens, quantidade, 1060);
        SessaoEstudo s = criarSessao(u, v, "SIMULADO", tipo, escolhidas, LocalDateTime.now().plusMinutes(minutos));
        return visao(u, s);
    }

    /** Distribui os itens proporcionalmente entre as disciplinas, com dificuldade variada em torno do alvo. */
    private List<Questao> selecionarPorDisciplina(List<Questao> itens, int quantidade, double alvo) {
        Map<Long, List<Questao>> grupos = itens.stream().collect(Collectors.groupingBy(q -> q.getDisciplina().getId()));
        Map<Long, Double> chave = new HashMap<>();
        itens.forEach(q -> chave.put(q.getId(), Math.abs(q.getDificuldade().doubleValue() - alvo) + random.nextDouble() * 120));
        grupos.values().forEach(lista -> lista.sort(Comparator.comparingDouble(q -> chave.get(q.getId()))));
        List<List<Questao>> filas = new ArrayList<>(grupos.values());
        filas.sort(Comparator.comparingInt(l -> -l.size()));
        List<Questao> escolhidas = new ArrayList<>();
        int i = 0;
        while (escolhidas.size() < quantidade && filas.stream().anyMatch(l -> !l.isEmpty())) {
            List<Questao> fila = filas.get(i % filas.size());
            if (!fila.isEmpty()) escolhidas.add(fila.remove(0));
            i++;
        }
        Collections.shuffle(escolhidas, random);
        return escolhidas;
    }

    private SessaoEstudo criarSessao(Usuario u, Vestibular v, String modo, String tipoSimulado, List<Questao> questoes, LocalDateTime expira) {
        SessaoEstudo s = new SessaoEstudo();
        s.setUsuario(u);
        s.setVestibular(v);
        s.setModo(modo);
        s.setTipoSimulado(tipoSimulado);
        s.setTotalQuestoes(questoes.size());
        s.setExpiraEm(expira);
        int ordem = 1;
        for (Questao q : questoes) {
            SessaoQuestao sq = new SessaoQuestao();
            sq.setSessao(s);
            sq.setQuestao(q);
            sq.setOrdem(ordem++);
            s.getQuestoes().add(sq);
        }
        return sessaoRepository.save(s);
    }

    // =====================================================================
    // Visão da sessão (o gabarito nunca é exposto antes da hora)
    // =====================================================================
    private SessaoEstudo sessaoDoUsuario(Usuario u, Long id) {
        SessaoEstudo s = sessaoRepository.findById(id).orElseThrow(() -> new NotFound("Sessão não encontrada."));
        if (!s.getUsuario().getId().equals(u.getId())) throw new NotFound("Sessão não encontrada.");
        return s;
    }

    @Transactional
    public Map<String, Object> obter(Usuario u, Long id) {
        SessaoEstudo s = sessaoDoUsuario(u, id);
        verificarPrazo(s);
        return visao(u, s);
    }

    private Map<String, Object> visao(Usuario u, SessaoEstudo s) {
        Map<Long, Resposta> respostas = respostaRepository.findBySessaoId(s.getId()).stream()
                .collect(Collectors.toMap(r -> r.getQuestao().getId(), r -> r));
        boolean concluida = !"EM_ANDAMENTO".equals(s.getStatus());
        boolean devolutivaImediata = "BANCA".equals(s.getModo());
        List<Map<String, Object>> questoes = new ArrayList<>();
        for (SessaoQuestao sq : sessaoQuestaoRepository.findBySessaoIdOrderByOrdemAsc(s.getId())) {
            Questao q = sq.getQuestao();
            Resposta r = respostas.get(q.getId());
            Map<String, Object> m = questaoPublica(q);
            m.put("ordem", sq.getOrdem());
            m.put("respondida", r != null);
            m.put("alternativaMarcada", r == null ? null : r.getAlternativaMarcada());
            if (r != null && (devolutivaImediata || concluida)) {
                m.put("correta", r.isCorreta());
                m.put("gabarito", q.getGabarito());
                m.put("explicacao", q.getExplicacao());
            }
            if (concluida && r == null) m.put("gabarito", q.getGabarito());
            questoes.add(m);
        }
        Map<String, Object> v = cabecalho(s);
        v.put("respondidas", respostas.size());
        v.put("questoes", questoes);
        return v;
    }

    public static Map<String, Object> questaoPublica(Questao q) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", q.getId());
        m.put("enunciado", q.getEnunciado());
        m.put("introducaoAlternativas", q.getIntroducaoAlternativas());
        m.put("alternativas", q.getAlternativas().stream().map(a -> Map.of("letra", a.getLetra(), "texto", a.getTexto())).toList());
        m.put("disciplina", q.getDisciplina().getNome());
        m.put("topicos", q.getTopicos().stream().map(Topico::getNome).toList());
        m.put("nivel", q.getNivel());
        m.put("ano", q.getAno());
        m.put("fonte", q.getFonteDescricao());
        m.put("fonteUrl", q.getFonteUrl());
        m.put("origem", q.getOrigem());
        return m;
    }

    private Map<String, Object> cabecalho(SessaoEstudo s) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("id", s.getId());
        v.put("modo", s.getModo());
        v.put("tipoSimulado", s.getTipoSimulado());
        v.put("status", s.getStatus());
        v.put("vestibular", s.getVestibular().getSigla());
        v.put("totalQuestoes", s.getTotalQuestoes());
        v.put("acertos", s.getAcertos());
        v.put("iniciadaEm", s.getIniciadaEm());
        v.put("concluidaEm", s.getConcluidaEm());
        v.put("expiraEm", s.getExpiraEm());
        v.put("segundosRestantes", s.getExpiraEm() == null ? null : Math.max(0, Duration.between(LocalDateTime.now(), s.getExpiraEm()).getSeconds()));
        v.put("notaEstimada", s.getNotaEstimada());
        v.put("percentil", s.getPercentil());
        v.put("comparaveis", s.getComparaveis());
        v.put("escala", escala(s.getVestibular().getSigla()));
        return v;
    }

    // =====================================================================
    // Responder
    // =====================================================================
    @Transactional
    public Map<String, Object> responder(Usuario u, Long sessaoId, Requests.Responder req) {
        SessaoEstudo s = sessaoDoUsuario(u, sessaoId);
        if (verificarPrazo(s)) throw new BadRequest("O prazo do simulado expirou. Ele foi encerrado com as respostas registradas.");
        if (!"EM_ANDAMENTO".equals(s.getStatus())) throw new BadRequest("Esta sessão já foi concluída.");
        Questao q = sessaoQuestaoRepository.findBySessaoIdOrderByOrdemAsc(s.getId()).stream()
                .map(SessaoQuestao::getQuestao).filter(x -> x.getId().equals(req.questaoId())).findFirst()
                .orElseThrow(() -> new BadRequest("Esta questão não pertence à sessão."));
        String marcada = req.alternativa().toUpperCase();
        if (q.getAlternativas().stream().noneMatch(a -> a.getLetra().equals(marcada))) throw new BadRequest("Alternativa inválida para esta questão.");

        Optional<Resposta> existente = respostaRepository.findBySessaoIdAndQuestaoId(s.getId(), q.getId());
        if (existente.isPresent() && !"SIMULADO".equals(s.getModo())) throw new BadRequest("Esta questão já foi respondida.");
        if ("BANCA".equals(s.getModo()) && acessoService.questoesBancaHoje(u) >= acessoService.limiteQuestoesDia(u)) {
            throw new BadRequest("Cota diária de questões esgotada (RN02).");
        }
        Resposta r = existente.orElseGet(Resposta::new);
        r.setSessao(s);
        r.setQuestao(q);
        r.setUsuario(u);
        r.setAlternativaMarcada(marcada);
        r.setCorreta(marcada.equals(q.getGabarito()));
        r.setTempoSegundos(req.tempoSegundos());
        r.setRespondidaEm(LocalDateTime.now());
        respostaRepository.save(r);

        if (!"SIMULADO".equals(s.getModo())) {
            aplicarAprendizado(u, q, r.isCorreta(), "DIAGNOSTICO".equals(s.getModo()));
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("registrada", true);
        if ("BANCA".equals(s.getModo())) {
            out.put("correta", r.isCorreta());
            out.put("gabarito", q.getGabarito());
            out.put("explicacao", q.getExplicacao());
            out.put("fonte", q.getFonteDescricao());
        }
        long respondidas = respostaRepository.findBySessaoId(s.getId()).size();
        out.put("respondidas", respondidas);
        if (respondidas >= s.getTotalQuestoes() && !"SIMULADO".equals(s.getModo())) {
            out.put("resultado", concluirInterno(s, "CONCLUIDA"));
        }
        return out;
    }

    /** Atualiza Elo do aluno (por tópico) e do item, estatísticas da questão e a revisão espaçada. */
    private void aplicarAprendizado(Usuario u, Questao q, boolean correta, boolean diagnostico) {
        double resultado = correta ? 1.0 : 0.0;
        double dificuldade = q.getDificuldade().doubleValue();
        List<Proficiencia> profs = new ArrayList<>();
        for (Topico t : q.getTopicos()) {
            Proficiencia p = proficienciaRepository.findByUsuarioIdAndTopicoId(u.getId(), t.getId()).orElseGet(() -> {
                Proficiencia nova = new Proficiencia();
                nova.setUsuario(u);
                nova.setTopico(t);
                return nova;
            });
            profs.add(p);
        }
        double ratingMedio = profs.stream().mapToDouble(p -> p.getRating().doubleValue()).average().orElse(1000);
        double esperado = 1.0 / (1.0 + Math.pow(10, (dificuldade - ratingMedio) / 400.0));
        double k = diagnostico ? K_ALUNO_DIAGNOSTICO : K_ALUNO;
        for (Proficiencia p : profs) {
            double novo = limitar(p.getRating().doubleValue() + k * (resultado - esperado), 400, 1800);
            p.setRating(BigDecimal.valueOf(novo).setScale(2, RoundingMode.HALF_UP));
            p.setTentativas(p.getTentativas() + 1);
            if (correta) p.setAcertos(p.getAcertos() + 1);
            p.setAtualizadoEm(LocalDateTime.now());
            proficienciaRepository.save(p);
        }
        double novaDificuldade = limitar(dificuldade - K_ITEM * (resultado - esperado), 600, 1600);
        q.setDificuldade(BigDecimal.valueOf(novaDificuldade).setScale(2, RoundingMode.HALF_UP));
        q.setNivel(novaDificuldade < 1040 ? "FACIL" : novaDificuldade < 1110 ? "MEDIO" : "DIFICIL");
        q.setTotalRespostas(q.getTotalRespostas() + 1);
        if (correta) q.setTotalAcertos(q.getTotalAcertos() + 1);
        questaoRepository.save(q);
        agendarRevisao(u, q, correta);
    }

    /** RF17 - Repetição espaçada (SM-2 simplificado): erro volta em 1 dia; acerto em 7 dias e o intervalo cresce. */
    private void agendarRevisao(Usuario u, Questao q, boolean correta) {
        Optional<Revisao> existente = revisaoRepository.findByUsuarioIdAndQuestaoId(u.getId(), q.getId());
        if (existente.isEmpty() && correta) return; // só entra na agenda o que já foi errado
        Revisao rv = existente.orElseGet(() -> {
            Revisao nova = new Revisao();
            nova.setUsuario(u);
            nova.setQuestao(q);
            return nova;
        });
        if (correta) {
            rv.setRepeticoes(rv.getRepeticoes() + 1);
            int intervalo = rv.getRepeticoes() == 1 ? 7 : (int) Math.round(rv.getIntervaloDias() * rv.getFacilidade().doubleValue());
            rv.setIntervaloDias(Math.min(intervalo, 120));
            rv.setFacilidade(BigDecimal.valueOf(Math.min(3.0, rv.getFacilidade().doubleValue() + 0.1)));
        } else {
            rv.setRepeticoes(0);
            rv.setIntervaloDias(1);
            rv.setFacilidade(BigDecimal.valueOf(Math.max(1.3, rv.getFacilidade().doubleValue() - 0.2)));
        }
        rv.setProximaRevisao(LocalDate.now().plusDays(rv.getIntervaloDias()));
        revisaoRepository.save(rv);
    }

    private static double limitar(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }

    // =====================================================================
    // Conclusão, nota estimada e percentil
    // =====================================================================
    @Transactional
    public Map<String, Object> concluir(Usuario u, Long sessaoId) {
        SessaoEstudo s = sessaoDoUsuario(u, sessaoId);
        if (verificarPrazo(s) || !"EM_ANDAMENTO".equals(s.getStatus())) return resultado(u, sessaoId);
        concluirInterno(s, "CONCLUIDA");
        return resultado(u, sessaoId);
    }

    /** Encerra a sessão se o prazo do simulado passou (validação no servidor - UC013). */
    private boolean verificarPrazo(SessaoEstudo s) {
        if ("EM_ANDAMENTO".equals(s.getStatus()) && s.getExpiraEm() != null && s.getExpiraEm().isBefore(LocalDateTime.now())) {
            concluirInterno(s, "EXPIRADA");
            return true;
        }
        return false;
    }

    private Map<String, Object> concluirInterno(SessaoEstudo s, String status) {
        List<Resposta> respostas = respostaRepository.findBySessaoId(s.getId());
        if ("SIMULADO".equals(s.getModo())) {
            respostas.forEach(r -> aplicarAprendizado(s.getUsuario(), r.getQuestao(), r.isCorreta(), false));
        }
        int acertos = (int) respostas.stream().filter(Resposta::isCorreta).count();
        s.setAcertos(acertos);
        s.setStatus(status);
        s.setConcluidaEm(LocalDateTime.now());
        if (!"BANCA".equals(s.getModo())) {
            s.setNotaEstimada(notaEstimada(s, respostas));
        }
        if ("SIMULADO".equals(s.getModo())) {
            calcularPercentil(s);
            notificacaoService.notificar(s.getUsuario(), "Resultado do simulado disponível",
                    "Simulado " + s.getVestibular().getSigla() + ": " + acertos + "/" + s.getTotalQuestoes() + " acertos.",
                    "SIMULADO", "/aluno/sessao/" + s.getId() + "/resultado");
        }
        sessaoRepository.save(s);
        return Map.of("acertos", acertos, "total", s.getTotalQuestoes(), "status", status);
    }

    /**
     * Nota projetada na escala do vestibular. No ENEM usa-se uma aproximação ponderada pela
     * dificuldade calibrada dos itens (não é a nota TRI oficial do INEP).
     */
    private BigDecimal notaEstimada(SessaoEstudo s, List<Resposta> respostas) {
        int total = s.getTotalQuestoes();
        if (total == 0) return BigDecimal.ZERO;
        long acertos = respostas.stream().filter(Resposta::isCorreta).count();
        double nota = switch (s.getVestibular().getSigla()) {
            case "FUVEST" -> acertos * 90.0 / total;
            case "UNICAMP" -> acertos * 72.0 / total;
            default -> {
                Map<Long, Resposta> porQuestao = respostas.stream().collect(Collectors.toMap(r -> r.getQuestao().getId(), r -> r));
                double somaPeso = 0, somaAcerto = 0;
                for (SessaoQuestao sq : sessaoQuestaoRepository.findBySessaoIdOrderByOrdemAsc(s.getId())) {
                    double w = sq.getQuestao().getDificuldade().doubleValue() / 1000.0;
                    somaPeso += w;
                    Resposta r = porQuestao.get(sq.getQuestao().getId());
                    if (r != null && r.isCorreta()) somaAcerto += w;
                }
                yield 300 + 600 * (somaPeso == 0 ? 0 : somaAcerto / somaPeso);
            }
        };
        return BigDecimal.valueOf(nota).setScale(1, RoundingMode.HALF_UP);
    }

    public static String escala(String sigla) {
        return switch (sigla) {
            case "FUVEST" -> "Projeção para a 1ª fase FUVEST (0 a 90 pontos)";
            case "UNICAMP" -> "Projeção para a 1ª fase Unicamp (0 a 72 pontos)";
            default -> "Estimativa na escala do ENEM (aprox. 300 a 900; não é a nota TRI oficial do INEP)";
        };
    }

    /** RF06 - Percentil real: compara com quem mira o mesmo curso e universidade (mínimo de 5 comparáveis). */
    private void calcularPercentil(SessaoEstudo s) {
        Usuario u = s.getUsuario();
        List<SessaoEstudo> outras = sessaoRepository.findByVestibularIdAndModoAndTipoSimuladoAndStatusAndUsuarioIdNot(
                s.getVestibular().getId(), "SIMULADO", s.getTipoSimulado(), "CONCLUIDA", u.getId());
        Map<Long, SessaoEstudo> ultimaPorAluno = new HashMap<>();
        for (SessaoEstudo o : outras) {
            if (o.getNotaEstimada() == null) continue;
            ultimaPorAluno.merge(o.getUsuario().getId(), o, (a, b) -> a.getConcluidaEm().isAfter(b.getConcluidaEm()) ? a : b);
        }
        List<SessaoEstudo> mesmaMeta = ultimaPorAluno.values().stream().filter(o -> mesmaMeta(u, o.getUsuario())).toList();
        List<SessaoEstudo> grupo = mesmaMeta.size() >= MIN_COMPARAVEIS ? mesmaMeta : new ArrayList<>(ultimaPorAluno.values());
        if (grupo.size() < MIN_COMPARAVEIS || s.getNotaEstimada() == null) {
            s.setPercentil(null);
            s.setComparaveis(grupo.size());
            return;
        }
        double minha = s.getNotaEstimada().doubleValue();
        long abaixo = grupo.stream().filter(o -> o.getNotaEstimada().doubleValue() < minha).count();
        long iguais = grupo.stream().filter(o -> o.getNotaEstimada().doubleValue() == minha).count();
        double percentil = 100.0 * (abaixo + 0.5 * iguais) / grupo.size();
        s.setPercentil(BigDecimal.valueOf(percentil).setScale(1, RoundingMode.HALF_UP));
        s.setComparaveis(grupo.size());
    }

    private static boolean mesmaMeta(Usuario a, Usuario b) {
        return a.getCursoAlvo() != null && a.getUniversidadeAlvo() != null
                && a.getCursoAlvo().equalsIgnoreCase(b.getCursoAlvo() == null ? "" : b.getCursoAlvo())
                && a.getUniversidadeAlvo().equalsIgnoreCase(b.getUniversidadeAlvo() == null ? "" : b.getUniversidadeAlvo());
    }

    /** Resultado detalhado da sessão concluída. */
    @Transactional
    public Map<String, Object> resultado(Usuario u, Long sessaoId) {
        SessaoEstudo s = sessaoDoUsuario(u, sessaoId);
        verificarPrazo(s);
        if ("EM_ANDAMENTO".equals(s.getStatus())) throw new BadRequest("Conclua a sessão para ver o resultado.");
        Map<String, Object> v = visao(u, s);
        Map<String, int[]> porDisciplina = new TreeMap<>();
        Map<Long, Resposta> respostas = respostaRepository.findBySessaoId(s.getId()).stream()
                .collect(Collectors.toMap(r -> r.getQuestao().getId(), r -> r));
        for (SessaoQuestao sq : sessaoQuestaoRepository.findBySessaoIdOrderByOrdemAsc(s.getId())) {
            int[] c = porDisciplina.computeIfAbsent(sq.getQuestao().getDisciplina().getNome(), k -> new int[2]);
            c[1]++;
            Resposta r = respostas.get(sq.getQuestao().getId());
            if (r != null && r.isCorreta()) c[0]++;
        }
        v.put("porDisciplina", porDisciplina.entrySet().stream().map(e -> Map.of(
                "disciplina", e.getKey(), "acertos", e.getValue()[0], "total", e.getValue()[1],
                "percentual", Math.round(e.getValue()[0] * 100.0 / e.getValue()[1]))).toList());
        String grupo = s.getPercentil() == null ? null
                : "comparado a " + s.getComparaveis() + " alunos" + (u.getCursoAlvo() != null ? " (prioridade para a mesma meta: " + u.getCursoAlvo() + " / " + u.getUniversidadeAlvo() + ")" : "");
        v.put("grupoComparacao", grupo);
        if ("SIMULADO".equals(s.getModo()) && s.getPercentil() == null) {
            v.put("avisoPercentil", "Percentil indisponível: são necessários pelo menos " + MIN_COMPARAVEIS + " alunos comparáveis.");
        }
        return v;
    }

    public List<Map<String, Object>> historicoSessoes(Usuario u) {
        return sessaoRepository.findByUsuarioIdOrderByIniciadaEmDesc(u.getId()).stream().map(this::cabecalho).toList();
    }

    /** Encerra automaticamente simulados com prazo expirado (a cada 2 minutos). */
    @Scheduled(fixedDelay = 120_000, initialDelay = 60_000)
    @Transactional
    public void encerrarExpirados() {
        sessaoRepository.findByStatusAndExpiraEmBefore("EM_ANDAMENTO", LocalDateTime.now())
                .forEach(s -> concluirInterno(s, "EXPIRADA"));
    }
}
