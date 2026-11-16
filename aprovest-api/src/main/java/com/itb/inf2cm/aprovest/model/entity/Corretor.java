package com.itb.inf2cm.aprovest.model.entity;

import com.itb.inf2cm.aprovest.model.enums.TipoUsuario;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Professor/corretor credenciado de redações (RF05, UC027-UC029, UC040). */
@Entity
@DiscriminatorValue("CORRETOR")
@Getter
@Setter
@NoArgsConstructor
public class Corretor extends Usuario {

    @Column(length = 150)
    private String formacao;

    @Override
    public TipoUsuario getTipo() {
        return TipoUsuario.CORRETOR;
    }
}
