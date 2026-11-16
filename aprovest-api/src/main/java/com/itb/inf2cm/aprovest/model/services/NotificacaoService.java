package com.itb.inf2cm.aprovest.model.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itb.inf2cm.aprovest.exceptions.NotFound;
import com.itb.inf2cm.aprovest.model.entity.Notificacao;
import com.itb.inf2cm.aprovest.model.entity.Usuario;
import com.itb.inf2cm.aprovest.model.enums.TipoUsuario;
import com.itb.inf2cm.aprovest.model.repository.NotificacaoRepository;
import com.itb.inf2cm.aprovest.model.repository.UsuarioRepository;

/** RF13 / UC007 - Notificações internas, respeitando as preferências do usuário (RF14). */
@Service
public class NotificacaoService {

    private final NotificacaoRepository repository;
    private final UsuarioRepository usuarioRepository;

    public NotificacaoService(NotificacaoRepository repository, UsuarioRepository usuarioRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    /** tipo: BANCA | REDACAO | SIMULADO | NOVIDADE | SISTEMA (SISTEMA sempre é enviada). */
    @Transactional
    public void notificar(Usuario usuario, String titulo, String mensagem, String tipo, String link) {
        boolean permitido = switch (tipo) {
            case "BANCA" -> usuario.isNotifBanca();
            case "REDACAO" -> usuario.isNotifRedacao();
            case "SIMULADO" -> usuario.isNotifSimulado();
            case "NOVIDADE" -> usuario.isNotifNovidades();
            default -> true;
        };
        if (!permitido || !usuario.isCodStatus()) return;
        Notificacao n = new Notificacao();
        n.setUsuario(usuario);
        n.setTitulo(titulo);
        n.setMensagem(mensagem.length() > 600 ? mensagem.substring(0, 597) + "..." : mensagem);
        n.setTipo(tipo);
        n.setLink(link);
        repository.save(n);
    }

    public List<Notificacao> listar(Usuario u) {
        return repository.findTop50ByUsuarioIdOrderByCriadoEmDesc(u.getId());
    }

    public long naoLidas(Usuario u) {
        return repository.countByUsuarioIdAndLidaFalse(u.getId());
    }

    @Transactional
    public Notificacao marcarLida(Usuario u, Long id) {
        Notificacao n = repository.findByIdAndUsuarioId(id, u.getId()).orElseThrow(() -> new NotFound("Notificação não encontrada."));
        n.setLida(true);
        return repository.save(n);
    }

    @Transactional
    public int marcarTodasLidas(Usuario u) {
        return repository.marcarTodasLidas(u.getId());
    }

    /** Comunicado do administrador para todos os alunos ("novidades da plataforma"). */
    @Transactional
    public int comunicado(String titulo, String mensagem, String link) {
        List<Usuario> alunos = usuarioRepository.findByTipoUsuarioAndCodStatusTrue(TipoUsuario.ALUNO);
        alunos.forEach(a -> notificar(a, titulo, mensagem, "NOVIDADE", link));
        return alunos.size();
    }

    @Transactional
    public void notificarAdmins(String titulo, String mensagem, String link) {
        usuarioRepository.findByTipoUsuarioAndCodStatusTrue(TipoUsuario.ADMIN)
                .forEach(a -> notificar(a, titulo, mensagem, "SISTEMA", link));
    }
}
