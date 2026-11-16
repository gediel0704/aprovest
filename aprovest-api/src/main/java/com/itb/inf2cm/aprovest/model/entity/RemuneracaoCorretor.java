package com.itb.inf2cm.aprovest.model.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Valor registrado ao corretor por correção concluída (UC040). Não executa transferências. */
@Entity
@Table(name = "RemuneracaoCorretor")
@Getter
@Setter
@NoArgsConstructor
public class RemuneracaoCorretor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "DECIMAL(10,2)")
    private BigDecimal valor;
    private String status = "REGISTRADO";
    private LocalDateTime criadoEm = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "avaliacao_id", nullable = false)
    private AvaliacaoRedacao avaliacao;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "corretor_id", nullable = false)
    private Usuario corretor;
}
