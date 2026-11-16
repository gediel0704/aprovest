package com.itb.inf2cm.aprovest.controller;

import java.util.List;
import java.util.Map;

import com.itb.inf2cm.aprovest.dto.Pagina;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itb.inf2cm.aprovest.config.UsuarioLogado;
import com.itb.inf2cm.aprovest.dto.ApiResponse;
import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.dto.UsuarioDTO;
import com.itb.inf2cm.aprovest.model.entity.*;
import com.itb.inf2cm.aprovest.model.services.AdminService;
import com.itb.inf2cm.aprovest.model.services.ConteudoService;
import com.itb.inf2cm.aprovest.model.services.NotificacaoService;
import com.itb.inf2cm.aprovest.model.services.UsuarioService;

import jakarta.validation.Valid;

/** Módulo administrativo (RN03): RF08, RF09, RF18, UC030-UC036, UC041 e UC042. */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;
    private final ConteudoService conteudoService;
    private final UsuarioService usuarioService;
    private final NotificacaoService notificacaoService;
    private final UsuarioLogado logado;

    public AdminController(AdminService adminService, ConteudoService conteudoService, UsuarioService usuarioService,
                           NotificacaoService notificacaoService, UsuarioLogado logado) {
        this.adminService = adminService;
        this.conteudoService = conteudoService;
        this.usuarioService = usuarioService;
        this.notificacaoService = notificacaoService;
        this.logado = logado;
    }

    // ---------------- Relatórios ----------------
    @GetMapping("/resumo")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resumo() {
        return ResponseEntity.ok(ApiResponse.of(adminService.resumo()));
    }

    // ---------------- Questões ----------------
    @GetMapping("/questoes")
    public ResponseEntity<ApiResponse<Pagina<Map<String, Object>>>> questoes(@RequestParam(required = false) Long vestibularId,
                                                                           @RequestParam(required = false) Long disciplinaId,
                                                                           @RequestParam(required = false) Boolean ativa,
                                                                           @RequestParam(required = false) Integer ano,
                                                                           @RequestParam(required = false) String busca,
                                                                           @RequestParam(defaultValue = "0") int pagina) {
        return ResponseEntity.ok(ApiResponse.of(Pagina.de(conteudoService.buscarQuestoes(vestibularId, disciplinaId, ativa, ano, busca, pagina))));
    }

    @GetMapping("/questoes/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> questao(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.questao(id)));
    }

    @PostMapping("/questoes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> criarQuestao(@Valid @RequestBody Requests.Questao req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(conteudoService.criarQuestao(req), "Questão cadastrada."));
    }

    @PutMapping("/questoes/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> atualizarQuestao(@PathVariable Long id, @Valid @RequestBody Requests.Questao req) {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.atualizarQuestao(id, req), "Questão atualizada."));
    }

    @PutMapping("/questoes/{id}/publicacao")
    public ResponseEntity<ApiResponse<Map<String, Object>>> publicacaoQuestao(@PathVariable Long id, @RequestParam boolean ativa) {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.alterarPublicacao(id, ativa), ativa ? "Questão publicada." : "Questão arquivada."));
    }

    @PostMapping("/questoes/importar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importar(@Valid @RequestBody Requests.ImportarQuestoes req) {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.importar(req), "Lote importado."));
    }

    @GetMapping("/pareceres")
    public ResponseEntity<ApiResponse<List<ParecerConteudo>>> pareceres() {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.pareceres()));
    }

    // ---------------- Materiais ----------------
    @GetMapping("/materiais")
    public ResponseEntity<ApiResponse<List<Material>>> materiais() {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.materiaisAdmin()));
    }

    @PostMapping("/materiais")
    public ResponseEntity<ApiResponse<Material>> criarMaterial(@Valid @RequestBody Requests.Material req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(conteudoService.salvarMaterial(null, req), "Material cadastrado."));
    }

    @PutMapping("/materiais/{id}")
    public ResponseEntity<ApiResponse<Material>> atualizarMaterial(@PathVariable Long id, @Valid @RequestBody Requests.Material req) {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.salvarMaterial(id, req), "Material atualizado."));
    }

    @PutMapping("/materiais/{id}/publicacao")
    public ResponseEntity<ApiResponse<Material>> publicacaoMaterial(@PathVariable Long id, @RequestParam boolean ativo) {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.alterarPublicacaoMaterial(id, ativo)));
    }

    // ---------------- Temas de redação ----------------
    @GetMapping("/temas")
    public ResponseEntity<ApiResponse<List<TemaRedacao>>> temas() {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.temas(true)));
    }

    @PostMapping("/temas")
    public ResponseEntity<ApiResponse<TemaRedacao>> criarTema(@Valid @RequestBody Requests.Tema req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(conteudoService.salvarTema(null, req), "Tema cadastrado."));
    }

    @PutMapping("/temas/{id}")
    public ResponseEntity<ApiResponse<TemaRedacao>> atualizarTema(@PathVariable Long id, @Valid @RequestBody Requests.Tema req) {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.salvarTema(id, req), "Tema atualizado."));
    }

    @PutMapping("/temas/{id}/publicacao")
    public ResponseEntity<ApiResponse<TemaRedacao>> publicacaoTema(@PathVariable Long id, @RequestParam boolean ativo) {
        return ResponseEntity.ok(ApiResponse.of(conteudoService.alterarPublicacaoTema(id, ativo)));
    }

    // ---------------- Usuários e papéis ----------------
    @GetMapping("/usuarios")
    public ResponseEntity<ApiResponse<Pagina<UsuarioDTO>>> usuarios(@RequestParam(required = false) String tipo,
                                                                  @RequestParam(required = false) String busca,
                                                                  @RequestParam(defaultValue = "0") int pagina) {
        return ResponseEntity.ok(ApiResponse.of(Pagina.de(usuarioService.listar(tipo, busca, pagina))));
    }

    @PostMapping("/usuarios")
    public ResponseEntity<ApiResponse<UsuarioDTO>> criarUsuario(@Valid @RequestBody Requests.NovoUsuario req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(usuarioService.criarPorAdmin(req), "Usuário criado."));
    }

    @PutMapping("/usuarios/{id}/papel")
    public ResponseEntity<ApiResponse<UsuarioDTO>> papel(@PathVariable Long id, @Valid @RequestBody Requests.Papel req) {
        return ResponseEntity.ok(ApiResponse.of(usuarioService.alterarPapel(logado.get(), id, req.tipo()), "Papel atualizado."));
    }

    @PutMapping("/usuarios/{id}/status")
    public ResponseEntity<ApiResponse<UsuarioDTO>> status(@PathVariable Long id, @RequestParam boolean ativo) {
        return ResponseEntity.ok(ApiResponse.of(usuarioService.alterarStatus(logado.get(), id, ativo)));
    }

    // ---------------- Correção humana ----------------
    @GetMapping("/correcoes")
    public ResponseEntity<ApiResponse<List<AvaliacaoRedacao>>> correcoes(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.of(adminService.correcoes(status)));
    }

    @GetMapping("/corretores")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> corretores() {
        return ResponseEntity.ok(ApiResponse.of(adminService.corretores()));
    }

    @PutMapping("/correcoes/{id}/atribuir")
    public ResponseEntity<ApiResponse<AvaliacaoRedacao>> atribuir(@PathVariable Long id, @Valid @RequestBody Requests.Atribuir req) {
        return ResponseEntity.ok(ApiResponse.of(adminService.atribuir(id, req.corretorId()), "Correção atribuída."));
    }

    // ---------------- Bolsas ----------------
    @GetMapping("/bolsas")
    public ResponseEntity<ApiResponse<List<BolsaMerito>>> bolsas() {
        return ResponseEntity.ok(ApiResponse.of(adminService.bolsas()));
    }

    @PostMapping("/bolsas")
    public ResponseEntity<ApiResponse<Map<String, Object>>> concederBolsas(@Valid @RequestBody Requests.ConcederBolsa req) {
        return ResponseEntity.ok(ApiResponse.of(adminService.concederBolsas(req.mes())));
    }

    // ---------------- Serviço de IA ----------------
    @GetMapping("/ia")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ia() {
        return ResponseEntity.ok(ApiResponse.of(adminService.estadoIa()));
    }

    @PostMapping("/ia/pausar")
    public ResponseEntity<ApiResponse<EstadoIA>> pausar(@RequestBody(required = false) Requests.PausarIa req) {
        return ResponseEntity.ok(ApiResponse.of(adminService.pausarIa(logado.get(), req == null ? null : req.motivo()), "Correção por IA pausada."));
    }

    @PostMapping("/ia/retomar")
    public ResponseEntity<ApiResponse<EstadoIA>> retomar() {
        return ResponseEntity.ok(ApiResponse.of(adminService.retomarIa(logado.get()), "Correção por IA retomada."));
    }

    @PostMapping("/ia/sugestoes")
    public ResponseEntity<ApiResponse<AdminService.Sugestoes>> sugestoes() {
        return ResponseEntity.ok(ApiResponse.of(adminService.sugestoes()));
    }

    @PostMapping("/ia/sugestoes/aprovar")
    public ResponseEntity<ApiResponse<TemaRedacao>> aprovar(@RequestBody AdminService.SugestaoTema req) {
        return ResponseEntity.ok(ApiResponse.of(adminService.aprovarSugestao(req), "Tema adicionado ao banco de temas."));
    }

    // ---------------- LGPD e comunicados ----------------
    @GetMapping("/lgpd")
    public ResponseEntity<ApiResponse<List<SolicitacaoLgpd>>> lgpd() {
        return ResponseEntity.ok(ApiResponse.of(usuarioService.solicitacoes()));
    }

    @PostMapping("/lgpd/{id}/processar")
    public ResponseEntity<ApiResponse<SolicitacaoLgpd>> processar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(usuarioService.processarExclusao(id), "Conta anonimizada."));
    }

    @PostMapping("/comunicados")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> comunicado(@Valid @RequestBody Requests.Comunicado req) {
        return ResponseEntity.ok(ApiResponse.of(Map.of("destinatarios", notificacaoService.comunicado(req.titulo(), req.mensagem(), req.link())),
                "Comunicado enviado."));
    }
}
