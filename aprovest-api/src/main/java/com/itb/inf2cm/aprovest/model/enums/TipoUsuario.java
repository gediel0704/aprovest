package com.itb.inf2cm.aprovest.model.enums;

import static com.itb.inf2cm.aprovest.model.enums.Permission.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Papéis do sistema (RF09). O "Aluno Pro" não é um papel separado: é o Aluno
 * com assinatura PRO ativa (tabela Assinatura), o que evita duplicar permissões.
 */
@Getter
@AllArgsConstructor
public enum TipoUsuario {

    ALUNO(Set.of(ESTUDO_READ, ESTUDO_CREATE, REDACAO_MANAGE)),

    CORRETOR(Set.of(CORRECAO_READ, CORRECAO_MANAGE, CONTEUDO_REVIEW)),

    ADMIN(Set.of(ESTUDO_READ, ESTUDO_CREATE, REDACAO_MANAGE,
            CORRECAO_READ, CORRECAO_MANAGE, CONTEUDO_REVIEW,
            QUESTAO_MANAGE, MATERIAL_MANAGE, USUARIO_MANAGE, RELATORIO_READ, SISTEMA_MANAGE));

    private final Set<Permission> permissions;

    public List<SimpleGrantedAuthority> getAuthorities() {
        var authorities = getPermissions().stream()
                .map(p -> new SimpleGrantedAuthority(p.getPermission()))
                .collect(Collectors.toList());
        authorities.add(new SimpleGrantedAuthority("ROLE_" + this.name()));
        return authorities;
    }
}
