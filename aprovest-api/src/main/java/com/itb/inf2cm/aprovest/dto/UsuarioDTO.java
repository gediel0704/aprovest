package com.itb.inf2cm.aprovest.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import com.itb.inf2cm.aprovest.model.entity.Corretor;
import com.itb.inf2cm.aprovest.model.entity.Usuario;

/** Dados públicos do usuário (nunca expõe senha, tokens ou Google ID). */
public record UsuarioDTO(Long id, String nome, String email, String tipo, LocalDate dataNascimento,
                         String cursoAlvo, String universidadeAlvo, List<String> vestibularesAlvo,
                         String tema, String tamanhoFonte, boolean notifBanca, boolean notifRedacao,
                         boolean notifSimulado, boolean notifNovidades, boolean rankingPublico,
                         boolean onboardingConcluido, boolean pro, String formacao, boolean ativo,
                         boolean contaGoogle, LocalDateTime criadoEm) {

    public static UsuarioDTO de(Usuario u, boolean pro) {
        List<String> vest = u.getVestibularesAlvo() == null || u.getVestibularesAlvo().isBlank()
                ? List.of() : Arrays.stream(u.getVestibularesAlvo().split(",")).map(String::trim).toList();
        return new UsuarioDTO(u.getId(), u.getNome(), u.getEmail(), u.getTipo().name(), u.getDataNascimento(),
                u.getCursoAlvo(), u.getUniversidadeAlvo(), vest, u.getTema(), u.getTamanhoFonte(),
                u.isNotifBanca(), u.isNotifRedacao(), u.isNotifSimulado(), u.isNotifNovidades(), u.isRankingPublico(),
                u.isOnboardingConcluido(), pro, u instanceof Corretor c ? c.getFormacao() : null, u.isCodStatus(),
                u.getGoogleId() != null, u.getCriadoEm());
    }
}
