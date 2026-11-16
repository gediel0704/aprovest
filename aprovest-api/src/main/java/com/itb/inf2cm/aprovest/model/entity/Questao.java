package com.itb.inf2cm.aprovest.model.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Questão objetiva de vestibular (RF08 / RN04). */
@Entity
@Table(name = "Questao")
@Getter
@Setter
@NoArgsConstructor
public class Questao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String enunciado;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String introducaoAlternativas;

    /** Gabarito: nunca é enviado ao aluno antes da resposta (ver EstudoService). */
    @JsonIgnore
    @Column(length = 1, nullable = false)
    private String gabarito;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String explicacao;

    @Column(columnDefinition = "DECIMAL(7,2)")
    private BigDecimal dificuldade = BigDecimal.valueOf(1000);

    private String nivel = "MEDIO";
    private Integer ano;
    private Integer numero;
    private String origem = "OFICIAL";
    private String fonteDescricao;
    private String fonteUrl;
    private int totalRespostas;
    private int totalAcertos;
    private LocalDateTime criadoEm = LocalDateTime.now();
    private boolean codStatus = true;

    @ManyToOne
    @JoinColumn(name = "vestibular_id", nullable = false)
    private Vestibular vestibular;

    @ManyToOne
    @JoinColumn(name = "disciplina_id", nullable = false)
    private Disciplina disciplina;

    @OneToMany(mappedBy = "questao", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("letra ASC")
    private List<Alternativa> alternativas = new ArrayList<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "QuestaoTopico",
            joinColumns = @JoinColumn(name = "questao_id"),
            inverseJoinColumns = @JoinColumn(name = "topico_id"))
    private Set<Topico> topicos = new HashSet<>();

    public void adicionarAlternativa(String letra, String texto) {
        Alternativa a = new Alternativa();
        a.setLetra(letra);
        a.setTexto(texto);
        a.setQuestao(this);
        alternativas.add(a);
    }

    /** Taxa de acerto observada na plataforma (0 a 100). */
    public Double getTaxaAcerto() {
        return totalRespostas == 0 ? null : Math.round(totalAcertos * 1000.0 / totalRespostas) / 10.0;
    }
}
