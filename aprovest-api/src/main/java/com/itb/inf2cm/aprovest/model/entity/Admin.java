package com.itb.inf2cm.aprovest.model.entity;

import com.itb.inf2cm.aprovest.model.enums.TipoUsuario;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@DiscriminatorValue("ADMIN")
@Getter
@Setter
@NoArgsConstructor
public class Admin extends Usuario {

    @Column(length = 20)
    private String nivelAcesso;

    @Override
    public TipoUsuario getTipo() {
        return TipoUsuario.ADMIN;
    }
}
