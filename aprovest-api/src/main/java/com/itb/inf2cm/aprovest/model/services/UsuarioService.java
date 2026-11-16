package com.itb.inf2cm.aprovest.model.services;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itb.inf2cm.aprovest.auth.AuthenticationService;
import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.dto.UsuarioDTO;
import com.itb.inf2cm.aprovest.exceptions.BadRequest;
import com.itb.inf2cm.aprovest.exceptions.NotFound;
import com.itb.inf2cm.aprovest.model.entity.Admin;
import com.itb.inf2cm.aprovest.model.entity.Aluno;
import com.itb.inf2cm.aprovest.model.entity.AvaliacaoRedacao;
import com.itb.inf2cm.aprovest.model.entity.Corretor;
import com.itb.inf2cm.aprovest.model.entity.SolicitacaoLgpd;
import com.itb.inf2cm.aprovest.model.entity.Usuario;
import com.itb.inf2cm.aprovest.model.enums.TipoUsuario;
import com.itb.inf2cm.aprovest.model.repository.*;

import jakarta.persistence.EntityManager;

/** RF09, RF14, UC005, UC006, UC008, UC009, UC033, UC038 e RN05 (LGPD). */
@Service
public class UsuarioService {

    private static final Set<String> VESTIBULARES = Set.of("ENEM", "FUVEST", "UNICAMP");

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationService authenticationService;
    private final AcessoService acessoService;
    private final NotificacaoService notificacaoService;
    private final SolicitacaoLgpdRepository lgpdRepository;
    private final SessaoEstudoRepository sessaoRepository;
    private final RespostaRepository respostaRepository;
    private final RedacaoRepository redacaoRepository;
    private final AvaliacaoRedacaoRepository avaliacaoRepository;
    private final ProficienciaRepository proficienciaRepository;
    private final NotificacaoRepository notificacaoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final LeituraMaterialRepository leituraRepository;
    private final EntityManager em;

