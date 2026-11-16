package com.itb.inf2cm.aprovest.auth;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.dto.UsuarioDTO;
import com.itb.inf2cm.aprovest.exceptions.BadRequest;
import com.itb.inf2cm.aprovest.exceptions.Unauthorized;
import com.itb.inf2cm.aprovest.model.entity.Aluno;
import com.itb.inf2cm.aprovest.model.entity.TokenRecuperacao;
import com.itb.inf2cm.aprovest.model.entity.Usuario;
import com.itb.inf2cm.aprovest.model.repository.TokenRecuperacaoRepository;
import com.itb.inf2cm.aprovest.model.repository.UsuarioRepository;
import com.itb.inf2cm.aprovest.model.services.AcessoService;
import com.itb.inf2cm.aprovest.model.services.NotificacaoService;
import com.itb.inf2cm.aprovest.security.jwt.JwtService;
import com.itb.inf2cm.aprovest.security.token.Token;
import com.itb.inf2cm.aprovest.security.token.TokenRepository;
import com.itb.inf2cm.aprovest.security.token.TokenType;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * RF01 / UC002 / UC003 / UC004 / UC037 / RNF07.
 * Cadastro, login por e-mail e senha ou Google, bloqueio temporário após
 * tentativas falhas e recuperação de senha.
 */
