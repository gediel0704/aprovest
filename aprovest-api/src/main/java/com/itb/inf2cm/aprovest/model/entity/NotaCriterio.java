package com.itb.inf2cm.aprovest.model.entity;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Nota de um critério/competência oficial (ENEM C1-C5, FUVEST Q1-Q4, Unicamp Pt/G/Lt/CeC). */
@Entity
@Table(name = "NotaCriterio")
@Getter
@Setter
@NoArgsConstructor
public class NotaCriterio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codigo;
    private String nome;
    @Column(columnDefinition = "DECIMAL(7,2)")
    private BigDecimal nota;
    @Column(columnDefinition = "DECIMAL(7,2)")
    private BigDecimal notaMaxima;
    @Column(columnDefinition = "DECIMAL(4,2)")
    private BigDecimal peso = BigDecimal.ONE;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String comentario;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "avaliacao_id", nullable = false)
    private AvaliacaoRedacao avaliacao;
}
