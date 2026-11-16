package com.itb.inf2cm.aprovest.dto;

/**
 * Envelope padrão das respostas da API: { "data": ..., "message": ... }.
 * No front-end os dados ficam em response.data.data (como na API do projeto modelo).
 */
public record ApiResponse<T>(T data, String message) {

    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<T> of(T data, String message) {
        return new ApiResponse<>(data, message);
    }
}
