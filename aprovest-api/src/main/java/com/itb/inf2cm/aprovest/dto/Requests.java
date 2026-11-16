package com.itb.inf2cm.aprovest.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Objetos de entrada (corpo das requisições) validados com Bean Validation. */
public final class Requests {

    private Requests() {}

    // ------------------------------- Autenticação -------------------------------
    public record Register(
            @NotBlank(message = "Informe o nome.") @Size(min = 3, max = 100, message = "O nome deve ter entre 3 e 100 caracteres.") String nome,
            @NotBlank(message = "Informe o e-mail.") @Email(message = "E-mail inválido.") String email,
            @NotBlank(message = "Informe a senha.") String password,
            Boolean aceiteTermos) {}

    public record Authentication(
            @NotBlank(message = "Informe o e-mail.") String email,
            @NotBlank(message = "Informe a senha.") String password) {}

    public record Google(@NotBlank String credential) {}

    public record EsqueciSenha(@NotBlank(message = "Informe o e-mail.") @Email(message = "E-mail inválido.") String email) {}

    public record RedefinirSenha(@NotBlank String token, @NotBlank(message = "Informe a nova senha.") String novaSenha) {}

    // ------------------------------- Perfil -------------------------------
    public record Perfil(
            @NotBlank(message = "Informe o nome.") @Size(min = 3, max = 100) String nome,
            LocalDate dataNascimento,
            @Size(max = 120) String cursoAlvo,
            @Size(max = 120) String universidadeAlvo,
            @NotEmpty(message = "Escolha de 1 a 3 vestibulares.") List<String> vestibularesAlvo) {}

    public record Preferencias(String tema, String tamanhoFonte, Boolean notifBanca, Boolean notifRedacao,
                               Boolean notifSimulado, Boolean notifNovidades, Boolean rankingPublico) {}

    public record AlterarSenha(@NotBlank(message = "Informe a senha atual.") String senhaAtual,
                               @NotBlank(message = "Informe a nova senha.") String novaSenha) {}

    public record AlterarEmail(@NotBlank @Email(message = "E-mail inválido.") String novoEmail,
                               @NotBlank(message = "Confirme com sua senha atual.") String senhaAtual) {}

    // ------------------------------- Estudo -------------------------------
    public record IniciarSessao(@NotBlank(message = "Escolha o vestibular.") String vestibular,
                                String tipoSimulado, Boolean usarCredito) {}

    public record Responder(@NotNull Long questaoId,
                            @NotBlank @Pattern(regexp = "[A-Ea-e]", message = "Alternativa inválida.") String alternativa,
                            Integer tempoSegundos) {}

    public record ConferirEnem(@NotNull Integer ano, @NotNull Integer indice, String idioma,
                               @NotBlank @Pattern(regexp = "[A-Ea-e]") String alternativa) {}

    // ------------------------------- Redação -------------------------------
    public record Redacao(
            @NotBlank(message = "Informe o título.") @Size(min = 3, max = 120, message = "O título deve ter de 3 a 120 caracteres.") String titulo,
            @NotBlank(message = "Informe o tema.") @Size(min = 3, max = 180, message = "O tema deve ter de 3 a 180 caracteres.") String tema,
            @NotBlank(message = "Escreva o texto.") @Size(min = 20, max = 12000, message = "O texto deve ter de 20 a 12.000 caracteres.") String texto,
            String status, Long vestibularId, Long temaRedacaoId) {}

    public record NotaDevolutiva(@NotBlank String codigo, @NotNull Double nota, String comentario) {}

    public record Devolutiva(@NotBlank @Size(min = 20, message = "A devolutiva deve ter pelo menos 20 caracteres.") String feedbackGeral,
                             @NotEmpty @Valid List<NotaDevolutiva> notas) {}

    public record Parecer(@NotBlank @Pattern(regexp = "APROVADO|AJUSTAR|REPROVADO") String veredito,
                          @NotBlank @Size(min = 20, message = "O comentário deve ter pelo menos 20 caracteres.") String comentario) {}

