package com.itb.inf2cm.aprovest.model.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Saldo de créditos avulsos (correção humana e simulados extras - RF11). */
@Entity
@Table(name = "CarteiraCredito")
@Getter
@Setter
@NoArgsConstructor
public class CarteiraCredito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int saldo;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
}
