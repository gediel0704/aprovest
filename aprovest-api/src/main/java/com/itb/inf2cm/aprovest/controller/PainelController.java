package com.itb.inf2cm.aprovest.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itb.inf2cm.aprovest.config.UsuarioLogado;
import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.model.services.PainelService;

/** RF07 Painel da Meta, UC018 Plano de estudo, RF15 Histórico, RF12 Ranking e RF19 Relatório. */
@RestController
@RequestMapping("/api/v1/painel")
public class PainelController {

    private final PainelService service;
    private final UsuarioLogado logado;

    public PainelController(PainelService service, UsuarioLogado logado) {
        this.service = service;
        this.logado = logado;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> painel(@RequestParam(required = false) String vestibular) {
        return ResponseEntity.ok(ApiResponse.of(service.painel(logado.get(), vestibular)));
    }

    @GetMapping("/plano")
    public ResponseEntity<ApiResponse<Map<String, Object>>> plano(@RequestParam(required = false) String vestibular) {
        return ResponseEntity.ok(ApiResponse.of(service.planoEstudo(logado.get(), vestibular)));
    }

    @GetMapping("/historico")
    public ResponseEntity<ApiResponse<Map<String, Object>>> historico(@RequestParam(defaultValue = "0") int pagina) {
        return ResponseEntity.ok(ApiResponse.of(service.historico(logado.get(), pagina)));
    }

    @GetMapping("/ranking")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ranking(@RequestParam(required = false) String mes) {
        return ResponseEntity.ok(ApiResponse.of(service.ranking(logado.get(), mes)));
    }

    @GetMapping("/relatorio")
    public ResponseEntity<ApiResponse<Map<String, Object>>> relatorio(@RequestParam(required = false) String vestibular) {
        return ResponseEntity.ok(ApiResponse.of(service.relatorio(logado.get(), vestibular)));
    }
}
