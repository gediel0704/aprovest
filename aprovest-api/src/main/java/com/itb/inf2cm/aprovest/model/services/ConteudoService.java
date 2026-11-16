package com.itb.inf2cm.aprovest.model.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.exceptions.BadRequest;
import com.itb.inf2cm.aprovest.exceptions.NotFound;
import com.itb.inf2cm.aprovest.model.entity.*;
import com.itb.inf2cm.aprovest.model.repository.*;

/**
 * Conteúdo pedagógico: banco de questões (RF08, UC030, UC031, UC032, UC041), biblioteca (UC014, UC015),
 * fontes oficiais (UC016), temas de redação e catálogo de vestibulares/disciplinas/tópicos.
 */
@Service
public class ConteudoService {

    private final QuestaoRepository questaoRepository;
    private final VestibularRepository vestibularRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final TopicoRepository topicoRepository;
    private final MaterialRepository materialRepository;
    private final LeituraMaterialRepository leituraRepository;
    private final TemaRedacaoRepository temaRepository;
    private final ParecerConteudoRepository parecerRepository;

    public ConteudoService(QuestaoRepository questaoRepository, VestibularRepository vestibularRepository,
                           DisciplinaRepository disciplinaRepository, TopicoRepository topicoRepository,
                           MaterialRepository materialRepository, LeituraMaterialRepository leituraRepository,
                           TemaRedacaoRepository temaRepository, ParecerConteudoRepository parecerRepository) {
        this.questaoRepository = questaoRepository;
        this.vestibularRepository = vestibularRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.topicoRepository = topicoRepository;
        this.materialRepository = materialRepository;
        this.leituraRepository = leituraRepository;
        this.temaRepository = temaRepository;
        this.parecerRepository = parecerRepository;
    }

