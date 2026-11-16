package com.itb.inf2cm.aprovest.model.services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.exceptions.BadRequest;
import com.itb.inf2cm.aprovest.model.entity.Assinatura;
import com.itb.inf2cm.aprovest.model.entity.CarteiraCredito;
import com.itb.inf2cm.aprovest.model.entity.MovimentoCredito;
import com.itb.inf2cm.aprovest.model.entity.Pagamento;
import com.itb.inf2cm.aprovest.model.entity.Usuario;
import com.itb.inf2cm.aprovest.model.enums.TipoUsuario;
import com.itb.inf2cm.aprovest.model.repository.AssinaturaRepository;
import com.itb.inf2cm.aprovest.model.repository.AvaliacaoRedacaoRepository;
import com.itb.inf2cm.aprovest.model.repository.BolsaMeritoRepository;
import com.itb.inf2cm.aprovest.model.repository.CarteiraCreditoRepository;
import com.itb.inf2cm.aprovest.model.repository.MovimentoCreditoRepository;
import com.itb.inf2cm.aprovest.model.repository.PagamentoRepository;
import com.itb.inf2cm.aprovest.model.repository.RespostaRepository;

/**
 * Regras de acesso e monetização: RN02 (limites do plano gratuito), RF10 (Plano Pro),
 * RF11 (créditos avulsos) e UC039 (consultar acessos e créditos).
 * O checkout é uma DEMONSTRAÇÃO: registra o pagamento como aprovado sem cobrança real.
 */
@Service
public class AcessoService {

    private final AssinaturaRepository assinaturaRepository;
    private final CarteiraCreditoRepository carteiraRepository;
    private final MovimentoCreditoRepository movimentoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final RespostaRepository respostaRepository;
    private final AvaliacaoRedacaoRepository avaliacaoRepository;
    private final BolsaMeritoRepository bolsaRepository;
    private final NotificacaoService notificacaoService;

    @Value("${app.plano.free.questoes-dia}") private int freeQuestoesDia;
    @Value("${app.plano.free.correcoes-ia-mes}") private int freeCorrecoesMes;
    @Value("${app.plano.pro.questoes-dia}") private int proQuestoesDia;
    @Value("${app.plano.pro.correcoes-ia-mes}") private int proCorrecoesMes;
    @Value("${app.preco.pro-mensal}") private BigDecimal precoPro;
    @Value("${app.preco.credito-unitario}") private BigDecimal precoCredito;
    @Value("${app.preco.pacote-5-creditos}") private BigDecimal precoPacote5;

    public AcessoService(AssinaturaRepository assinaturaRepository, CarteiraCreditoRepository carteiraRepository,
                         MovimentoCreditoRepository movimentoRepository, PagamentoRepository pagamentoRepository,
                         RespostaRepository respostaRepository, AvaliacaoRedacaoRepository avaliacaoRepository,
                         BolsaMeritoRepository bolsaRepository, NotificacaoService notificacaoService) {
        this.assinaturaRepository = assinaturaRepository;
        this.carteiraRepository = carteiraRepository;
        this.movimentoRepository = movimentoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.respostaRepository = respostaRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.bolsaRepository = bolsaRepository;
        this.notificacaoService = notificacaoService;
    }

    @Transactional
    public Assinatura assinatura(Usuario u) {
        return assinaturaRepository.findByUsuarioId(u.getId()).orElseGet(() -> {
            Assinatura a = new Assinatura();
            a.setUsuario(u);
            return assinaturaRepository.save(a);
        });
    }

    public boolean isPro(Usuario u) {
        if (u.getTipo() == TipoUsuario.ADMIN) return true;
        return assinaturaRepository.findByUsuarioId(u.getId()).map(Assinatura::isProAtivo).orElse(false);
    }

    public int limiteQuestoesDia(Usuario u) {
        return isPro(u) ? proQuestoesDia : freeQuestoesDia;
    }

    public int limiteCorrecoesIaMes(Usuario u) {
        return isPro(u) ? proCorrecoesMes : freeCorrecoesMes;
    }

    public long questoesBancaHoje(Usuario u) {
        return respostaRepository.contarBancaDesde(u.getId(), LocalDate.now().atStartOfDay());
    }

    public long correcoesIaNoMes(Usuario u) {
        return avaliacaoRepository.countByUsuarioIdAndTipoAndStatusNotAndSolicitadaEmAfter(
                u.getId(), "IA", "ERRO", LocalDate.now().withDayOfMonth(1).atStartOfDay());
    }

    @Transactional
    public CarteiraCredito carteira(Usuario u) {
        return carteiraRepository.findByUsuarioId(u.getId()).orElseGet(() -> {
            CarteiraCredito c = new CarteiraCredito();
            c.setUsuario(u);
            return carteiraRepository.save(c);
        });
    }

    @Transactional
    public void adicionarCreditos(Usuario u, int quantidade, String motivo) {
        CarteiraCredito c = carteira(u);
        c.setSaldo(c.getSaldo() + quantidade);
        carteiraRepository.save(c);
        registrarMovimento(u, quantidade, motivo);
    }

