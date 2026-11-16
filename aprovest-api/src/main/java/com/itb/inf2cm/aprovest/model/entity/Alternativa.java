package com.itb.inf2cm.aprovest.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "Alternativa")
@Getter
@Setter
@NoArgsConstructor
public class Alternativa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1, nullable = false)
    private String letra;

    @Column(columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String texto;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "questao_id", nullable = false)
    private Questao questao;
}
