package com.itb.inf2cm.aprovest.model.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "Resposta")
@Getter
@Setter
@NoArgsConstructor
public class Resposta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1)
    private String alternativaMarcada;
    private boolean correta;
    private Integer tempoSegundos;
    private LocalDateTime respondidaEm = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "sessao_id", nullable = false)
    private SessaoEstudo sessao;

    @ManyToOne
    @JoinColumn(name = "questao_id", nullable = false)
    private Questao questao;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
}
