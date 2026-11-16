package com.itb.inf2cm.aprovest.model.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Plano do aluno: FREE ou PRO (RF10 / RN02). */
@Entity
@Table(name = "Assinatura")
@Getter
@Setter
@NoArgsConstructor
public class Assinatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String plano = "FREE";
    private String status = "ATIVA";
    private String origem;
    private LocalDateTime inicio;
    private LocalDateTime fim;
    private boolean renovacaoAutomatica;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    public boolean isProAtivo() {
        return "PRO".equals(plano) && "ATIVA".equals(status) && fim != null && fim.isAfter(LocalDateTime.now());
    }
}
