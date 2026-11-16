package com.itb.inf2cm.aprovest.model.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.exceptions.BadRequest;
import com.itb.inf2cm.aprovest.exceptions.Forbidden;
import com.itb.inf2cm.aprovest.exceptions.NotFound;
import com.itb.inf2cm.aprovest.model.entity.AvaliacaoRedacao;
import com.itb.inf2cm.aprovest.model.entity.ParecerConteudo;
import com.itb.inf2cm.aprovest.model.entity.Questao;
import com.itb.inf2cm.aprovest.model.entity.RemuneracaoCorretor;
import com.itb.inf2cm.aprovest.model.entity.Usuario;
import com.itb.inf2cm.aprovest.model.enums.TipoUsuario;
import com.itb.inf2cm.aprovest.model.repository.AvaliacaoRedacaoRepository;
import com.itb.inf2cm.aprovest.model.repository.ParecerConteudoRepository;
import com.itb.inf2cm.aprovest.model.repository.QuestaoRepository;
import com.itb.inf2cm.aprovest.model.repository.RemuneracaoCorretorRepository;
import com.itb.inf2cm.aprovest.model.services.redacao.CorrecaoIaService;
import com.itb.inf2cm.aprovest.model.services.redacao.GradeCorrecao;
import com.itb.inf2cm.aprovest.model.services.redacao.GradeCorrecao.Criterio;
import com.itb.inf2cm.aprovest.model.services.redacao.GradeCorrecao.Grade;

/** Área docente: fila de correções (UC027), devolutiva (UC028), parecer de conteúdo (UC029) e ganhos (UC040). */
@Service
public class CorretorService {

    private final AvaliacaoRedacaoRepository avaliacaoRepository;
    private final RemuneracaoCorretorRepository remuneracaoRepository;
    private final ParecerConteudoRepository parecerRepository;
    private final QuestaoRepository questaoRepository;
    private final NotificacaoService notificacaoService;

    @Value("${app.preco.credito-unitario}") private BigDecimal precoCredito;
    @Value("${app.corretor.percentual-repasse}") private BigDecimal percentualRepasse;

    public CorretorService(AvaliacaoRedacaoRepository avaliacaoRepository, RemuneracaoCorretorRepository remuneracaoRepository,
                           ParecerConteudoRepository parecerRepository, QuestaoRepository questaoRepository,
                           NotificacaoService notificacaoService) {
        this.avaliacaoRepository = avaliacaoRepository;
        this.remuneracaoRepository = remuneracaoRepository;
        this.parecerRepository = parecerRepository;
        this.questaoRepository = questaoRepository;
        this.notificacaoService = notificacaoService;
    }

    /** O professor vê somente as correções atribuídas a ele (RN03); o administrador vê todas. */
    public List<AvaliacaoRedacao> fila(Usuario u) {
        if (u.getTipo() == TipoUsuario.ADMIN) {
            return avaliacaoRepository.findByTipoAndStatusInOrderBySolicitadaEmAsc("HUMANA", List.of("ATRIBUIDA"));
        }
        return avaliacaoRepository.findByCorretorIdAndStatusInOrderByPrazoAsc(u.getId(), List.of("ATRIBUIDA"));
    }

    public List<AvaliacaoRedacao> concluidas(Usuario u) {
        return avaliacaoRepository.findByCorretorIdAndStatusOrderByConcluidaEmDesc(u.getId(), "CONCLUIDA");
    }

    private AvaliacaoRedacao autorizada(Usuario u, Long id) {
        AvaliacaoRedacao a = avaliacaoRepository.findById(id).orElseThrow(() -> new NotFound("Solicitação não encontrada."));
        if (!"HUMANA".equals(a.getTipo())) throw new BadRequest("Esta avaliação não é de correção humana.");
        boolean responsavel = a.getCorretor() != null && a.getCorretor().getId().equals(u.getId());
        if (!responsavel && u.getTipo() != TipoUsuario.ADMIN) throw new Forbidden("Esta redação não está atribuída a você.");
        return a;
    }

    public Map<String, Object> detalhe(Usuario u, Long id) {
        AvaliacaoRedacao a = autorizada(u, id);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("avaliacao", a);
        m.put("grade", GradeCorrecao.de(a.getVestibular().getSigla()));
        m.put("tema", a.getRedacao() != null ? a.getRedacao().getTemaRedacao() : null);
        return m;
    }

