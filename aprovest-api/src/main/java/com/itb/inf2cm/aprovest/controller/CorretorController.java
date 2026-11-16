package com.itb.inf2cm.aprovest.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itb.inf2cm.aprovest.config.UsuarioLogado;
import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.model.entity.AvaliacaoRedacao;
import com.itb.inf2cm.aprovest.model.entity.ParecerConteudo;
import com.itb.inf2cm.aprovest.model.services.CorretorService;

import jakarta.validation.Valid;

/** Área do professor/corretor: UC027, UC028, UC029 e UC040. */
@RestController
@RequestMapping("/api/v1/corretor")
public class CorretorController {

    private final CorretorService service;
    private final UsuarioLogado logado;

    public CorretorController(CorretorService service, UsuarioLogado logado) {
        this.service = service;
        this.logado = logado;
    }

    @GetMapping("/fila")
    public ResponseEntity<ApiResponse<List<AvaliacaoRedacao>>> fila() {
        return ResponseEntity.ok(ApiResponse.of(service.fila(logado.get())));
    }

    @GetMapping("/concluidas")
    public ResponseEntity<ApiResponse<List<AvaliacaoRedacao>>> concluidas() {
        return ResponseEntity.ok(ApiResponse.of(service.concluidas(logado.get())));
    }

    @GetMapping("/fila/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> detalhe(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(service.detalhe(logado.get(), id)));
    }

    @PostMapping("/fila/{id}/devolutiva")
    public ResponseEntity<ApiResponse<AvaliacaoRedacao>> devolutiva(@PathVariable Long id, @Valid @RequestBody Requests.Devolutiva req) {
        return ResponseEntity.ok(ApiResponse.of(service.enviarDevolutiva(logado.get(), id, req), "Devolutiva enviada ao aluno."));
    }

    @GetMapping("/conteudos")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> conteudos(@RequestParam(required = false) Long vestibularId,
                                                                           @RequestParam(required = false) String busca,
                                                                           @RequestParam(defaultValue = "0") int pagina) {
        return ResponseEntity.ok(ApiResponse.of(service.itensParaAvaliar(vestibularId, busca, pagina)));
    }

    @PostMapping("/conteudos/{questaoId}/parecer")
    public ResponseEntity<ApiResponse<ParecerConteudo>> parecer(@PathVariable Long questaoId, @Valid @RequestBody Requests.Parecer req) {
        return ResponseEntity.ok(ApiResponse.of(service.registrarParecer(logado.get(), questaoId, req), "Parecer registrado."));
    }

    @GetMapping("/pareceres")
    public ResponseEntity<ApiResponse<List<ParecerConteudo>>> pareceres() {
        return ResponseEntity.ok(ApiResponse.of(service.meusPareceres(logado.get())));
    }

    @GetMapping("/ganhos")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ganhos() {
        return ResponseEntity.ok(ApiResponse.of(service.ganhos(logado.get())));
    }
}
