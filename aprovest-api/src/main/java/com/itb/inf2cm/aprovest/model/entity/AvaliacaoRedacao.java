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

/**
 * Correção de uma redação (por IA ou humana). Guarda uma cópia do texto
 * enviado (snapshot): editar ou excluir a redação não altera o histórico.
 */
@Entity
@Table(name = "AvaliacaoRedacao")
@Getter
@Setter
@NoArgsConstructor
public class AvaliacaoRedacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo;     // IA | HUMANA
    private String status;   // PROCESSANDO | PENDENTE | ATRIBUIDA | CONCLUIDA | ERRO
    private String tituloSnapshot;
    private String temaSnapshot;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String textoSnapshot;
    @Column(columnDefinition = "DECIMAL(7,2)")
    private BigDecimal notaTotal;
    @Column(columnDefinition = "DECIMAL(7,2)")
    private BigDecimal notaMaxima;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String feedbackGeral;
    private String modeloIa;
    private LocalDateTime prazo;
    private LocalDateTime solicitadaEm = LocalDateTime.now();
    private LocalDateTime concluidaEm;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "redacao_id")
    private Redacao redacao;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "vestibular_id", nullable = false)
    private Vestibular vestibular;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "corretor_id")
    private Usuario corretor;

    @OneToMany(mappedBy = "avaliacao", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<NotaCriterio> notas = new ArrayList<>();

    public Long getRedacaoId() {
        return redacao == null ? null : redacao.getId();
    }

    public String getCorretorNome() {
        return corretor == null ? null : corretor.getNome();
    }

    public String getAlunoNome() {
        return usuario == null ? null : usuario.getNome();
    }
}
