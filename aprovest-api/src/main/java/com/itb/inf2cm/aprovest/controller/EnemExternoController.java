package com.itb.inf2cm.aprovest.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.model.services.EnemExternoService;

import jakarta.validation.Valid;

/** UC017 - Questões ENEM externas (INEP via enem.dev), sem gravação no histórico interno. */
@RestController
@RequestMapping("/api/v1/enem-externo")
public class EnemExternoController {

    private final EnemExternoService service;

    public EnemExternoController(EnemExternoService service) {
        this.service = service;
    }

    @GetMapping("/edicoes")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> edicoes() {
        return ResponseEntity.ok(ApiResponse.of(service.edicoes()));
    }

    @GetMapping("/questoes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> questoes(@RequestParam int ano, @RequestParam(required = false) String area,
                                                                     @RequestParam(required = false) String idioma,
                                                                     @RequestParam(defaultValue = "0") int pagina) {
        return ResponseEntity.ok(ApiResponse.of(service.listar(ano, area, idioma, pagina)));
    }

    @PostMapping("/conferir")
    public ResponseEntity<ApiResponse<Map<String, Object>>> conferir(@Valid @RequestBody Requests.ConferirEnem req) {
        return ResponseEntity.ok(ApiResponse.of(service.conferir(req)));
    }
}
