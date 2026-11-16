package com.itb.inf2cm.aprovest.model.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Agenda de repetição espaçada de uma questão para um aluno (RF17). */
@Entity
@Table(name = "Revisao")
@Getter
@Setter
@NoArgsConstructor
public class Revisao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int intervaloDias = 1;
    private int repeticoes;
    @Column(columnDefinition = "DECIMAL(4,2)")
    private BigDecimal facilidade = BigDecimal.valueOf(2.5);
    private LocalDate proximaRevisao;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "questao_id", nullable = false)
    private Questao questao;
}
