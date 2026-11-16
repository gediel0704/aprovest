package com.itb.inf2cm.aprovest.model.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Parecer de um professor sobre uma questão (UC029). */
@Entity
@Table(name = "ParecerConteudo")
@Getter
@Setter
@NoArgsConstructor
public class ParecerConteudo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String veredito;
    @Column(columnDefinition = "NVARCHAR(1000)")
    private String comentario;
    @JsonIgnore
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String questaoSnapshot;
    private LocalDateTime criadoEm = LocalDateTime.now();

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "questao_id", nullable = false)
    private Questao questao;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "corretor_id", nullable = false)
    private Usuario corretor;

    public Long getQuestaoId() {
        return questao == null ? null : questao.getId();
    }

    public String getCorretorNome() {
        return corretor == null ? null : corretor.getNome();
    }
}
