package com.itb.inf2cm.aprovest.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itb.inf2cm.aprovest.config.UsuarioLogado;
import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.model.entity.AvaliacaoRedacao;
import com.itb.inf2cm.aprovest.model.entity.Redacao;
import com.itb.inf2cm.aprovest.model.services.RedacaoService;
import com.itb.inf2cm.aprovest.model.services.redacao.CorrecaoIaService;
import com.itb.inf2cm.aprovest.model.services.redacao.GradeCorrecao;

import jakarta.validation.Valid;

/** Caderno de redações e correções (RF04, RF05, UC020-UC026). */
@RestController
@RequestMapping("/api/v1/redacoes")
public class RedacaoController {

    private final RedacaoService service;
    private final CorrecaoIaService correcaoIaService;
    private final UsuarioLogado logado;

    public RedacaoController(RedacaoService service, CorrecaoIaService correcaoIaService, UsuarioLogado logado) {
        this.service = service;
        this.correcaoIaService = correcaoIaService;
        this.logado = logado;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Redacao>>> listar() {
        return ResponseEntity.ok(ApiResponse.of(service.listar(logado.get())));
    }

    @GetMapping("/grades")
    public ResponseEntity<ApiResponse<List<GradeCorrecao.Grade>>> grades() {
        return ResponseEntity.ok(ApiResponse.of(List.of(GradeCorrecao.ENEM, GradeCorrecao.FUVEST, GradeCorrecao.UNICAMP)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> obter(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(service.detalhe(logado.get(), id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Redacao>> criar(@Valid @RequestBody Requests.Redacao req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(service.criar(logado.get(), req), "Redação salva."));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Redacao>> atualizar(@PathVariable Long id, @Valid @RequestBody Requests.Redacao req) {
        return ResponseEntity.ok(ApiResponse.of(service.atualizar(logado.get(), id, req), "Redação atualizada."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> excluir(@PathVariable Long id) {
        service.excluir(logado.get(), id);
        return ResponseEntity.ok(ApiResponse.of(null, "Redação excluída."));
    }

    /** UC024 - a correção roda em segundo plano; o front consulta /avaliacoes/{id} até concluir. */
    @PostMapping("/{id}/correcao-ia")
    public ResponseEntity<ApiResponse<AvaliacaoRedacao>> correcaoIa(@PathVariable Long id) {
        AvaliacaoRedacao a = service.solicitarCorrecaoIa(logado.get(), id);
        correcaoIaService.processar(a.getId());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.of(a, "Correção iniciada."));
    }

    @PostMapping("/{id}/correcao-humana")
    public ResponseEntity<ApiResponse<AvaliacaoRedacao>> correcaoHumana(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(service.solicitarCorrecaoHumana(logado.get(), id),
                "Solicitação registrada. Prazo de 72 horas."));
    }

    @GetMapping("/avaliacoes")
    public ResponseEntity<ApiResponse<List<AvaliacaoRedacao>>> avaliacoes() {
        return ResponseEntity.ok(ApiResponse.of(service.avaliacoes(logado.get())));
    }

    @GetMapping("/avaliacoes/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> avaliacao(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(service.avaliacao(logado.get(), id)));
    }
}
