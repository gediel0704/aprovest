package com.itb.inf2cm.aprovest.config;

import java.util.List;
import java.util.Map;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.model.entity.Admin;
import com.itb.inf2cm.aprovest.model.entity.Aluno;
import com.itb.inf2cm.aprovest.model.entity.Corretor;
import com.itb.inf2cm.aprovest.model.entity.Questao;
import com.itb.inf2cm.aprovest.model.entity.Usuario;
import com.itb.inf2cm.aprovest.model.repository.QuestaoRepository;
import com.itb.inf2cm.aprovest.model.repository.UsuarioRepository;
import com.itb.inf2cm.aprovest.model.services.AcessoService;
import com.itb.inf2cm.aprovest.model.services.EstudoService;

/**
 * Carga inicial do ambiente local de desenvolvimento: cria as contas de administrador, corretor
 * e aluno (senha em app.seed.senha-padrao) e, opcionalmente, ALUNOS DE DEMONSTRAÇÃO que
 * respondem questões reais para que o percentil (mínimo de 5 comparáveis) e o ranking tenham
 * com quem comparar. Os alunos de demonstração usam o domínio @demo.aprovest.com.br.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private static final String DOMINIO_DEMO = "@demo.aprovest.com.br";

    private final UsuarioRepository usuarioRepository;
    private final QuestaoRepository questaoRepository;
    private final PasswordEncoder passwordEncoder;
    private final AcessoService acessoService;
    private final EstudoService estudoService;

    @Value("${app.seed.admin-email}") private String adminEmail;
    @Value("${app.seed.corretor-email}") private String corretorEmail;
    @Value("${app.seed.aluno-email}") private String alunoEmail;
    @Value("${app.seed.senha-padrao}") private String senha;
    @Value("${app.seed.alunos-demonstracao:true}") private boolean criarDemonstracao;

    public DataInitializer(UsuarioRepository usuarioRepository, QuestaoRepository questaoRepository, PasswordEncoder passwordEncoder,
                           AcessoService acessoService, EstudoService estudoService) {
        this.usuarioRepository = usuarioRepository;
        this.questaoRepository = questaoRepository;
        this.passwordEncoder = passwordEncoder;
        this.acessoService = acessoService;
        this.estudoService = estudoService;
    }

    @Override
    public void run(String... args) {
        if (usuarioRepository.findByEmail(adminEmail).isEmpty()) {
            Admin a = new Admin();
            a.setNivelAcesso("TOTAL");
            criar(a, "Administrador AproVest", adminEmail, null, null, null);
        }
        if (usuarioRepository.findByEmail(corretorEmail).isEmpty()) {
            Corretor c = new Corretor();
            c.setFormacao("Licenciatura em Letras - Língua Portuguesa");
            criar(c, "Profa. Corretora AproVest", corretorEmail, null, null, null);
        }
        if (usuarioRepository.findByEmail(alunoEmail).isEmpty()) {
            Usuario a = criar(new Aluno(), "Aluno AproVest", alunoEmail, "Medicina", "USP", "ENEM,FUVEST");
            acessoService.adicionarCreditos(a, 2, "Créditos de boas-vindas (demonstração)");
        }
        if (criarDemonstracao && questaoRepository.count() > 0
                && usuarioRepository.findByEmail("aluno01" + DOMINIO_DEMO).isEmpty()) {
            new Thread(this::criarAlunosDemonstracao, "seed-demonstracao").start();
        }
    }

    private Usuario criar(Usuario u, String nome, String email, String curso, String universidade, String vestibulares) {
        u.setNome(nome);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(senha));
        u.setCursoAlvo(curso);
        u.setUniversidadeAlvo(universidade);
        u.setVestibularesAlvo(vestibulares);
        u.setOnboardingConcluido(true);
        Usuario salvo = usuarioRepository.save(u);
        log.info("Conta criada: {} ({})", email, salvo.getTipo());
        return salvo;
    }

    private void criarAlunosDemonstracao() {
        try {
            log.info("Criando alunos de demonstração com histórico de simulados (executa apenas uma vez)...");
            String[] nomes = {"Ana Souza", "Bruno Lima", "Carla Mendes", "Diego Alves", "Eduarda Rocha", "Felipe Costa",
                    "Gabriela Nunes", "Henrique Dias", "Isabela Martins", "João Pereira", "Larissa Gomes", "Mateus Ribeiro"};
            String[][] metas = {{"Medicina", "USP"}, {"Medicina", "USP"}, {"Engenharia", "Unicamp"}, {"Direito", "USP"}};
            Random rnd = new Random(42);
            for (int i = 0; i < nomes.length; i++) {
                String[] meta = metas[i % metas.length];
                Usuario u = criar(new Aluno(), nomes[i] + " (demo)", String.format("aluno%02d%s", i + 1, DOMINIO_DEMO),
                        meta[0], meta[1], "ENEM,FUVEST,UNICAMP");
                acessoService.adicionarCreditos(u, 5, "Créditos de demonstração");
                double habilidade = 900 + rnd.nextGaussian() * 140;
                for (String vest : List.of("ENEM", "FUVEST", "UNICAMP")) {
                    responderSessao(u, estudoService.iniciarSimulado(u, new Requests.IniciarSessao(vest, "SEMANAL", true)), habilidade, rnd);
                }
                responderSessao(u, estudoService.iniciarBanca(u, new Requests.IniciarSessao("ENEM", null, false)), habilidade, rnd);
            }
            log.info("Alunos de demonstração criados.");
        } catch (Exception e) {
            log.warn("Falha ao criar alunos de demonstração: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void responderSessao(Usuario u, Map<String, Object> sessao, double habilidade, Random rnd) {
        Long id = ((Number) sessao.get("id")).longValue();
        for (Map<String, Object> q : (List<Map<String, Object>>) sessao.get("questoes")) {
            Questao questao = questaoRepository.findById(((Number) q.get("id")).longValue()).orElseThrow();
            double p = 1.0 / (1.0 + Math.pow(10, (questao.getDificuldade().doubleValue() - habilidade) / 400.0));
            List<String> letras = questao.getAlternativas().stream().map(a -> a.getLetra()).toList();
            String marcada = rnd.nextDouble() < p ? questao.getGabarito()
                    : letras.stream().filter(l -> !l.equals(questao.getGabarito())).toList().get(rnd.nextInt(letras.size() - 1));
            estudoService.responder(u, id, new Requests.Responder(questao.getId(), marcada, 60 + rnd.nextInt(120)));
        }
        if ("SIMULADO".equals(sessao.get("modo"))) estudoService.concluir(u, id);
    }
}