@Service
public class AuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);
    private static final int MAX_TENTATIVAS = 5;
    private static final int MINUTOS_BLOQUEIO = 15;

    private final UsuarioRepository repository;
    private final TokenRepository tokenRepository;
    private final TokenRecuperacaoRepository tokenRecuperacaoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AcessoService acessoService;
    private final NotificacaoService notificacaoService;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${app.google.client-id:}") private String googleClientId;
    @Value("${app.modo-demonstracao:true}") private boolean modoDemonstracao;
    @Value("${app.front-url}") private String frontUrl;

    public AuthenticationService(UsuarioRepository repository, TokenRepository tokenRepository,
                                 TokenRecuperacaoRepository tokenRecuperacaoRepository, PasswordEncoder passwordEncoder,
                                 JwtService jwtService, AcessoService acessoService, NotificacaoService notificacaoService) {
        this.repository = repository;
        this.tokenRepository = tokenRepository;
        this.tokenRecuperacaoRepository = tokenRecuperacaoRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.acessoService = acessoService;
        this.notificacaoService = notificacaoService;
    }

    /** Política de senha: mínimo 8 caracteres, com letra e número. */
    public static void validarSenha(String senha) {
        if (senha == null || senha.length() < 8 || !senha.matches(".*[A-Za-z].*") || !senha.matches(".*\\d.*")) {
            throw new BadRequest("A senha deve ter pelo menos 8 caracteres, com letras e números.");
        }
    }

    /** UC002 - Cadastro público: sempre cria um ALUNO (administrador não é opção pública). */
    @Transactional
    public AuthenticationResponse register(Requests.Register request) {
        String email = request.email().trim().toLowerCase();
        if (repository.findByEmail(email).isPresent()) {
            throw new BadRequest("Já existe uma conta cadastrada com este e-mail.");
        }
        if (request.aceiteTermos() != null && !request.aceiteTermos()) {
            throw new BadRequest("É necessário aceitar os termos de uso e a política de privacidade (LGPD).");
        }
        validarSenha(request.password());
        Aluno aluno = new Aluno();
        aluno.setNome(request.nome().trim());
        aluno.setEmail(email);
        aluno.setPassword(passwordEncoder.encode(request.password()));
        Usuario salvo = repository.save(aluno);
        acessoService.assinatura(salvo);
        notificacaoService.notificar(salvo, "Bem-vindo(a) ao AproVest!",
                "Comece definindo sua meta e fazendo o diagnóstico inicial de 30 questões.", "SISTEMA", "/aluno/meta");
        return emitirTokens(salvo);
    }

    /** UC003 - Autenticar conta, com bloqueio temporário após 5 tentativas falhas (RNF07). */
    @Transactional(noRollbackFor = {BadRequest.class, Unauthorized.class})
    public AuthenticationResponse authenticate(Requests.Authentication request) {
        String email = request.email().trim().toLowerCase();
        Usuario user = repository.findByEmail(email).orElseThrow(() -> new BadRequest("E-mail ou senha incorretos."));
        if (!user.isAccountNonLocked()) {
            throw new Unauthorized("Conta bloqueada temporariamente por excesso de tentativas. Tente novamente às "
                    + user.getBloqueadoAte().format(DateTimeFormatter.ofPattern("HH:mm")) + ".");
        }
        if (!user.isCodStatus()) {
            throw new Unauthorized("Conta inativa. Procure o administrador da plataforma.");
        }
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            user.setTentativasFalhas(user.getTentativasFalhas() + 1);
            if (user.getTentativasFalhas() >= MAX_TENTATIVAS) {
                user.setBloqueadoAte(LocalDateTime.now().plusMinutes(MINUTOS_BLOQUEIO));
                user.setTentativasFalhas(0);
                repository.save(user);
                throw new Unauthorized("Muitas tentativas incorretas. Conta bloqueada por " + MINUTOS_BLOQUEIO + " minutos.");
            }
            repository.save(user);
            throw new BadRequest("E-mail ou senha incorretos. Tentativas restantes: " + (MAX_TENTATIVAS - user.getTentativasFalhas()) + ".");
        }
        user.setTentativasFalhas(0);
        user.setBloqueadoAte(null);
        repository.save(user);
        return emitirTokens(user);
    }

    /** RF01 / RNF07 - Login com conta Google (Google Identity Services: token de ID verificado no servidor). */
    @Transactional
    public AuthenticationResponse google(Requests.Google request) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new BadRequest("Login com Google não configurado neste servidor.");
        }
        JsonNode dados;
        try {
            var req = HttpRequest.newBuilder(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token="
                    + URLEncoder.encode(request.credential(), StandardCharsets.UTF_8))).timeout(Duration.ofSeconds(10)).GET().build();
            var resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) throw new Unauthorized("Token do Google inválido.");
            dados = new ObjectMapper().readTree(resp.body());
        } catch (Unauthorized e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequest("Não foi possível validar o login com Google agora. Tente novamente.");
        }
        if (!googleClientId.equals(dados.path("aud").asString()) || !"true".equals(dados.path("email_verified").asString())) {
            throw new Unauthorized("Token do Google não pertence a esta aplicação.");
        }
        String sub = dados.path("sub").asString();
        String email = dados.path("email").asString().toLowerCase();
        Usuario user = repository.findByGoogleId(sub).or(() -> repository.findByEmail(email)).orElseGet(() -> {
            Aluno a = new Aluno();
            a.setNome(dados.path("name").asString(email));
            a.setEmail(email);
            a.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            Usuario novo = repository.save(a);
            acessoService.assinatura(novo);
            return novo;
        });
        if (!user.isCodStatus()) throw new Unauthorized("Conta inativa. Procure o administrador da plataforma.");
        user.setGoogleId(sub);
        repository.save(user);
        return emitirTokens(user);
    }

    /** UC004 - Solicitar recuperação de senha. A resposta é sempre a mesma para não revelar e-mails cadastrados. */
    @Transactional
    public Map<String, Object> esqueciSenha(Requests.EsqueciSenha request) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("mensagem", "Se o e-mail estiver cadastrado, enviaremos um link de recuperação válido por 30 minutos.");
        repository.findByEmail(request.email().trim().toLowerCase()).filter(Usuario::isCodStatus).ifPresent(u -> {
            TokenRecuperacao t = new TokenRecuperacao();
            t.setUsuario(u);
            t.setToken(UUID.randomUUID().toString().replace("-", ""));
            t.setExpiraEm(LocalDateTime.now().plusMinutes(30));
            tokenRecuperacaoRepository.save(t);
            String link = frontUrl + "/redefinir-senha?token=" + t.getToken();
            log.info("Link de recuperação de senha para {}: {}", u.getEmail(), link);
            if (modoDemonstracao) r.put("linkDemonstracao", link);
        });
        return r;
    }

    /** UC004 - Redefinir senha com o link recebido. */
    @Transactional
    public void redefinirSenha(Requests.RedefinirSenha request) {
        TokenRecuperacao t = tokenRecuperacaoRepository.findByToken(request.token())
                .orElseThrow(() -> new BadRequest("Link de recuperação inválido."));
        if (t.isUsado() || t.getExpiraEm().isBefore(LocalDateTime.now())) {
            throw new BadRequest("Link expirado. Solicite uma nova recuperação de senha.");
        }
        validarSenha(request.novaSenha());
        Usuario u = t.getUsuario();
        u.setPassword(passwordEncoder.encode(request.novaSenha()));
        u.setTentativasFalhas(0);
        u.setBloqueadoAte(null);
        repository.save(u);
        t.setUsado(true);
        tokenRecuperacaoRepository.save(t);
        revogarTokens(u);
    }

    private AuthenticationResponse emitirTokens(Usuario user) {
        String jwtToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        revogarTokens(user);
        Token token = new Token();
        token.setUsuario(user);
        token.setToken(jwtToken);
        token.setTokenType(TokenType.BEARER);
        tokenRepository.save(token);
        return new AuthenticationResponse(jwtToken, refreshToken, UsuarioDTO.de(user, acessoService.isPro(user)));
    }

    public void revogarTokens(Usuario usuario) {
        var validos = tokenRepository.findAllValidTokenByUser(usuario.getId());
        validos.forEach(t -> {
            t.setExpired(true);
            t.setRevoked(true);
        });
        tokenRepository.saveAll(validos);
    }

    public Map<String, Object> config() {
        return Map.of("googleClientId", googleClientId == null ? "" : googleClientId, "modoDemonstracao", modoDemonstracao);
    }
}
