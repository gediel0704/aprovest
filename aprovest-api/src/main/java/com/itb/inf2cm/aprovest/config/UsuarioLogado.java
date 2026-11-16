package com.itb.inf2cm.aprovest.config;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.itb.inf2cm.aprovest.exceptions.Unauthorized;
import com.itb.inf2cm.aprovest.model.entity.Usuario;
import com.itb.inf2cm.aprovest.model.repository.UsuarioRepository;

/** Obtém o usuário autenticado na requisição atual (a partir do token JWT). */
@Component
public class UsuarioLogado {

    private final UsuarioRepository usuarioRepository;

    public UsuarioLogado(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Usuario get() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Usuario u)) {
            throw new Unauthorized("Faça login para continuar.");
        }
        return usuarioRepository.findById(u.getId()).orElseThrow(() -> new Unauthorized("Usuário não encontrado."));
    }
}
