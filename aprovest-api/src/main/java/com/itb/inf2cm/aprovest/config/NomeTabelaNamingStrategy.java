package com.itb.inf2cm.aprovest.config;

import org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy;
import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment;

/**
 * Mantém o nome das tabelas exatamente como está no @Table (ex.: SessaoEstudo),
 * igual ao script SQL, e converte os atributos camelCase em colunas snake_case
 * (ex.: dataNascimento -> data_nascimento).
 */
public class NomeTabelaNamingStrategy extends CamelCaseToUnderscoresNamingStrategy {

    @Override
    public Identifier toPhysicalTableName(Identifier logicalName, JdbcEnvironment context) {
        return logicalName;
    }
}
