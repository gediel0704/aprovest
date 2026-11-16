package com.itb.inf2cm.aprovest.config;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.itb.inf2cm.aprovest.model.entity.Assinatura;
import com.itb.inf2cm.aprovest.model.entity.Pagamento;
import com.itb.inf2cm.aprovest.model.entity.Usuario;
import com.itb.inf2cm.aprovest.model.enums.TipoUsuario;
import com.itb.inf2cm.aprovest.model.repository.AssinaturaRepository;
import com.itb.inf2cm.aprovest.model.repository.BolsaMeritoRepository;
import com.itb.inf2cm.aprovest.model.repository.NotificacaoRepository;
import com.itb.inf2cm.aprovest.model.repository.PagamentoRepository;
import com.itb.inf2cm.aprovest.model.repository.UsuarioRepository;
import com.itb.inf2cm.aprovest.model.services.AdminService;
import com.itb.inf2cm.aprovest.model.services.NotificacaoService;

/** Rotinas automáticas: RF13 (notificações), RF12 (bolsa mensal) e RF10 (renovação/expiração do Pro). */
@Component
public class TarefasAgendadas {

    private static final Logger log = LoggerFactory.getLogger(TarefasAgendadas.class);

    private final UsuarioRepository usuarioRepository;
    private final NotificacaoRepository notificacaoRepository;
    private final NotificacaoService notificacaoService;
    private final AssinaturaRepository assinaturaRepository;
    private final PagamentoRepository pagamentoRepository;
    private final BolsaMeritoRepository bolsaRepository;
    private final AdminService adminService;

    @Value("${app.preco.pro-mensal}") private java.math.BigDecimal precoPro;

    public TarefasAgendadas(UsuarioRepository usuarioRepository, NotificacaoRepository notificacaoRepository,
                            NotificacaoService notificacaoService, AssinaturaRepository assinaturaRepository,
                            PagamentoRepository pagamentoRepository, BolsaMeritoRepository bolsaRepository,
                            AdminService adminService) {
        this.usuarioRepository = usuarioRepository;
        this.notificacaoRepository = notificacaoRepository;
        this.notificacaoService = notificacaoService;
        this.assinaturaRepository = assinaturaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.bolsaRepository = bolsaRepository;
        this.adminService = adminService;
    }

    /** Todos os dias às 6h: "nova banca diária disponível". */
    @Scheduled(cron = "0 0 6 * * *", zone = "America/Sao_Paulo")
    @Transactional
    public void notificarBancaDiaria() {
        LocalDateTime hoje = LocalDate.now().atStartOfDay();
        for (Usuario u : usuarioRepository.findByTipoUsuarioAndCodStatusTrue(TipoUsuario.ALUNO)) {
            if (!notificacaoRepository.existsByUsuarioIdAndTipoAndCriadoEmAfter(u.getId(), "BANCA", hoje)) {
                notificacaoService.notificar(u, "Sua banca diária está pronta", "Novas questões calibradas para o seu nível te esperam hoje.", "BANCA", "/aluno/banca");
            }
        }
    }

    /** Toda segunda-feira às 7h: abertura do simulado semanal. No dia 1º, também do mensal. */
    @Scheduled(cron = "0 0 7 * * MON", zone = "America/Sao_Paulo")
    @Transactional
    public void notificarSimulado() {
        for (Usuario u : usuarioRepository.findByTipoUsuarioAndCodStatusTrue(TipoUsuario.ALUNO)) {
            notificacaoService.notificar(u, "Simulado semanal aberto", "O simulado da semana já está disponível. Reserve 60 minutos!", "SIMULADO", "/aluno/simulados");
        }
    }

    /** Dia 1º às 3h: concede automaticamente as bolsas do mês encerrado (RF12). */
    @Scheduled(cron = "0 0 3 1 * *", zone = "America/Sao_Paulo")
    public void bolsaMensal() {
        String mes = YearMonth.now().minusMonths(1).toString();
        if (bolsaRepository.existsByMesReferencia(mes)) return;
        try {
            log.info("Bolsas de {}: {}", mes, adminService.concederBolsas(mes));
        } catch (Exception e) {
            log.warn("Não foi possível conceder as bolsas de {}: {}", mes, e.getMessage());
        }
    }

    /** A cada hora: renova (demonstração) ou expira assinaturas Pro vencidas. */
    @Scheduled(fixedDelay = 3_600_000, initialDelay = 90_000)
    @Transactional
    public void processarAssinaturas() {
        for (Assinatura a : assinaturaRepository.findByPlanoAndStatusAndFimBefore("PRO", "ATIVA", LocalDateTime.now())) {
            if (a.isRenovacaoAutomatica() && "PAGAMENTO".equals(a.getOrigem())) {
                Pagamento p = new Pagamento();
                p.setUsuario(a.getUsuario());
                p.setTipo("ASSINATURA_PRO");
                p.setDescricao("Renovação automática do Plano Pro - 30 dias");
                p.setValor(precoPro);
                p.setMetodo("CARTAO");
                p.setStatus("APROVADO");
                p.setCodigoTransacao("DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                pagamentoRepository.save(p);
                a.setFim(a.getFim().plusDays(30));
                notificacaoService.notificar(a.getUsuario(), "Plano Pro renovado", "Sua assinatura foi renovada por mais 30 dias (demonstração).", "SISTEMA", "/aluno/acessos");
            } else {
                a.setStatus("EXPIRADA");
                a.setPlano("FREE");
                notificacaoService.notificar(a.getUsuario(), "Plano Pro encerrado", "Seu acesso Pro terminou. Você continua com o plano gratuito.", "SISTEMA", "/aluno/acessos");
            }
            assinaturaRepository.save(a);
        }
    }
}