    public UsuarioService(UsuarioRepository repository, PasswordEncoder passwordEncoder, AuthenticationService authenticationService,
                          AcessoService acessoService, NotificacaoService notificacaoService, SolicitacaoLgpdRepository lgpdRepository,
                          SessaoEstudoRepository sessaoRepository, RespostaRepository respostaRepository, RedacaoRepository redacaoRepository,
                          AvaliacaoRedacaoRepository avaliacaoRepository, ProficienciaRepository proficienciaRepository,
                          NotificacaoRepository notificacaoRepository, PagamentoRepository pagamentoRepository,
                          LeituraMaterialRepository leituraRepository, EntityManager em) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationService = authenticationService;
        this.acessoService = acessoService;
        this.notificacaoService = notificacaoService;
        this.lgpdRepository = lgpdRepository;
        this.sessaoRepository = sessaoRepository;
        this.respostaRepository = respostaRepository;
        this.redacaoRepository = redacaoRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.proficienciaRepository = proficienciaRepository;
        this.notificacaoRepository = notificacaoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.leituraRepository = leituraRepository;
        this.em = em;
    }

    public UsuarioDTO dto(Usuario u) {
        return UsuarioDTO.de(u, acessoService.isPro(u));
    }

    /** UC005 - Editar perfil e metas (1 a 3 vestibulares: ENEM, FUVEST e Unicamp). */
    @Transactional
    public UsuarioDTO atualizarPerfil(Usuario u, Requests.Perfil req) {
        List<String> alvos = req.vestibularesAlvo().stream().map(s -> s.trim().toUpperCase()).distinct().toList();
        if (alvos.isEmpty() || alvos.size() > 3 || !VESTIBULARES.containsAll(alvos)) {
            throw new BadRequest("Escolha de 1 a 3 vestibulares entre ENEM, FUVEST e UNICAMP.");
        }
        u.setNome(req.nome().trim());
        u.setDataNascimento(req.dataNascimento());
        u.setCursoAlvo(req.cursoAlvo() == null ? null : req.cursoAlvo().trim());
        u.setUniversidadeAlvo(req.universidadeAlvo() == null ? null : req.universidadeAlvo().trim());
        u.setVestibularesAlvo(String.join(",", alvos));
        u.setOnboardingConcluido(true);
        return dto(repository.save(u));
    }

    /** RF14 / RF16 / RNF14 - Preferências de notificação, tema e tamanho da fonte. */
    @Transactional
    public UsuarioDTO atualizarPreferencias(Usuario u, Requests.Preferencias p) {
        if (p.tema() != null) {
            if (!Set.of("claro", "escuro").contains(p.tema())) throw new BadRequest("Tema inválido.");
            u.setTema(p.tema());
        }
        if (p.tamanhoFonte() != null) {
            if (!Set.of("pequena", "normal", "grande", "extra").contains(p.tamanhoFonte())) throw new BadRequest("Tamanho de fonte inválido.");
            u.setTamanhoFonte(p.tamanhoFonte());
        }
        if (p.notifBanca() != null) u.setNotifBanca(p.notifBanca());
        if (p.notifRedacao() != null) u.setNotifRedacao(p.notifRedacao());
        if (p.notifSimulado() != null) u.setNotifSimulado(p.notifSimulado());
        if (p.notifNovidades() != null) u.setNotifNovidades(p.notifNovidades());
        if (p.rankingPublico() != null) u.setRankingPublico(p.rankingPublico());
        return dto(repository.save(u));
    }

    /** UC038 - Alterar senha (exige a senha atual). */
    @Transactional
    public void alterarSenha(Usuario u, Requests.AlterarSenha req) {
        if (!passwordEncoder.matches(req.senhaAtual(), u.getPassword())) throw new BadRequest("Senha atual incorreta.");
        AuthenticationService.validarSenha(req.novaSenha());
        u.setPassword(passwordEncoder.encode(req.novaSenha()));
        repository.save(u);
    }

    /** UC006 - Alterar e-mail (confirmação pela senha atual; exige novo login). */
    @Transactional
    public UsuarioDTO alterarEmail(Usuario u, Requests.AlterarEmail req) {
        if (!passwordEncoder.matches(req.senhaAtual(), u.getPassword())) throw new BadRequest("Senha atual incorreta.");
        String novo = req.novoEmail().trim().toLowerCase();
        if (repository.findByEmail(novo).isPresent()) throw new BadRequest("Este e-mail já está em uso.");
        u.setEmail(novo);
        repository.save(u);
        authenticationService.revogarTokens(u);
        return dto(u);
    }

    /** UC008 / RNF03 - Exportar dados pessoais em JSON (não é backup do banco). */
    public Map<String, Object> exportarDados(Usuario u) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("geradoEm", LocalDateTime.now().toString());
        d.put("perfil", dto(u));
        d.put("acessos", acessoService.resumo(u));
        d.put("sessoesDeEstudo", sessaoRepository.findByUsuarioIdOrderByIniciadaEmDesc(u.getId()));
        d.put("respostas", respostaRepository.findByUsuarioId(u.getId()).stream().map(r -> Map.of(
                "questaoId", r.getQuestao().getId(), "alternativa", r.getAlternativaMarcada(),
                "correta", r.isCorreta(), "data", r.getRespondidaEm().toString())).toList());
        d.put("proficiencias", proficienciaRepository.findByUsuarioId(u.getId()).stream().map(p -> Map.of(
                "topico", p.getTopico().getNome(), "rating", p.getRating(), "acertos", p.getAcertos(), "tentativas", p.getTentativas())).toList());
        d.put("redacoes", redacaoRepository.findByUsuarioIdOrderByAtualizadoEmDesc(u.getId()));
        d.put("avaliacoesRedacao", avaliacaoRepository.findByUsuarioIdOrderBySolicitadaEmDesc(u.getId()));
        d.put("leituras", leituraRepository.findByUsuarioId(u.getId()).stream().map(l -> Map.of(
                "materialId", l.getMaterial().getId(), "concluido", l.isConcluido())).toList());
        d.put("notificacoes", notificacaoRepository.findTop50ByUsuarioIdOrderByCriadoEmDesc(u.getId()));
        d.put("pagamentos", pagamentoRepository.findByUsuarioIdOrderByCriadoEmDesc(u.getId()));
        d.put("solicitacoesLgpd", lgpdRepository.findByUsuario_IdOrderByCriadoEmDesc(u.getId()));
        return d;
    }

    /** UC009 - Solicitar exclusão de dados: registra o pedido para o administrador processar (RN05). */
    @Transactional
    public SolicitacaoLgpd solicitarExclusao(Usuario u) {
        if (lgpdRepository.existsByUsuario_IdAndTipoAndStatus(u.getId(), "EXCLUSAO", "PENDENTE")) {
            throw new BadRequest("Você já possui uma solicitação de exclusão em análise.");
        }
        SolicitacaoLgpd s = new SolicitacaoLgpd();
        s.setUsuario(u);
        s.setTipo("EXCLUSAO");
        lgpdRepository.save(s);
        notificacaoService.notificarAdmins("Nova solicitação LGPD", u.getNome() + " solicitou a exclusão dos dados.", "/admin/lgpd");
        return s;
    }

    public List<SolicitacaoLgpd> minhasSolicitacoes(Usuario u) {
        return lgpdRepository.findByUsuario_IdOrderByCriadoEmDesc(u.getId());
    }

    // ===================================================================
    // Administração de usuários (RF09 / UC033)
    // ===================================================================
    public Page<UsuarioDTO> listar(String tipo, String busca, int pagina) {
        TipoUsuario t = tipo == null || tipo.isBlank() ? null : TipoUsuario.valueOf(tipo);
        String b = busca == null || busca.isBlank() ? null : busca.trim();
        return repository.buscar(t, b, PageRequest.of(pagina, 20, Sort.by("nome"))).map(this::dto);
    }

    @Transactional
    public UsuarioDTO criarPorAdmin(Requests.NovoUsuario req) {
        String email = req.email().trim().toLowerCase();
        if (repository.findByEmail(email).isPresent()) throw new BadRequest("E-mail já cadastrado.");
        AuthenticationService.validarSenha(req.password());
        Usuario u = switch (req.tipo()) {
            case "CORRETOR" -> {
                Corretor c = new Corretor();
                c.setFormacao(req.formacao());
                yield c;
            }
            case "ADMIN" -> new Admin();
            default -> new Aluno();
        };
        u.setNome(req.nome().trim());
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(req.password()));
        u.setOnboardingConcluido(!"ALUNO".equals(req.tipo()));
        return dto(repository.save(u));
    }

    @Transactional
    public UsuarioDTO alterarPapel(Usuario admin, Long id, String tipo) {
        if (admin.getId().equals(id)) throw new BadRequest("Você não pode alterar o próprio papel.");
        Usuario u = repository.findById(id).orElseThrow(() -> new NotFound("Usuário não encontrado."));
        repository.alterarTipo(id, tipo);
        authenticationService.revogarTokens(u);
        em.flush();
        em.clear();
        Usuario atualizado = repository.findById(id).orElseThrow();
        notificacaoService.notificar(atualizado, "Seu perfil de acesso foi alterado",
                "Seu papel na plataforma agora é: " + tipo + ". Faça login novamente.", "SISTEMA", null);
        return dto(atualizado);
    }

    @Transactional
    public UsuarioDTO alterarStatus(Usuario admin, Long id, boolean ativo) {
        if (admin.getId().equals(id)) throw new BadRequest("Você não pode desativar a própria conta.");
        Usuario u = repository.findById(id).orElseThrow(() -> new NotFound("Usuário não encontrado."));
        u.setCodStatus(ativo);
        repository.save(u);
        if (!ativo) authenticationService.revogarTokens(u);
        return dto(u);
    }

    // ===================================================================
    // LGPD - processamento pelo administrador (RN05)
    // ===================================================================
    public List<SolicitacaoLgpd> solicitacoes() {
        return lgpdRepository.findAllByOrderByCriadoEmDesc();
    }

    /**
     * Anonimiza a conta: remove dados pessoais, redações e notificações; mantém
     * respostas anônimas apenas para a calibração estatística das questões.
     */
    @Transactional
    public SolicitacaoLgpd processarExclusao(Long solicitacaoId) {
        SolicitacaoLgpd s = lgpdRepository.findById(solicitacaoId).orElseThrow(() -> new NotFound("Solicitação não encontrada."));
        if (!"PENDENTE".equals(s.getStatus())) throw new BadRequest("Solicitação já processada.");
        Usuario u = s.getUsuario();
        if (u != null) {
            authenticationService.revogarTokens(u);
            for (AvaliacaoRedacao a : avaliacaoRepository.findByUsuarioIdOrderBySolicitadaEmDesc(u.getId())) {
                a.setTextoSnapshot("[removido - LGPD]");
                a.setTituloSnapshot("[removido]");
                a.setTemaSnapshot("[removido]");
                avaliacaoRepository.save(a);
            }
            redacaoRepository.deleteAll(redacaoRepository.findByUsuarioIdOrderByAtualizadoEmDesc(u.getId()));
            notificacaoRepository.deleteAll(notificacaoRepository.findTop50ByUsuarioIdOrderByCriadoEmDesc(u.getId()));
            u.setNome("Usuário removido #" + u.getId());
            u.setEmail("removido-" + u.getId() + "@anonimo.aprovest");
            u.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            u.setGoogleId(null);
            u.setDataNascimento(null);
            u.setCursoAlvo(null);
            u.setUniversidadeAlvo(null);
            u.setRankingPublico(false);
            u.setCodStatus(false);
            repository.save(u);
        }
        s.setStatus("CONCLUIDA");
        s.setConcluidoEm(LocalDateTime.now());
        s.setObservacao("Conta anonimizada: dados pessoais e redações removidos; respostas mantidas de forma anônima.");
        return lgpdRepository.save(s);
    }
}