    /** UC028 - Enviar devolutiva humana usando a grade oficial da banca. */
    @Transactional
    public AvaliacaoRedacao enviarDevolutiva(Usuario u, Long id, Requests.Devolutiva req) {
        AvaliacaoRedacao a = autorizada(u, id);
        if ("CONCLUIDA".equals(a.getStatus())) throw new BadRequest("Esta correção já foi concluída.");
        if (!"ATRIBUIDA".equals(a.getStatus())) throw new BadRequest("A solicitação ainda não foi atribuída a um corretor.");
        Grade grade = GradeCorrecao.de(a.getVestibular().getSigla());
        Map<String, Integer> notas = new LinkedHashMap<>();
        Map<String, String> comentarios = new LinkedHashMap<>();
        for (Requests.NotaDevolutiva n : req.notas()) {
            Criterio c = grade.criterio(n.codigo());
            if (c == null) throw new BadRequest("Critério inexistente na grade de " + grade.sigla() + ": " + n.codigo());
            int nota = (int) Math.round(n.nota());
            if (!c.valido(nota)) {
                throw new BadRequest("Nota inválida para " + c.codigo() + ": use valores de " + c.minimo() + " a " + c.maximo() + " (passo " + c.passo() + ").");
            }
            notas.put(c.codigo(), nota);
            comentarios.put(c.codigo(), n.comentario());
        }
        for (Criterio c : grade.criterios()) {
            if (!notas.containsKey(c.codigo())) throw new BadRequest("Informe a nota do critério " + c.codigo() + ".");
        }
        CorrecaoIaService.registrarNotas(a, grade, notas, comentarios, false, req.feedbackGeral().trim());
        a.setStatus("CONCLUIDA");
        a.setConcluidaEm(LocalDateTime.now());
        avaliacaoRepository.save(a);
        if (!remuneracaoRepository.existsByAvaliacaoId(a.getId()) && a.getCorretor() != null) {
            RemuneracaoCorretor r = new RemuneracaoCorretor();
            r.setAvaliacao(a);
            r.setCorretor(a.getCorretor());
            r.setValor(precoCredito.multiply(percentualRepasse).setScale(2, RoundingMode.HALF_UP));
            remuneracaoRepository.save(r);
        }
        notificacaoService.notificar(a.getUsuario(), "Correção humana concluída",
                "O corretor enviou a devolutiva da redação \"" + a.getTituloSnapshot() + "\".", "REDACAO", "/aluno/avaliacoes/" + a.getId());
        return a;
    }

    /** UC029 - Itens disponíveis para avaliação de conteúdo pelo professor. */
    public List<Map<String, Object>> itensParaAvaliar(Long vestibularId, String busca, int pagina) {
        var itens = questaoRepository.buscar(vestibularId, null, true, null, busca == null || busca.isBlank() ? null : busca.trim(),
                PageRequest.of(pagina, 15, Sort.by(Sort.Direction.DESC, "totalRespostas")));
        return itens.getContent().stream().map(q -> {
            Map<String, Object> m = EstudoService.questaoPublica(q);
            m.put("gabarito", q.getGabarito());
            m.put("taxaAcerto", q.getTaxaAcerto());
            m.put("totalRespostas", q.getTotalRespostas());
            m.put("dificuldade", q.getDificuldade());
            m.put("vestibular", q.getVestibular().getSigla());
            return m;
        }).toList();
    }

    @Transactional
    public ParecerConteudo registrarParecer(Usuario u, Long questaoId, Requests.Parecer req) {
        Questao q = questaoRepository.findById(questaoId).orElseThrow(() -> new NotFound("Questão não encontrada."));
        ParecerConteudo p = new ParecerConteudo();
        p.setQuestao(q);
        p.setCorretor(u);
        p.setVeredito(req.veredito());
        p.setComentario(req.comentario().trim());
        p.setQuestaoSnapshot(q.getFonteDescricao() + "\n" + q.getEnunciado() + "\nGabarito: " + q.getGabarito());
        ParecerConteudo salvo = parecerRepository.save(p);
        notificacaoService.notificarAdmins("Novo parecer de conteúdo", u.getNome() + " avaliou a questão #" + q.getId() + ": " + req.veredito(), "/admin/questoes");
        return salvo;
    }

    public List<ParecerConteudo> meusPareceres(Usuario u) {
        return parecerRepository.findByCorretorIdOrderByCriadoEmDesc(u.getId());
    }

    /** UC040 - Consultar remunerações (registros; nenhuma transferência é executada). */
    public Map<String, Object> ganhos(Usuario u) {
        List<RemuneracaoCorretor> lista = remuneracaoRepository.findByCorretorIdOrderByCriadoEmDesc(u.getId());
        BigDecimal total = lista.stream().map(RemuneracaoCorretor::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("registros", lista.stream().map(r -> Map.of("id", r.getId(), "valor", r.getValor(), "status", r.getStatus(),
                "data", r.getCriadoEm(), "redacao", r.getAvaliacao().getTituloSnapshot(), "vestibular", r.getAvaliacao().getVestibular().getSigla())).toList());
        m.put("total", total);
        m.put("quantidade", lista.size());
        m.put("regra", "Repasse registrado de " + percentualRepasse.multiply(BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString()
                + "% do valor do crédito por correção concluída. A consulta não realiza pagamentos.");
        return m;
    }
}
