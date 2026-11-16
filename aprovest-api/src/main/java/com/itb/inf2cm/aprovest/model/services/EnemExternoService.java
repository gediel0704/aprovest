package com.itb.inf2cm.aprovest.model.services;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.itb.inf2cm.aprovest.dto.Requests;
import com.itb.inf2cm.aprovest.exceptions.BadRequest;
import com.itb.inf2cm.aprovest.exceptions.NotFound;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * UC017 - Praticar questões ENEM externas (edições 2009-2023) usando a API comunitária enem.dev,
 * que disponibiliza os itens oficiais do INEP. O gabarito nunca é enviado ao navegador antes
 * da resposta, e estas respostas NÃO são gravadas no histórico interno.
 */
@Service
public class EnemExternoService {

    private static final String BASE = "https://api.enem.dev/v1";
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<Integer, List<JsonNode>> cache = new ConcurrentHashMap<>();
    private volatile List<Map<String, Object>> edicoes;

    private JsonNode get(String url) {
        try {
            for (int tentativa = 1; tentativa <= 3; tentativa++) {
                HttpRequest req = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(20))
                        .header("User-Agent", "AproVest-TCC/1.0").GET().build();
                HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() == 429) { Thread.sleep(1500L * tentativa); continue; }
                if (resp.statusCode() == 404) throw new NotFound("Questão não encontrada na fonte externa.");
                if (resp.statusCode() != 200) break;
                return mapper.readTree(resp.body());
            }
        } catch (NotFound e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            // segue para a mensagem de indisponibilidade
        }
        throw new BadRequest("A fonte externa enem.dev está indisponível no momento. Tente novamente mais tarde.");
    }

    public List<Map<String, Object>> edicoes() {
        if (edicoes == null) {
            List<Map<String, Object>> lista = new ArrayList<>();
            for (JsonNode e : get(BASE + "/exams")) {
                List<Map<String, String>> areas = new ArrayList<>();
                e.path("disciplines").forEach(d -> areas.add(Map.of("value", d.path("value").asString(), "label", d.path("label").asString())));
                lista.add(Map.of("ano", e.path("year").asInt(), "titulo", e.path("title").asString(), "areas", areas));
            }
            edicoes = lista;
        }
        return edicoes;
    }

    private List<JsonNode> questoesDoAno(int ano) {
        return cache.computeIfAbsent(ano, a -> {
            List<JsonNode> todas = new ArrayList<>();
            for (int offset = 0; offset < 400; offset += 50) {
                JsonNode pagina = get(BASE + "/exams/" + a + "/questions?limit=50&offset=" + offset);
                pagina.path("questions").forEach(todas::add);
                if (!pagina.path("metadata").path("hasMore").asBoolean()) break;
            }
            return todas;
        });
    }

    public Map<String, Object> listar(int ano, String area, String idioma, int pagina) {
        if (ano < 2009 || ano > 2023) throw new BadRequest("Edições disponíveis: 2009 a 2023.");
        String lingua = idioma == null || idioma.isBlank() ? "ingles" : idioma;
        List<JsonNode> filtradas = questoesDoAno(ano).stream()
                .filter(q -> area == null || area.isBlank() || area.equals(q.path("discipline").asString()))
                .filter(q -> q.path("language").isNull() || q.path("language").isMissingNode() || lingua.equals(q.path("language").asString()))
                .toList();
        int porPagina = 10;
        int total = filtradas.size();
        List<Map<String, Object>> itens = filtradas.stream().skip((long) pagina * porPagina).limit(porPagina).map(this::semGabarito).toList();
        return Map.of("ano", ano, "total", total, "pagina", pagina, "paginas", (total + porPagina - 1) / porPagina, "questoes", itens,
                "fonte", "INEP - ENEM " + ano + " (itens disponibilizados pela API comunitária enem.dev)");
    }

    private Map<String, Object> semGabarito(JsonNode q) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ano", q.path("year").asInt());
        m.put("indice", q.path("index").asInt());
        m.put("titulo", q.path("title").asString());
        m.put("area", q.path("discipline").asString());
        m.put("idioma", q.path("language").isNull() ? null : q.path("language").asString(null));
        m.put("contexto", q.path("context").isNull() ? null : q.path("context").asString(null));
        List<String> arquivos = new ArrayList<>();
        q.path("files").forEach(f -> arquivos.add(f.asString()));
        m.put("arquivos", arquivos);
        m.put("introducaoAlternativas", q.path("alternativesIntroduction").asString(""));
        List<Map<String, Object>> alts = new ArrayList<>();
        q.path("alternatives").forEach(a -> {
            Map<String, Object> alt = new LinkedHashMap<>();
            alt.put("letra", a.path("letter").asString());
            alt.put("texto", a.path("text").isNull() ? "" : a.path("text").asString(""));
            alt.put("imagem", a.path("file").isNull() ? null : a.path("file").asString(null));
            alts.add(alt);
        });
        m.put("alternativas", alts);
        return m;
    }

    /** Conferência da resposta (feita no servidor, sem gravar no histórico interno). */
    public Map<String, Object> conferir(Requests.ConferirEnem req) {
        JsonNode q = questoesDoAno(req.ano()).stream()
                .filter(x -> x.path("index").asInt() == req.indice())
                .filter(x -> x.path("language").isNull() || req.idioma() == null || req.idioma().equals(x.path("language").asString()))
                .findFirst().orElseThrow(() -> new NotFound("Questão não encontrada na fonte externa."));
        String gabarito = q.path("correctAlternative").asString();
        String marcada = req.alternativa().toUpperCase();
        return Map.of("correta", gabarito.equals(marcada), "gabarito", gabarito, "marcada", marcada);
    }
}
