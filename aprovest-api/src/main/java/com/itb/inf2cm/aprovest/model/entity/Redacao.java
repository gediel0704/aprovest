package com.itb.inf2cm.aprovest.model.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Redação do caderno do aluno (UC020-UC023). */
@Entity
@Table(name = "Redacao")
@Getter
@Setter
@NoArgsConstructor
public class Redacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;
    private String tema;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String texto;
    private String status = "RASCUNHO";
    private LocalDateTime criadoEm = LocalDateTime.now();
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "vestibular_id", nullable = false)
    private Vestibular vestibular;

    @ManyToOne
    @JoinColumn(name = "tema_redacao_id")
    private TemaRedacao temaRedacao;

    public int getPalavras() {
        return texto == null || texto.isBlank() ? 0 : texto.trim().split("\\s+").length;
    }
}
