package com.itb.inf2cm.aprovest.model.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Bolsa por mérito: 1 mês de Plano Pro aos 100 melhores do ranking mensal (RF12 / UC036). */
@Entity
@Table(name = "BolsaMerito")
@Getter
@Setter
@NoArgsConstructor
public class BolsaMerito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String mesReferencia;
    private int posicao;
    @Column(columnDefinition = "DECIMAL(9,2)")
    private BigDecimal pontuacao;
    private LocalDateTime concedidaEm = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    public String getAlunoNome() {
        return usuario == null ? null : usuario.getNome();
    }
}
