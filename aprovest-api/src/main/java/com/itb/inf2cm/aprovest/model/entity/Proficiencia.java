package com.itb.inf2cm.aprovest.model.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Proficiência do aluno por tópico, medida pelo rating Elo (TRI simplificada). */
@Entity
@Table(name = "Proficiencia")
@Getter
@Setter
@NoArgsConstructor
public class Proficiencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "DECIMAL(7,2)")
    private BigDecimal rating = BigDecimal.valueOf(1000);
    private int acertos;
    private int tentativas;
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "topico_id", nullable = false)
    private Topico topico;
}
