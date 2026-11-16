package com.itb.inf2cm.aprovest.model.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Sessão de Diagnóstico, Banca diária ou Simulado (RF02, RF03, RF06). */
@Entity
@Table(name = "SessaoEstudo")
@Getter
@Setter
@NoArgsConstructor
public class SessaoEstudo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String modo;            // DIAGNOSTICO | BANCA | SIMULADO
    private String tipoSimulado;    // SEMANAL | MENSAL
    private String status = "EM_ANDAMENTO";
    private int totalQuestoes;
    private int acertos;

    @Column(columnDefinition = "DECIMAL(7,2)")
    private BigDecimal notaEstimada;
    @Column(columnDefinition = "DECIMAL(5,2)")
    private BigDecimal percentil;
    private Integer comparaveis;

    private LocalDateTime iniciadaEm = LocalDateTime.now();
    private LocalDateTime expiraEm;
    private LocalDateTime concluidaEm;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "vestibular_id", nullable = false)
    private Vestibular vestibular;

    @JsonIgnore
    @OneToMany(mappedBy = "sessao", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    private List<SessaoQuestao> questoes = new ArrayList<>();
}
