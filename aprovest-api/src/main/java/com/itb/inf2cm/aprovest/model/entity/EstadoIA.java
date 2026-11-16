package com.itb.inf2cm.aprovest.model.entity;

import java.time.LocalDateTime;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Estado operacional global do serviço de IA (UC042). */
@Entity
@Table(name = "EstadoIA")
@Getter
@Setter
@NoArgsConstructor
public class EstadoIA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private boolean pausado;
    private String motivo;
    private LocalDateTime atualizadoEm = LocalDateTime.now();
    private String atualizadoPor;
}