    // ------------------------------- Acesso / pagamento -------------------------------
    public record Checkout(@NotBlank @Pattern(regexp = "PRO_MENSAL|CREDITO_1|CREDITO_5") String produto,
                           @NotBlank @Pattern(regexp = "PIX|CARTAO|BOLETO") String metodo) {}

    // ------------------------------- Administração -------------------------------
    public record AlternativaReq(@NotBlank String letra, @NotBlank String texto) {}

    public record Questao(
            @NotBlank(message = "Informe o enunciado.") String enunciado,
            String introducaoAlternativas,
            @NotBlank @Pattern(regexp = "[A-E]", message = "Gabarito deve ser A, B, C, D ou E.") String gabarito,
            String explicacao, String nivel, Integer ano, Integer numero, String origem,
            @NotBlank(message = "Informe a fonte/referência.") String fonteDescricao, String fonteUrl,
            @NotNull(message = "Escolha o vestibular.") Long vestibularId,
            @NotNull(message = "Escolha a disciplina.") Long disciplinaId,
            @NotEmpty(message = "Escolha ao menos um tópico (RN04).") List<Long> topicoIds,
            @NotEmpty @Size(min = 4, max = 5, message = "Informe 4 ou 5 alternativas.") @Valid List<AlternativaReq> alternativas) {}

    public record ImportarQuestoes(@NotEmpty @Size(max = 100, message = "Lote limitado a 100 questões.") @Valid List<Questao> questoes) {}

    public record Material(@NotBlank String titulo, @NotBlank String resumo, String conteudo, @NotBlank String tipo,
                           Boolean oficial, @NotBlank String fonteOrgao, String fonteUrl, Integer ano,
                           Long vestibularId, Long disciplinaId) {}

    public record Tema(@NotBlank String titulo, @NotBlank String proposta, String textosApoio, String expectativaBanca,
                       String genero, Integer ano, String origem, String fonteDescricao, String fonteUrl,
                       @NotNull Long vestibularId) {}

    public record Papel(@NotBlank @Pattern(regexp = "ALUNO|CORRETOR|ADMIN") String tipo) {}

    public record NovoUsuario(@NotBlank String nome, @NotBlank @Email String email, @NotBlank String password,
                              @NotBlank @Pattern(regexp = "ALUNO|CORRETOR|ADMIN") String tipo, String formacao) {}

    public record Atribuir(@NotNull Long corretorId) {}

    public record ConcederBolsa(@NotBlank @Pattern(regexp = "\\d{4}-\\d{2}", message = "Use o formato AAAA-MM.") String mes) {}

    public record PausarIa(String motivo) {}

    public record Comunicado(@NotBlank String titulo, @NotBlank @Size(max = 600) String mensagem, String link) {}

    // ------------------------------- Fale Conosco -------------------------------
    public record Contato(
            @NotBlank(message = "Informe seu nome.") @Size(min = 3, max = 120, message = "O nome deve ter de 3 a 120 caracteres.") String nome,
            @NotBlank(message = "Informe seu e-mail.") @Email(message = "E-mail inválido.") @Size(max = 160) String email,
            @NotBlank(message = "Escolha o assunto.") @Pattern(regexp = "DUVIDA|SUGESTAO|SUPORTE|PARCERIA|PRIVACIDADE", message = "Assunto inválido.") String assunto,
            @NotBlank(message = "Escreva sua mensagem.") @Size(min = 10, max = 2000, message = "A mensagem deve ter de 10 a 2.000 caracteres.") String mensagem,
            @AssertTrue(message = "É preciso autorizar o uso dos dados para responder ao contato.") boolean aceite) {}

    public record AtualizarContato(
            @NotBlank @Pattern(regexp = "NOVA|EM_ATENDIMENTO|RESPONDIDA", message = "Situação inválida.") String status,
            @Size(max = 500, message = "A observação deve ter até 500 caracteres.") String observacao) {}
}
