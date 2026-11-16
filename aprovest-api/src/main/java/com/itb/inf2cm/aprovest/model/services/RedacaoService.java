package com.itb.inf2cm.aprovest.model.services;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.exceptions.BadRequest;
import com.itb.inf2cm.aprovest.exceptions.Forbidden;
import com.itb.inf2cm.aprovest.exceptions.NotFound;
import com.itb.inf2cm.aprovest.model.entity.AvaliacaoRedacao;
import com.itb.inf2cm.aprovest.model.entity.Redacao;
import com.itb.inf2cm.aprovest.model.entity.TemaRedacao;
import com.itb.inf2cm.aprovest.model.entity.Usuario;
import com.itb.inf2cm.aprovest.model.entity.Vestibular;
import com.itb.inf2cm.aprovest.model.enums.TipoUsuario;
import com.itb.inf2cm.aprovest.model.repository.AvaliacaoRedacaoRepository;
import com.itb.inf2cm.aprovest.model.repository.RedacaoRepository;
import com.itb.inf2cm.aprovest.model.repository.TemaRedacaoRepository;
import com.itb.inf2cm.aprovest.model.repository.VestibularRepository;
import com.itb.inf2cm.aprovest.model.services.redacao.CorrecaoIaService;
import com.itb.inf2cm.aprovest.model.services.redacao.GradeCorrecao;

/** Caderno de redações (UC020-UC023) e solicitações de correção por IA (UC024) e humana (UC025, UC026). */
@Service
public class RedacaoService {

    private static final int LIMITE_PALAVRAS = 2500;
    private static final List<String> ATIVAS = List.of("PROCESSANDO", "PENDENTE", "ATRIBUIDA");

    private final RedacaoRepository repository;
    private final AvaliacaoRedacaoRepository avaliacaoRepository;
    private final TemaRedacaoRepository temaRepository;
    private final VestibularRepository vestibularRepository;
    private final AcessoService acessoService;
    private final CorrecaoIaService correcaoIaService;
    private final NotificacaoService notificacaoService;

    public RedacaoService(RedacaoRepository repository, AvaliacaoRedacaoRepository avaliacaoRepository,
                          TemaRedacaoRepository temaRepository, VestibularRepository vestibularRepository,
                          AcessoService acessoService, CorrecaoIaService correcaoIaService, NotificacaoService notificacaoService) {
        this.repository = repository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.temaRepository = temaRepository;
        this.vestibularRepository = vestibularRepository;
        this.acessoService = acessoService;
        this.correcaoIaService = correcaoIaService;
        this.notificacaoService = notificacaoService;
    }

    public List<Redacao> listar(Usuario u) {
        return repository.findByUsuarioIdOrderByAtualizadoEmDesc(u.getId());
    }

    public Redacao obter(Usuario u, Long id) {
        return repository.findByIdAndUsuarioId(id, u.getId()).orElseThrow(() -> new NotFound("Redação não encontrada."));
    }

    public Map<String, Object> detalhe(Usuario u, Long id) {
        Redacao r = obter(u, id);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("redacao", r);
        m.put("avaliacoes", avaliacaoRepository.findByRedacao_IdOrderBySolicitadaEmDesc(id));
        m.put("grade", GradeCorrecao.de(r.getVestibular().getSigla()));
        return m;
    }

    /** UC021 - Criar redação: título 3-120, tema 3-180, texto 20-12.000 caracteres e até 2.500 palavras. */
    @Transactional
    public Redacao criar(Usuario u, Requests.Redacao req) {
        Redacao r = new Redacao();
        r.setUsuario(u);
        preencher(r, req);
        return repository.save(r);
    }

    /** UC022 - Editar redação (as cópias já enviadas para correção não são alteradas). */
    @Transactional
    public Redacao atualizar(Usuario u, Long id, Requests.Redacao req) {
        Redacao r = obter(u, id);
        if (avaliacaoRepository.existsByRedacao_IdAndTipoAndStatusIn(id, "IA", List.of("PROCESSANDO"))) {
            throw new BadRequest("Aguarde a correção em andamento terminar para editar o texto.");
        }
        preencher(r, req);
        r.setAtualizadoEm(LocalDateTime.now());
        return repository.save(r);
    }

    private void preencher(Redacao r, Requests.Redacao req) {
        if (req.texto().trim().split("\\s+").length > LIMITE_PALAVRAS) {
            throw new BadRequest("O texto deve ter no máximo " + LIMITE_PALAVRAS + " palavras.");
        }
        TemaRedacao tema = req.temaRedacaoId() == null ? null
                : temaRepository.findById(req.temaRedacaoId()).orElseThrow(() -> new NotFound("Tema não encontrado."));
        Vestibular v = tema != null ? tema.getVestibular()
                : req.vestibularId() == null ? vestibularRepository.findBySigla("ENEM").orElseThrow()
                : vestibularRepository.findById(req.vestibularId()).orElseThrow(() -> new NotFound("Vestibular não encontrado."));
        r.setTitulo(req.titulo().trim());
        r.setTema(req.tema().trim());
        r.setTexto(req.texto().trim());
        r.setStatus("FINALIZADA".equalsIgnoreCase(req.status()) ? "FINALIZADA" : "RASCUNHO");
        r.setVestibular(v);
        r.setTemaRedacao(tema);
    }

