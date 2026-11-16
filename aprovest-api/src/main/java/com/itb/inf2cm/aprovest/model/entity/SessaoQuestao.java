package com.itb.inf2cm.aprovest.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "SessaoQuestao")
@Getter
@Setter
@NoArgsConstructor
public class SessaoQuestao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int ordem;

    @ManyToOne
    @JoinColumn(name = "sessao_id", nullable = false)
    private SessaoEstudo sessao;

    @ManyToOne
    @JoinColumn(name = "questao_id", nullable = false)
    private Questao questao;
}
