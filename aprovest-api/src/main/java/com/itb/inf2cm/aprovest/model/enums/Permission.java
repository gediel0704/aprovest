package com.itb.inf2cm.aprovest.model.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Permissões granulares (mesmo padrão do projeto modelo). */
@Getter
@AllArgsConstructor
public enum Permission {

    // ESTUDO (aluno)
    ESTUDO_READ("ESTUDO_READ"),
    ESTUDO_CREATE("ESTUDO_CREATE"),
    REDACAO_MANAGE("REDACAO_MANAGE"),

    // CORREÇÃO (corretor)
    CORRECAO_READ("CORRECAO_READ"),
    CORRECAO_MANAGE("CORRECAO_MANAGE"),
    CONTEUDO_REVIEW("CONTEUDO_REVIEW"),

    // ADMINISTRAÇÃO
    QUESTAO_MANAGE("QUESTAO_MANAGE"),
    MATERIAL_MANAGE("MATERIAL_MANAGE"),
    USUARIO_MANAGE("USUARIO_MANAGE"),
    RELATORIO_READ("RELATORIO_READ"),
    SISTEMA_MANAGE("SISTEMA_MANAGE");

    private final String permission;
}
