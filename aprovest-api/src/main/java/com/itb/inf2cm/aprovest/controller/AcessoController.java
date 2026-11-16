package com.itb.inf2cm.aprovest.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itb.inf2cm.aprovest.config.UsuarioLogado;
import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.model.entity.Assinatura;
import com.itb.inf2cm.aprovest.model.services.AcessoService;

import jakarta.validation.Valid;

/** RF10, RF11 e UC039 - Plano, créditos e checkout de demonstração. */
@RestController
@RequestMapping("/api/v1/acessos")
public class AcessoController {

    private final AcessoService service;
    private final UsuarioLogado logado;

    public AcessoController(AcessoService service, UsuarioLogado logado) {
        this.service = service;
        this.logado = logado;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> resumo() {
        return ResponseEntity.ok(ApiResponse.of(service.resumo(logado.get())));
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkout(@Valid @RequestBody Requests.Checkout req) {
        return ResponseEntity.ok(ApiResponse.of(service.checkout(logado.get(), req), "Pagamento aprovado (ambiente de demonstração)."));
    }

    @PostMapping("/assinatura/cancelar-renovacao")
    public ResponseEntity<ApiResponse<Assinatura>> cancelar() {
        return ResponseEntity.ok(ApiResponse.of(service.cancelarRenovacao(logado.get()),
                "Renovação automática cancelada. O acesso Pro continua até o fim do período."));
    }
}
