package com.itb.inf2cm.aprovest.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itb.inf2cm.aprovest.config.UsuarioLogado;
import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.model.entity.TemaRedacao;
import com.itb.inf2cm.aprovest.model.services.ConteudoService;

/** Biblioteca (UC014, UC015), fontes oficiais (UC016) e temas de redação. */
@RestController
@RequestMapping("/api/v1/conteudos")
public class ConteudoController {

    private final ConteudoService service;
    private final UsuarioLogado logado;

    public ConteudoController(ConteudoService service, UsuarioLogado logado) {
        this.service = service;
        this.logado = logado;
    }

    @GetMapping("/biblioteca")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> biblioteca(@RequestParam(required = false) String vestibular,
                                                                            @RequestParam(required = false) Long disciplinaId,
                                                                            @RequestParam(required = false) String busca) {
        return ResponseEntity.ok(ApiResponse.of(service.biblioteca(logado.get(), false, vestibular, disciplinaId, null, busca)));
    }

    @GetMapping("/fontes-oficiais")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> fontes(@RequestParam(required = false) String vestibular,
                                                                        @RequestParam(required = false) String tipo,
                                                                        @RequestParam(required = false) String busca) {
        return ResponseEntity.ok(ApiResponse.of(service.biblioteca(logado.get(), true, vestibular, null, tipo, busca)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> material(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(service.material(logado.get(), id)));
    }

    @PutMapping("/{id}/leitura")
    public ResponseEntity<ApiResponse<Map<String, Object>>> leitura(@PathVariable Long id, @RequestParam boolean concluido) {
        return ResponseEntity.ok(ApiResponse.of(service.marcarLeitura(logado.get(), id, concluido)));
    }

    @GetMapping("/temas")
    public ResponseEntity<ApiResponse<List<TemaRedacao>>> temas() {
        return ResponseEntity.ok(ApiResponse.of(service.temas(false)));
    }
}
