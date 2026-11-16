package com.itb.inf2cm.aprovest.auth;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.dto.Requests;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationService service;

    public AuthController(AuthenticationService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> register(@Valid @RequestBody Requests.Register request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(service.register(request), "Conta criada com sucesso."));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> authenticate(@Valid @RequestBody Requests.Authentication request) {
        return ResponseEntity.ok(ApiResponse.of(service.authenticate(request)));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthenticationResponse>> google(@Valid @RequestBody Requests.Google request) {
        return ResponseEntity.ok(ApiResponse.of(service.google(request)));
    }

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> config() {
        return ResponseEntity.ok(ApiResponse.of(service.config()));
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<ApiResponse<Map<String, Object>>> esqueciSenha(@Valid @RequestBody Requests.EsqueciSenha request) {
        return ResponseEntity.ok(ApiResponse.of(service.esqueciSenha(request)));
    }

    @PostMapping("/redefinir-senha")
    public ResponseEntity<ApiResponse<Void>> redefinirSenha(@Valid @RequestBody Requests.RedefinirSenha request) {
        service.redefinirSenha(request);
        return ResponseEntity.ok(ApiResponse.of(null, "Senha alterada com sucesso. Faça login com a nova senha."));
    }
}
