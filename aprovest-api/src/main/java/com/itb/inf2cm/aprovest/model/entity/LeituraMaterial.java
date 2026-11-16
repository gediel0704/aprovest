package com.itb.inf2cm.aprovest.model.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Progresso de leitura de um material (UC015). */
@Entity
@Table(name = "LeituraMaterial")
@Getter
@Setter
@NoArgsConstructor
public class LeituraMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private boolean concluido;
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;
}
