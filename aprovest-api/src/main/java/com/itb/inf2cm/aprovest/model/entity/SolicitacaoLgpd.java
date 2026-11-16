package com.itb.inf2cm.aprovest.model.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Solicitação do titular dos dados - LGPD (UC008 / UC009 / RN05). */
@Entity
@Table(name = "SolicitacaoLgpd")
@Getter
@Setter
@NoArgsConstructor
public class SolicitacaoLgpd {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo;
    private String status = "PENDENTE";
    private String observacao;
    private LocalDateTime criadoEm = LocalDateTime.now();
    private LocalDateTime concluidoEm;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    public Long getUsuarioId() {
        return usuario == null ? null : usuario.getId();
    }

    public String getUsuarioEmail() {
        return usuario == null ? null : usuario.getEmail();
    }
}
