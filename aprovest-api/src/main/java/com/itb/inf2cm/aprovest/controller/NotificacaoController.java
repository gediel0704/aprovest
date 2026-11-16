package com.itb.inf2cm.aprovest.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itb.inf2cm.aprovest.config.UsuarioLogado;
import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.model.entity.Notificacao;
import com.itb.inf2cm.aprovest.model.services.NotificacaoService;

/** RF13 / UC007 - Notificações. */
@RestController
@RequestMapping("/api/v1/notificacoes")
public class NotificacaoController {

    private final NotificacaoService service;
    private final UsuarioLogado logado;

    public NotificacaoController(NotificacaoService service, UsuarioLogado logado) {
        this.service = service;
        this.logado = logado;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notificacao>>> listar() {
        return ResponseEntity.ok(ApiResponse.of(service.listar(logado.get())));
    }

    @GetMapping("/nao-lidas")
    public ResponseEntity<ApiResponse<Map<String, Long>>> naoLidas() {
        return ResponseEntity.ok(ApiResponse.of(Map.of("total", service.naoLidas(logado.get()))));
    }

    @PutMapping("/{id}/lida")
    public ResponseEntity<ApiResponse<Notificacao>> lida(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(service.marcarLida(logado.get(), id)));
    }

    @PutMapping("/lidas")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> todasLidas() {
        return ResponseEntity.ok(ApiResponse.of(Map.of("atualizadas", service.marcarTodasLidas(logado.get()))));
    }
}
