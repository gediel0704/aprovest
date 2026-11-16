package com.itb.inf2cm.aprovest.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.dto.Pagina;
import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.model.entity.MensagemContato;
import com.itb.inf2cm.aprovest.model.services.ContatoService;

import jakarta.validation.Valid;

/** Fale Conosco: envio público (UC048) e CRUD administrativo das mensagens (UC049). */
@RestController
@RequestMapping("/api/v1")
public class ContatoController {

    private final ContatoService service;

    public ContatoController(ContatoService service) {
        this.service = service;
    }

    @PostMapping("/publico/contato")
    public ResponseEntity<ApiResponse<Map<String, Object>>> enviar(@Valid @RequestBody Requests.Contato req) {
        MensagemContato m = service.registrar(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(
                Map.of("id", m.getId(), "protocolo", String.format("AV-%06d", m.getId())),
                "Mensagem enviada! Responderemos pelo e-mail informado."));
    }

    @GetMapping("/admin/contatos")
    public ResponseEntity<ApiResponse<Pagina<MensagemContato>>> listar(@RequestParam(required = false) String status,
                                                                      @RequestParam(required = false) String busca,
                                                                      @RequestParam(defaultValue = "0") int pagina) {
        return ResponseEntity.ok(ApiResponse.of(Pagina.de(service.listar(status, busca, pagina))));
    }

    @GetMapping("/admin/contatos/resumo")
    public ResponseEntity<ApiResponse<Map<String, Long>>> resumo() {
        return ResponseEntity.ok(ApiResponse.of(service.resumo()));
    }

    @GetMapping("/admin/contatos/{id}")
    public ResponseEntity<ApiResponse<MensagemContato>> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(service.buscar(id)));
    }

    @PutMapping("/admin/contatos/{id}")
    public ResponseEntity<ApiResponse<MensagemContato>> atualizar(@PathVariable Long id, @Valid @RequestBody Requests.AtualizarContato req) {
        return ResponseEntity.ok(ApiResponse.of(service.atualizar(id, req), "Mensagem atualizada."));
    }

    @DeleteMapping("/admin/contatos/{id}")
    public ResponseEntity<ApiResponse<Void>> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.ok(ApiResponse.of(null, "Mensagem excluída."));
    }
}
