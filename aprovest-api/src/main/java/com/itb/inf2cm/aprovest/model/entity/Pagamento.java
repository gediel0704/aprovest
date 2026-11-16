package com.itb.inf2cm.aprovest.model.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Pagamento do checkout de demonstração (nenhuma cobrança real é realizada). */
@Entity
@Table(name = "Pagamento")
@Getter
@Setter
@NoArgsConstructor
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo;
    private String descricao;
    @Column(columnDefinition = "DECIMAL(10,2)")
    private BigDecimal valor;
    private String metodo;
    private String status;
    private String codigoTransacao;
    private LocalDateTime criadoEm = LocalDateTime.now();

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
}