    @Transactional
    public void consumirCredito(Usuario u, String motivo) {
        CarteiraCredito c = carteira(u);
        if (c.getSaldo() < 1) {
            throw new BadRequest("Você não tem créditos disponíveis. Adquira créditos em Acessos e créditos.");
        }
        c.setSaldo(c.getSaldo() - 1);
        carteiraRepository.save(c);
        registrarMovimento(u, -1, motivo);
    }

    private void registrarMovimento(Usuario u, int qtd, String motivo) {
        MovimentoCredito m = new MovimentoCredito();
        m.setUsuario(u);
        m.setQuantidade(qtd);
        m.setMotivo(motivo);
        movimentoRepository.save(m);
    }

    /** Ativa ou prorroga o Plano Pro por N dias (pagamento ou bolsa por mérito). */
    @Transactional
    public Assinatura ativarPro(Usuario u, int dias, String origem) {
        Assinatura a = assinatura(u);
        LocalDateTime base = a.isProAtivo() ? a.getFim() : LocalDateTime.now();
        if (!a.isProAtivo()) a.setInicio(LocalDateTime.now());
        a.setPlano("PRO");
        a.setStatus("ATIVA");
        a.setOrigem(origem);
        a.setFim(base.plusDays(dias));
        a.setRenovacaoAutomatica("PAGAMENTO".equals(origem));
        return assinaturaRepository.save(a);
    }

    @Transactional
    public Assinatura cancelarRenovacao(Usuario u) {
        Assinatura a = assinatura(u);
        if (!a.isProAtivo()) throw new BadRequest("Você não possui assinatura Pro ativa.");
        a.setRenovacaoAutomatica(false);
        return assinaturaRepository.save(a);
    }

    /** Checkout de demonstração (RF10 / RF11). Não coleta dados de cartão e não realiza cobrança. */
    @Transactional
    public Map<String, Object> checkout(Usuario u, Requests.Checkout req) {
        if (u.getTipo() != TipoUsuario.ALUNO) throw new BadRequest("Apenas alunos podem contratar planos e créditos.");
        Pagamento p = new Pagamento();
        p.setUsuario(u);
        p.setMetodo(req.metodo());
        p.setStatus("APROVADO");
        p.setCodigoTransacao("DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        switch (req.produto()) {
            case "PRO_MENSAL" -> {
                p.setTipo("ASSINATURA_PRO");
                p.setDescricao("Plano Pro - 30 dias");
                p.setValor(precoPro);
                ativarPro(u, 30, "PAGAMENTO");
            }
            case "CREDITO_1" -> {
                p.setTipo("PACOTE_CREDITOS");
                p.setDescricao("1 crédito de correção humana / simulado extra");
                p.setValor(precoCredito);
                adicionarCreditos(u, 1, "Compra de 1 crédito");
            }
            default -> {
                p.setTipo("PACOTE_CREDITOS");
                p.setDescricao("Pacote com 5 créditos");
                p.setValor(precoPacote5);
                adicionarCreditos(u, 5, "Compra de pacote com 5 créditos");
            }
        }
        pagamentoRepository.save(p);
        notificacaoService.notificar(u, "Pagamento aprovado", p.getDescricao() + " liberado em sua conta (demonstração).", "SISTEMA", "/aluno/acessos");
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("pagamento", p);
        r.put("acessos", resumo(u));
        return r;
    }

    public Map<String, Object> precos() {
        return Map.of("proMensal", precoPro, "credito", precoCredito, "pacote5", precoPacote5);
    }

    /** UC039 - Consultar acessos e créditos. */
    @Transactional
    public Map<String, Object> resumo(Usuario u) {
        Assinatura a = assinatura(u);
        boolean pro = isPro(u);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("plano", pro ? "PRO" : "FREE");
        r.put("assinatura", Map.of(
                "status", a.getStatus(),
                "origem", a.getOrigem() == null ? "" : a.getOrigem(),
                "inicio", a.getInicio() == null ? "" : a.getInicio().toString(),
                "fim", a.getFim() == null ? "" : a.getFim().toString(),
                "renovacaoAutomatica", a.isRenovacaoAutomatica()));
        r.put("creditos", carteira(u).getSaldo());
        r.put("limites", Map.of(
                "questoesDia", limiteQuestoesDia(u),
                "questoesHoje", questoesBancaHoje(u),
                "correcoesIaMes", limiteCorrecoesIaMes(u),
                "correcoesIaUsadas", correcoesIaNoMes(u)));
        r.put("precos", precos());
        r.put("extrato", movimentoRepository.findByUsuarioIdOrderByCriadoEmDesc(u.getId()));
        r.put("pagamentos", pagamentoRepository.findByUsuarioIdOrderByCriadoEmDesc(u.getId()));
        r.put("bolsas", bolsaRepository.findByUsuarioIdOrderByConcedidaEmDesc(u.getId()));
        return r;
    }
}
