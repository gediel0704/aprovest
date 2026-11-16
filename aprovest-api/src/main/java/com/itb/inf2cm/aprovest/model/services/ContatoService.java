package com.itb.inf2cm.aprovest.model.services;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.exceptions.NotFound;
import com.itb.inf2cm.aprovest.model.entity.MensagemContato;
import com.itb.inf2cm.aprovest.model.repository.MensagemContatoRepository;

/** Fale Conosco: o visitante envia (UC048) e o administrador consulta, altera a situação e exclui (UC049). */
@Service
public class ContatoService {

    private final MensagemContatoRepository repository;
    private final NotificacaoService notificacaoService;

    public ContatoService(MensagemContatoRepository repository, NotificacaoService notificacaoService) {
        this.repository = repository;
        this.notificacaoService = notificacaoService;
    }

    @Transactional
    public MensagemContato registrar(Requests.Contato req) {
        MensagemContato m = new MensagemContato();
        m.setNome(req.nome().trim());
        m.setEmail(req.email().trim().toLowerCase());
        m.setAssunto(req.assunto());
        m.setMensagem(req.mensagem().trim());
        repository.save(m);
        notificacaoService.notificarAdmins("Nova mensagem no Fale Conosco",
                m.getNome() + " enviou uma mensagem (" + m.getAssunto().toLowerCase() + ").", "/admin/contatos");
        return m;
    }

    public Page<MensagemContato> listar(String status, String busca, int pagina) {
        String filtro = (busca == null || busca.isBlank()) ? null : "%" + busca.trim().toLowerCase() + "%";
        String st = (status == null || status.isBlank()) ? null : status;
        return repository.buscar(st, filtro, PageRequest.of(Math.max(pagina, 0), 20));
    }

    public MensagemContato buscar(Long id) {
        return repository.findById(id).orElseThrow(() -> new NotFound("Mensagem não encontrada."));
    }

    @Transactional
    public MensagemContato atualizar(Long id, Requests.AtualizarContato req) {
        MensagemContato m = buscar(id);
        m.setStatus(req.status());
        m.setObservacao(req.observacao() == null || req.observacao().isBlank() ? null : req.observacao().trim());
        m.setAtualizadoEm(LocalDateTime.now());
        return repository.save(m);
    }

    @Transactional
    public void excluir(Long id) {
        repository.delete(buscar(id));
    }

    public Map<String, Long> resumo() {
        return Map.of("novas", repository.countByStatus("NOVA"), "emAtendimento", repository.countByStatus("EM_ATENDIMENTO"),
                "respondidas", repository.countByStatus("RESPONDIDA"));
    }
}
