package com.itb.inf2cm.aprovest.model.entity;

import com.itb.inf2cm.aprovest.model.enums.TipoUsuario;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("ALUNO")
@NoArgsConstructor
public class Aluno extends Usuario {

    @Override
    public TipoUsuario getTipo() {
        return TipoUsuario.ALUNO;
    }
}
