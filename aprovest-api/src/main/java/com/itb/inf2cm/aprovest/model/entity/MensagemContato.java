package com.itb.inf2cm.aprovest.model.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Mensagem enviada pela página pública Fale Conosco (RF20 / UC048 e UC049). */
@Entity
@Table(name = "MensagemContato")
@Getter
@Setter
@NoArgsConstructor
public class MensagemContato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String email;
    private String assunto;
    private String mensagem;
    private String status = "NOVA";
    private String observacao;
    private LocalDateTime criadoEm = LocalDateTime.now();
    private LocalDateTime atualizadoEm;
}