    // =========================== Catálogo ===========================
    public Map<String, Object> catalogo() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("vestibulares", vestibularRepository.findByCodStatusTrueOrderByIdAsc());
        m.put("disciplinas", disciplinaRepository.findByCodStatusTrueOrderByNomeAsc());
        m.put("topicos", topicoRepository.findByCodStatusTrueOrderByNomeAsc().stream()
                .map(t -> Map.of("id", t.getId(), "nome", t.getNome(), "disciplinaId", t.getDisciplina().getId())).toList());
        Map<String, Long> porVest = new LinkedHashMap<>();
        for (Object[] r : questaoRepository.contarPorVestibular()) porVest.put((String) r[0], ((Number) r[1]).longValue());
        m.put("questoesPorVestibular", porVest);
        return m;
    }

    /** Estatísticas públicas para a página inicial. */
    public Map<String, Object> numerosPublicos() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("questoesOficiais", questaoRepository.countByCodStatusTrue());
        m.put("temasOficiais", temaRepository.findByCodStatusTrueOrderByAnoDescIdAsc().size());
        m.put("vestibulares", vestibularRepository.findByCodStatusTrueOrderByIdAsc().stream()
                .map(v -> Map.of("sigla", v.getSigla(), "nome", v.getNome(), "organizadora", v.getOrganizadora(), "site", v.getSiteOficial())).toList());
        return m;
    }

    // =========================== Questões (admin) ===========================
    public Page<Map<String, Object>> buscarQuestoes(Long vestibularId, Long disciplinaId, Boolean status, Integer ano, String busca, int pagina) {
        return questaoRepository.buscar(vestibularId, disciplinaId, status, ano, busca == null || busca.isBlank() ? null : busca.trim(),
                PageRequest.of(pagina, 20, Sort.by(Sort.Direction.DESC, "id"))).map(this::questaoAdmin);
    }

    public Map<String, Object> questaoAdmin(Questao q) {
        Map<String, Object> m = EstudoService.questaoPublica(q);
        m.put("gabarito", q.getGabarito());
        m.put("explicacao", q.getExplicacao());
        m.put("vestibularId", q.getVestibular().getId());
        m.put("vestibular", q.getVestibular().getSigla());
        m.put("disciplinaId", q.getDisciplina().getId());
        m.put("topicoIds", q.getTopicos().stream().map(Topico::getId).toList());
        m.put("dificuldade", q.getDificuldade());
        m.put("numero", q.getNumero());
        m.put("taxaAcerto", q.getTaxaAcerto());
        m.put("totalRespostas", q.getTotalRespostas());
        m.put("ativa", q.isCodStatus());
        return m;
    }

    public Map<String, Object> questao(Long id) {
        return questaoAdmin(questaoRepository.findById(id).orElseThrow(() -> new NotFound("Questão não encontrada.")));
    }

    /** UC030 - Cadastrar item (RN04: disciplina, ao menos um tópico e um vestibular). */
    @Transactional
    public Map<String, Object> criarQuestao(Requests.Questao req) {
        Questao q = new Questao();
        preencherQuestao(q, req);
        return questaoAdmin(questaoRepository.save(q));
    }

    /** UC041 - Editar item. */
    @Transactional
    public Map<String, Object> atualizarQuestao(Long id, Requests.Questao req) {
        Questao q = questaoRepository.findById(id).orElseThrow(() -> new NotFound("Questão não encontrada."));
        preencherQuestao(q, req);
        return questaoAdmin(questaoRepository.save(q));
    }

    private void preencherQuestao(Questao q, Requests.Questao req) {
        Vestibular v = vestibularRepository.findById(req.vestibularId()).orElseThrow(() -> new BadRequest("Vestibular inválido."));
        Disciplina d = disciplinaRepository.findById(req.disciplinaId()).orElseThrow(() -> new BadRequest("Disciplina inválida."));
        Set<Topico> topicos = new HashSet<>(topicoRepository.findAllById(req.topicoIds()));
        if (topicos.isEmpty() || topicos.stream().anyMatch(t -> !t.getDisciplina().getId().equals(d.getId()))) {
            throw new BadRequest("Escolha ao menos um tópico pertencente à disciplina selecionada (RN04).");
        }
        List<String> letras = req.alternativas().stream().map(a -> a.letra().trim().toUpperCase()).toList();
        List<String> esperado = List.of("A", "B", "C", "D", "E").subList(0, letras.size());
        if (!letras.equals(esperado)) throw new BadRequest("As alternativas devem ser identificadas em sequência (A, B, C, D[, E]).");
        if (!letras.contains(req.gabarito())) throw new BadRequest("O gabarito deve corresponder a uma das alternativas.");
        q.setEnunciado(req.enunciado().trim());
        q.setIntroducaoAlternativas(req.introducaoAlternativas());
        q.setGabarito(req.gabarito());
        q.setExplicacao(req.explicacao());
        q.setAno(req.ano());
        q.setNumero(req.numero());
        q.setOrigem(req.origem() == null || req.origem().isBlank() ? "OFICIAL" : req.origem());
        q.setFonteDescricao(req.fonteDescricao().trim());
        q.setFonteUrl(req.fonteUrl());
        if (req.nivel() != null && q.getTotalRespostas() == 0) {
            q.setNivel(req.nivel());
            q.setDificuldade(BigDecimal.valueOf(switch (req.nivel()) { case "FACIL" -> 980; case "DIFICIL" -> 1140; default -> 1060; }));
        }
        q.setVestibular(v);
        q.setDisciplina(d);
        q.setTopicos(topicos);
        q.getAlternativas().clear();
        req.alternativas().forEach(a -> q.adicionarAlternativa(a.letra().trim().toUpperCase(), a.texto().trim()));
    }

    /** UC031 - Importar questões em lote (1 a 100 itens), validando cada uma. */
    @Transactional
    public Map<String, Object> importar(Requests.ImportarQuestoes req) {
        List<Map<String, Object>> criadas = new ArrayList<>();
        for (int i = 0; i < req.questoes().size(); i++) {
            try {
                criadas.add(criarQuestao(req.questoes().get(i)));
            } catch (BadRequest | NotFound e) {
                throw new BadRequest("Item " + (i + 1) + " do lote: " + e.getMessage() + " Nenhuma questão foi importada.");
            }
        }
        return Map.of("importadas", criadas.size(), "ids", criadas.stream().map(m -> m.get("id")).toList());
    }

    /** UC032 - Arquivar (retirar de publicação, sem exclusão física) ou republicar. */
    @Transactional
    public Map<String, Object> alterarPublicacao(Long id, boolean publicada) {
        Questao q = questaoRepository.findById(id).orElseThrow(() -> new NotFound("Questão não encontrada."));
        q.setCodStatus(publicada);
        return questaoAdmin(questaoRepository.save(q));
    }

    public List<ParecerConteudo> pareceres() {
        return parecerRepository.findAllByOrderByCriadoEmDesc();
    }

    // =========================== Biblioteca e fontes oficiais ===========================
    /** UC014 - Consultar conteúdos (internos) e UC016 - fontes oficiais (oficial=true). */
    public List<Map<String, Object>> biblioteca(Usuario u, Boolean oficial, String vestibular, Long disciplinaId, String tipo, String busca) {
        Long vestId = vestibular == null || vestibular.isBlank() ? null
                : vestibularRepository.findBySigla(vestibular.toUpperCase()).map(Vestibular::getId).orElse(null);
        Set<Long> concluidos = u == null ? Set.of() : leituraRepository.findByUsuarioId(u.getId()).stream()
                .filter(LeituraMaterial::isConcluido).map(l -> l.getMaterial().getId()).collect(Collectors.toSet());
        return materialRepository.buscar(oficial, vestId, disciplinaId, tipo == null || tipo.isBlank() ? null : tipo,
                busca == null || busca.isBlank() ? null : busca.trim()).stream().map(m -> materialResumo(m, concluidos.contains(m.getId()))).toList();
    }

    private Map<String, Object> materialResumo(Material m, boolean concluido) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id", m.getId());
        r.put("titulo", m.getTitulo());
        r.put("resumo", m.getResumo());
        r.put("tipo", m.getTipo());
        r.put("oficial", m.isOficial());
        r.put("fonteOrgao", m.getFonteOrgao());
        r.put("fonteUrl", m.getFonteUrl());
        r.put("ano", m.getAno());
        r.put("vestibular", m.getVestibular() == null ? null : m.getVestibular().getSigla());
        r.put("disciplina", m.getDisciplina() == null ? null : m.getDisciplina().getNome());
        r.put("concluido", concluido);
        r.put("temConteudo", m.getConteudo() != null && !m.getConteudo().isBlank());
        return r;
    }

    public Map<String, Object> material(Usuario u, Long id) {
        Material m = materialRepository.findById(id).filter(Material::isCodStatus).orElseThrow(() -> new NotFound("Conteúdo não encontrado."));
        boolean concluido = leituraRepository.findByUsuarioIdAndMaterialId(u.getId(), id).map(LeituraMaterial::isConcluido).orElse(false);
        Map<String, Object> r = materialResumo(m, concluido);
        r.put("conteudo", m.getConteudo());
        return r;
    }

    /** UC015 - Marcar leitura como concluída ou não concluída. */
    @Transactional
    public Map<String, Object> marcarLeitura(Usuario u, Long id, boolean concluido) {
        Material m = materialRepository.findById(id).orElseThrow(() -> new NotFound("Conteúdo não encontrado."));
        if (m.isOficial()) throw new BadRequest("O progresso de leitura vale apenas para conteúdos internos.");
        LeituraMaterial l = leituraRepository.findByUsuarioIdAndMaterialId(u.getId(), id).orElseGet(() -> {
            LeituraMaterial nova = new LeituraMaterial();
            nova.setUsuario(u);
            nova.setMaterial(m);
            return nova;
        });
        l.setConcluido(concluido);
        l.setAtualizadoEm(LocalDateTime.now());
        leituraRepository.save(l);
        return material(u, id);
    }

    public List<Material> materiaisAdmin() {
        return materialRepository.findAllByOrderByIdDesc();
    }

    @Transactional
    public Material salvarMaterial(Long id, Requests.Material req) {
        Material m = id == null ? new Material() : materialRepository.findById(id).orElseThrow(() -> new NotFound("Material não encontrado."));
        m.setTitulo(req.titulo().trim());
        m.setResumo(req.resumo().trim());
        m.setConteudo(req.conteudo());
        m.setTipo(req.tipo());
        m.setOficial(Boolean.TRUE.equals(req.oficial()));
        if (m.isOficial() && (req.fonteUrl() == null || req.fonteUrl().isBlank())) throw new BadRequest("Fonte oficial exige o link do órgão responsável.");
        m.setFonteOrgao(req.fonteOrgao().trim());
        m.setFonteUrl(req.fonteUrl());
        m.setAno(req.ano());
        m.setVestibular(req.vestibularId() == null ? null : vestibularRepository.findById(req.vestibularId()).orElse(null));
        m.setDisciplina(req.disciplinaId() == null ? null : disciplinaRepository.findById(req.disciplinaId()).orElse(null));
        return materialRepository.save(m);
    }

    @Transactional
    public Material alterarPublicacaoMaterial(Long id, boolean ativo) {
        Material m = materialRepository.findById(id).orElseThrow(() -> new NotFound("Material não encontrado."));
        m.setCodStatus(ativo);
        return materialRepository.save(m);
    }

    // =========================== Temas de redação ===========================
    public List<TemaRedacao> temas(boolean incluirInativos) {
        return incluirInativos ? temaRepository.findAllByOrderByAnoDescIdAsc() : temaRepository.findByCodStatusTrueOrderByAnoDescIdAsc();
    }

    @Transactional
    public TemaRedacao salvarTema(Long id, Requests.Tema req) {
        TemaRedacao t = id == null ? new TemaRedacao() : temaRepository.findById(id).orElseThrow(() -> new NotFound("Tema não encontrado."));
        t.setTitulo(req.titulo().trim());
        t.setProposta(req.proposta().trim());
        t.setTextosApoio(req.textosApoio());
        t.setExpectativaBanca(req.expectativaBanca());
        t.setGenero(req.genero() == null || req.genero().isBlank() ? "Dissertativo-argumentativo" : req.genero());
        t.setAno(req.ano());
        t.setOrigem(req.origem() == null || req.origem().isBlank() ? "AUTORAL" : req.origem());
        t.setFonteDescricao(req.fonteDescricao());
        t.setFonteUrl(req.fonteUrl());
        t.setVestibular(vestibularRepository.findById(req.vestibularId()).orElseThrow(() -> new BadRequest("Vestibular inválido.")));
        return temaRepository.save(t);
    }

    @Transactional
    public TemaRedacao alterarPublicacaoTema(Long id, boolean ativo) {
        TemaRedacao t = temaRepository.findById(id).orElseThrow(() -> new NotFound("Tema não encontrado."));
        t.setCodStatus(ativo);
        return temaRepository.save(t);
    }
}
