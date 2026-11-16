package com.itb.inf2cm.aprovest.controller;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.model.services.ConteudoService;

/** Endpoints públicos (UC001 - consultar páginas públicas). */
@RestController
@RequestMapping("/api/v1")
public class IndexController {

    private final ConteudoService conteudoService;

    public IndexController(ConteudoService conteudoService) {
        this.conteudoService = conteudoService;
    }

    @GetMapping("/index")
    public ResponseEntity<ApiResponse<Map<String, Object>>> index() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("aplicacao", "AproVest API");
        m.put("versao", "1.0.0");
        m.put("status", "online");
        m.put("horario", LocalDateTime.now());
        m.put("documentacao", "Veja o README.md no repositório do projeto.");
        return ResponseEntity.ok(ApiResponse.of(m));
    }

    @GetMapping("/publico/numeros")
    public ResponseEntity<ApiResponse<Map<String, Object>>> numeros() {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.numerosPublicos()));
    }

    @GetMapping("/publico/catalogo")
    public ResponseEntity<ApiResponse<Map<String, Object>>> catalogo() {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.catalogo()));
    }
}
