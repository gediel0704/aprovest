package com.itb.inf2cm.aprovest.dto;

import java.util.List;

import org.springframework.data.domain.Page;

/** Página de resultados com formato estável para o front-end. */
public record Pagina<T>(List<T> content, long totalElements, int totalPages, int number, int size) {

    public static <T> Pagina<T> de(Page<T> page) {
        return new Pagina<>(page.getContent(), page.getTotalElements(), page.getTotalPages(), page.getNumber(), page.getSize());
    }
}