    /** UC023 - Excluir redação (o histórico de avaliações é preservado com a cópia do texto). */
    @Transactional
    public void excluir(Usuario u, Long id) {
        Redacao r = obter(u, id);
        if (avaliacaoRepository.existsByRedacao_IdAndTipoAndStatusIn(id, "IA", List.of("PROCESSANDO"))) {
            throw new BadRequest("Não é possível excluir enquanto a correção por IA está em andamento.");
        }
        repository.delete(r);
    }

    /** UC024 - Solicitar correção por IA (quota mensal, sem avaliação simultânea e com o serviço ativo). */
    @Transactional
    public AvaliacaoRedacao solicitarCorrecaoIa(Usuario u, Long id) {
        Redacao r = obter(u, id);
        if (correcaoIaService.estado().isPausado()) {
            throw new BadRequest("A correção por IA está temporariamente pausada pela administração. Tente mais tarde.");
        }
        if (avaliacaoRepository.existsByUsuarioIdAndStatus(u.getId(), "PROCESSANDO")) {
            throw new BadRequest("Você já tem uma correção por IA em andamento. Aguarde a conclusão.");
        }
        long usadas = acessoService.correcoesIaNoMes(u);
        int limite = acessoService.limiteCorrecoesIaMes(u);
        if (usadas >= limite) {
            throw new BadRequest(acessoService.isPro(u)
                    ? "Você atingiu o limite mensal de correções por IA do Plano Pro."
                    : "O plano gratuito inclui " + limite + " correção por IA por mês (RN02). Assine o Plano Pro para mais correções.");
        }
        if (r.getPalavras() < 60) throw new BadRequest("Escreva pelo menos 60 palavras antes de solicitar a correção.");
        AvaliacaoRedacao a = novaAvaliacao(u, r, "IA", "PROCESSANDO");
        r.setStatus("FINALIZADA");
        repository.save(r);
        return avaliacaoRepository.save(a);
    }

    /** UC025 - Solicitar correção humana: consome 1 crédito e registra prazo de 72 horas (RF05). */
    @Transactional
    public AvaliacaoRedacao solicitarCorrecaoHumana(Usuario u, Long id) {
        Redacao r = obter(u, id);
        if (r.getPalavras() < 60) throw new BadRequest("Escreva pelo menos 60 palavras antes de solicitar a correção.");
        if (avaliacaoRepository.existsByRedacao_IdAndTipoAndStatusIn(id, "HUMANA", List.of("PENDENTE", "ATRIBUIDA"))) {
            throw new BadRequest("Esta redação já possui uma correção humana em andamento.");
        }
        acessoService.consumirCredito(u, "Correção humana - " + r.getTitulo());
        AvaliacaoRedacao a = novaAvaliacao(u, r, "HUMANA", "PENDENTE");
        a.setPrazo(LocalDateTime.now().plusHours(72));
        r.setStatus("FINALIZADA");
        repository.save(r);
        AvaliacaoRedacao salva = avaliacaoRepository.save(a);
        notificacaoService.notificar(u, "Correção humana solicitada",
                "Sua redação foi enviada para um corretor credenciado. Prazo registrado: 72 horas.", "REDACAO", "/aluno/avaliacoes/" + salva.getId());
        notificacaoService.notificarAdmins("Nova correção humana", "Atribua a redação \"" + r.getTitulo() + "\" a um corretor.", "/admin/correcoes");
        return salva;
    }

    private AvaliacaoRedacao novaAvaliacao(Usuario u, Redacao r, String tipo, String status) {
        AvaliacaoRedacao a = new AvaliacaoRedacao();
        a.setUsuario(u);
        a.setRedacao(r);
        a.setVestibular(r.getVestibular());
        a.setTipo(tipo);
        a.setStatus(status);
        a.setTituloSnapshot(r.getTitulo());
        a.setTemaSnapshot(r.getTema());
        a.setTextoSnapshot(r.getTexto());
        return a;
    }

    /** UC026 - Consultar avaliações de redação. */
    public List<AvaliacaoRedacao> avaliacoes(Usuario u) {
        return avaliacaoRepository.findByUsuarioIdOrderBySolicitadaEmDesc(u.getId());
    }

    public Map<String, Object> avaliacao(Usuario u, Long id) {
        AvaliacaoRedacao a = avaliacaoRepository.findById(id).orElseThrow(() -> new NotFound("Avaliação não encontrada."));
        boolean dono = a.getUsuario().getId().equals(u.getId());
        boolean corretor = a.getCorretor() != null && a.getCorretor().getId().equals(u.getId());
        if (!dono && !corretor && u.getTipo() != TipoUsuario.ADMIN) throw new Forbidden("Avaliação de outro usuário.");
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("avaliacao", a);
        m.put("grade", GradeCorrecao.de(a.getVestibular().getSigla()));
        m.put("tema", a.getRedacao() != null && a.getRedacao().getTemaRedacao() != null ? a.getRedacao().getTemaRedacao() : null);
        return m;
    }
}
