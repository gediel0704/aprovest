package com.itb.inf2cm.aprovest.model.entity;

import java.time.LocalDateTime;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Material da biblioteca: resumo interno ou documento oficial (UC014 / UC016). */
@Entity
@Table(name = "Material")
@Getter
@Setter
@NoArgsConstructor
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;
    private String resumo;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String conteudo;
    private String tipo;
    private boolean oficial;
    private String fonteOrgao;
    private String fonteUrl;
    private Integer ano;
    private LocalDateTime criadoEm = LocalDateTime.now();
    private boolean codStatus = true;

    @ManyToOne
    @JoinColumn(name = "vestibular_id")
    private Vestibular vestibular;

    @ManyToOne
    @JoinColumn(name = "disciplina_id")
    private Disciplina disciplina;
}
