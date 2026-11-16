package com.itb.inf2cm.aprovest.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itb.inf2cm.aprovest.config.UsuarioLogado;
import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.model.services.EstudoService;

import jakarta.validation.Valid;

/** Diagnóstico (RF02), banca adaptativa (RF03), simulados (RF06) e repetição espaçada (RF17). */
@RestController
@RequestMapping("/api/v1/estudo")
public class EstudoController {

    private final EstudoService service;
    private final UsuarioLogado logado;

    public EstudoController(EstudoService service, UsuarioLogado logado) {
        this.service = service;
        this.logado = logado;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        return ResponseEntity.ok(ApiResponse.of(service.status(logado.get())));
    }

    @PostMapping("/diagnostico")
    public ResponseEntity<ApiResponse<Map<String, Object>>> diagnostico(@Valid @RequestBody Requests.IniciarSessao req) {
        return ResponseEntity.ok(ApiResponse.of(service.iniciarDiagnostico(logado.get(), req)));
    }

    @PostMapping("/banca")
    public ResponseEntity<ApiResponse<Map<String, Object>>> banca(@Valid @RequestBody Requests.IniciarSessao req) {
        return ResponseEntity.ok(ApiResponse.of(service.iniciarBanca(logado.get(), req)));
    }

    @PostMapping("/simulados")
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulado(@Valid @RequestBody Requests.IniciarSessao req) {
        return ResponseEntity.ok(ApiResponse.of(service.iniciarSimulado(logado.get(), req)));
    }

    @GetMapping("/sessoes/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sessao(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(service.obter(logado.get(), id)));
    }

    @PostMapping("/sessoes/{id}/respostas")
    public ResponseEntity<ApiResponse<Map<String, Object>>> responder(@PathVariable Long id, @Valid @RequestBody Requests.Responder req) {
        return ResponseEntity.ok(ApiResponse.of(service.responder(logado.get(), id, req)));
    }

    @PostMapping("/sessoes/{id}/concluir")
    public ResponseEntity<ApiResponse<Map<String, Object>>> concluir(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(service.concluir(logado.get(), id)));
    }

    @GetMapping("/sessoes/{id}/resultado")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resultado(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(service.resultado(logado.get(), id)));
    }
}
