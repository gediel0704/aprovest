package com.itb.inf2cm.aprovest.exceptions;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;

/** @RestControllerAdvice: captura todos os erros lançados pela aplicação (padrão do projeto modelo). */
@RestControllerAdvice
public class AppExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AppExceptionHandler.class);
    private static final ZoneId ZONE_BRASIL = ZoneId.of("America/Sao_Paulo");
    private static final Map<Class<? extends Exception>, HttpStatus> EXCEPTION_STATUS_MAP = new HashMap<>();

    static {
        EXCEPTION_STATUS_MAP.put(BadRequest.class, HttpStatus.BAD_REQUEST);
        EXCEPTION_STATUS_MAP.put(NotFound.class, HttpStatus.NOT_FOUND);
        EXCEPTION_STATUS_MAP.put(Unauthorized.class, HttpStatus.UNAUTHORIZED);
        EXCEPTION_STATUS_MAP.put(Forbidden.class, HttpStatus.FORBIDDEN);
        EXCEPTION_STATUS_MAP.put(AccessDeniedException.class, HttpStatus.FORBIDDEN);
        EXCEPTION_STATUS_MAP.put(AuthorizationDeniedException.class, HttpStatus.FORBIDDEN);
        EXCEPTION_STATUS_MAP.put(MethodArgumentTypeMismatchException.class, HttpStatus.BAD_REQUEST);
        EXCEPTION_STATUS_MAP.put(HttpMessageNotReadableException.class, HttpStatus.BAD_REQUEST);
        EXCEPTION_STATUS_MAP.put(NoResourceFoundException.class, HttpStatus.NOT_FOUND);
        EXCEPTION_STATUS_MAP.put(HttpRequestMethodNotSupportedException.class, HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorMessage> handleValidation(MethodArgumentNotValidException ex) {
        String[] mensagens = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getDefaultMessage()).toArray(String[]::new);
        return new ResponseEntity<>(new ErrorMessage(LocalDateTime.now(ZONE_BRASIL), mensagens, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleAllExceptions(Exception exception, HttpServletRequest request) {
        HttpStatus status = EXCEPTION_STATUS_MAP.getOrDefault(exception.getClass(), HttpStatus.INTERNAL_SERVER_ERROR);
        String message;
        if (status == HttpStatus.FORBIDDEN && !(exception instanceof Forbidden)) {
            message = "Você não tem permissão para acessar este recurso.";
        } else if (status == HttpStatus.INTERNAL_SERVER_ERROR) {
            log.error("Erro interno em {}", request.getRequestURI(), exception);
            message = "Ocorreu um erro interno. Tente novamente em instantes.";
        } else if (exception instanceof HttpMessageNotReadableException || exception instanceof MethodArgumentTypeMismatchException) {
            message = "Dados enviados em formato inválido.";
        } else if (exception instanceof NoResourceFoundException) {
            message = "Recurso não encontrado.";
        } else if (exception instanceof HttpRequestMethodNotSupportedException) {
            message = "Método não permitido para este recurso.";
        } else {
            message = exception.getLocalizedMessage() != null ? exception.getLocalizedMessage() : exception.toString();
        }
        ErrorMessage errorMessage = new ErrorMessage(LocalDateTime.now(ZONE_BRASIL), new String[]{message}, status);
        return new ResponseEntity<>(errorMessage, new HttpHeaders(), status);
    }
}
