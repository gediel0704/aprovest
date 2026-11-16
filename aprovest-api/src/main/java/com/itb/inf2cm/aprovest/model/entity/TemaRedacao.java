package com.itb.inf2cm.aprovest.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Tema/proposta de redação oficial (ou sugerido por IA e aprovado pelo admin). */
@Entity
@Table(name = "TemaRedacao")
@Getter
@Setter
@NoArgsConstructor
public class TemaRedacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String proposta;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String textosApoio;
    /** Abordagem esperada publicada pela banca oficial; usada como referência pela IA. */
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String expectativaBanca;
    private String genero = "Dissertativo-argumentativo";
    private Integer ano;
    private String origem = "OFICIAL";
    private String fonteDescricao;
    private String fonteUrl;
    private boolean codStatus = true;

    @ManyToOne
    @JoinColumn(name = "vestibular_id", nullable = false)
    private Vestibular vestibular;
}
