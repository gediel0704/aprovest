package com.itb.inf2cm.aprovest.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itb.inf2cm.aprovest.config.UsuarioLogado;
import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.dto.UsuarioDTO;
import com.itb.inf2cm.aprovest.model.entity.SolicitacaoLgpd;
import com.itb.inf2cm.aprovest.model.services.UsuarioService;

import jakarta.validation.Valid;

/** Perfil, metas, preferências e LGPD do usuário autenticado (RF14, UC005, UC006, UC008, UC009, UC038). */
@RestController
@RequestMapping("/api/v1/usuarios/me")
public class UsuarioController {

    private final UsuarioService service;
    private final UsuarioLogado logado;

    public UsuarioController(UsuarioService service, UsuarioLogado logado) {
        this.service = service;
        this.logado = logado;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UsuarioDTO>> me() {
        return ResponseEntity.ok(ApiResponse.of(service.dto(logado.get())));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UsuarioDTO>> atualizarPerfil(@Valid @RequestBody Requests.Perfil req) {
        return ResponseEntity.ok(ApiResponse.of(service.atualizarPerfil(logado.get(), req), "Perfil atualizado."));
    }

    @PutMapping("/preferencias")
    public ResponseEntity<ApiResponse<UsuarioDTO>> preferencias(@RequestBody Requests.Preferencias req) {
        return ResponseEntity.ok(ApiResponse.of(service.atualizarPreferencias(logado.get(), req), "Preferências salvas."));
    }

    @PutMapping("/senha")
    public ResponseEntity<ApiResponse<Void>> senha(@Valid @RequestBody Requests.AlterarSenha req) {
        service.alterarSenha(logado.get(), req);
        return ResponseEntity.ok(ApiResponse.of(null, "Senha alterada com sucesso."));
    }

    @PutMapping("/email")
    public ResponseEntity<ApiResponse<UsuarioDTO>> email(@Valid @RequestBody Requests.AlterarEmail req) {
        return ResponseEntity.ok(ApiResponse.of(service.alterarEmail(logado.get(), req), "E-mail alterado. Faça login novamente com o novo e-mail."));
    }

    @GetMapping("/exportar")
    public ResponseEntity<Map<String, Object>> exportar() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"meus-dados-aprovest.json\"")
                .body(service.exportarDados(logado.get()));
    }

    @PostMapping("/exclusao")
    public ResponseEntity<ApiResponse<SolicitacaoLgpd>> exclusao() {
        return ResponseEntity.ok(ApiResponse.of(service.solicitarExclusao(logado.get()),
                "Solicitação registrada. A equipe processará a exclusão conforme a LGPD."));
    }

    @GetMapping("/solicitacoes")
    public ResponseEntity<ApiResponse<List<SolicitacaoLgpd>>> solicitacoes() {
        return ResponseEntity.ok(ApiResponse.of(service.minhasSolicitacoes(logado.get())));
    }
}
