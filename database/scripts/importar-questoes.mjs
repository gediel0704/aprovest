// =====================================================================
// AproVest - Importador de questões OFICIAIS
// ---------------------------------------------------------------------
// Gera o arquivo ../02_taxonomia_e_questoes_oficiais.sql a partir de:
//   * ENEM (INEP)  -> itens oficiais 2017-2023 obtidos pela API pública enem.dev
//   * FUVEST 2025  -> caderno V1 e gabarito oficial publicados em fuvest.br
//   * UNICAMP 2025 e 2026 -> cadernos Q e gabaritos oficiais publicados em comvest.unicamp.br
// Somente questões 100% textuais entram no banco (itens que dependem de
// figura, gráfico, charge ou mapa são descartados para não ficarem incompletos).
//
// Requisitos: Node.js 20+ e Poppler (comando "pdftotext") no PATH.
// Uso:  node database/scripts/importar-questoes.mjs
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..");
const CACHE = path.join(RAIZ, "fontes", "cache");
const SAIDA = path.join(RAIZ, "02_taxonomia_e_questoes_oficiais.sql");
fs.mkdirSync(CACHE, { recursive: true });

const ANOS_ENEM = [2017, 2018, 2019, 2020, 2021, 2022, 2023];

// ---------------------------------------------------------------------
// Taxonomia: disciplinas, áreas e tópicos (RN04)
// Cada tópico tem palavras-chave usadas para classificar as questões.
// ---------------------------------------------------------------------
const TAXONOMIA = {
  "Matemática": { area: "Matemática e suas Tecnologias", topicos: {
    "Porcentagem e matemática financeira": ["porcent", "%", "juro", "desconto", "lucro", "acrescimo", "aumento de", "reajuste", "taxa de"],
    "Razão, proporção e escalas": ["razao", "proporc", "escala", "regra de tres", "grandeza"],
    "Estatística": ["media", "mediana", "moda", "desvio padrao", "frequencia", "grafico", "pesquisa"],
    "Probabilidade e análise combinatória": ["probabilidade", "chance", "sorteio", "aleatori", "combina", "permuta", "arranjo", "maneiras"],
    "Funções e gráficos": ["funcao", "f(x)", "afim", "quadratica", "exponencial", "logarit", "parabola"],
    "Geometria plana": ["triangulo", "area", "perimetro", "circunferencia", "angulo", "retangul", "quadrado", "poligono"],
    "Geometria espacial": ["volume", "cilindro", "cubo", "prisma", "piramide", "esfera", "cone", "litros", "capacidade"],
    "Aritmética e álgebra": ["equacao", "numero", "soma", "multipl", "divis", "fracao", "potencia", "raiz"],
    "Sequências e progressões": ["sequencia", "progressao", "termo", "p.a", "p.g"],
  }},
  "Física": { area: "Ciências da Natureza e suas Tecnologias", topicos: {
    "Mecânica e movimento": ["velocidade", "aceleracao", "forca", "movimento", "atrito", "massa", "newton", "queda", "colisao"],
    "Energia e trabalho": ["energia cinetica", "energia potencial", "trabalho", "potencia", "rendimento", "conservacao da energia"],
    "Eletricidade e magnetismo": ["eletric", "corrente", "tensao", "resistor", "circuito", "magnet", "volt", "ampere", "pilha", "bateria"],
    "Ondulatória e óptica": ["onda", "som", "frequencia", "luz", "lente", "espelho", "refracao", "reflexao", "optic"],
    "Termologia": ["calor", "temperatura", "termic", "dilatacao", "termodinam", "isolante"],
    "Hidrostática": ["pressao", "empuxo", "densidade", "fluido", "hidrost"],
  }},
  "Química": { area: "Ciências da Natureza e suas Tecnologias", topicos: {
    "Química orgânica": ["organic", "carbono", "hidrocarbon", "alcool", "ester", "polimero", "funcao organica", "etanol", "isomer"],
    "Estequiometria e soluções": ["mol", "concentracao", "solucao", "soluto", "estequiom", "massa molar", "titulacao"],
    "Reações e equilíbrio químico": ["reacao", "equilibrio", "oxida", "reducao", "eletrolise", "acido", "base", "ph", "catalis", "cinetica"],
    "Química ambiental": ["poluicao", "efeito estufa", "chuva acida", "residuo", "lixo", "combustivel", "co2", "ozonio"],
    "Atomística e ligações": ["atomo", "eletron", "ligacao", "tabela periodica", "isotopo", "radioativ", "molecula"],
  }},
  "Biologia": { area: "Ciências da Natureza e suas Tecnologias", topicos: {
    "Ecologia e meio ambiente": ["ecolog", "ecossistema", "cadeia alimentar", "bioma", "biodiversidade", "populacao", "ambiental", "especie"],
    "Genética e evolução": ["gene", "genetic", "dna", "heranca", "cromossomo", "mutacao", "evolu", "selecao natural"],
    "Fisiologia humana e saúde": ["sangue", "corpo humano", "hormonio", "doenca", "vacina", "virus", "bacteria", "saude", "infeccao", "sistema imune"],
    "Citologia e bioquímica": ["celula", "membrana", "mitocondri", "proteina", "enzima", "fotossintese", "respiracao celular"],
    "Botânica e zoologia": ["planta", "vegetal", "animal", "inseto", "fungo", "flor", "semente", "raiz"],
  }},
  "História": { area: "Ciências Humanas e suas Tecnologias", topicos: {
    "Brasil Colônia e Império": ["colonizad", "america portuguesa", "metropole", "capitania", "sesmaria", "colonia", "colonial", "imperio", "escraviz", "escravidao", "engenho", "bandeirante", "jesuita", "d. pedro"],
    "Brasil República": ["republica", "vargas", "ditadura", "militar", "constituicao", "redemocratiz", "estado novo", "golpe"],
    "História antiga e medieval": ["seculo", "monge", "teologo", "cruzada", "grecia", "roma", "medieval", "feudal", "antiguidade", "igreja", "idade media"],
    "História moderna e contemporânea": ["revolucao", "guerra", "iluminismo", "industrial", "fascismo", "nazismo", "guerra fria", "imperialismo"],
    "Cidadania e direitos humanos": ["cidadania", "direitos", "movimento social", "democracia", "voto"],
  }},
  "Geografia": { area: "Ciências Humanas e suas Tecnologias", topicos: {
    "Geografia física e clima": ["clima", "relevo", "solo", "rocha", "chuva", "bacia", "rio", "vegetacao", "erosao", "atmosfer"],
    "Geografia urbana e população": ["urban", "cidade", "metropol", "migracao", "populacao", "demograf", "favela"],
    "Geografia agrária e economia": ["agrari", "agricultura", "agronegocio", "campo", "terra", "industria", "economia", "comercio"],
    "Geopolítica e globalização": ["globaliz", "geopolit", "fronteira", "territorio", "pais", "conflito", "bloco economico"],
    "Meio ambiente e sustentabilidade": ["desmatamento", "sustentab", "impacto ambiental", "aquecimento", "recursos naturais"],
  }},
  "Filosofia": { area: "Ciências Humanas e suas Tecnologias", topicos: {
    "Ética e política": ["etica", "moral", "virtude", "politica", "justica", "estado", "contrato social"],
    "Teoria do conhecimento": ["conhecimento", "razao", "verdade", "empiris", "racional", "metafisic", "ciencia"],
    "Filosofia antiga": ["socrates", "platao", "aristoteles", "sofista", "pre-socratico"],
  }},
  "Sociologia": { area: "Ciências Humanas e suas Tecnologias", topicos: {
    "Cultura e sociedade": ["cultura", "identidade", "etnocentr", "diversidade", "indigena", "religi"],
    "Trabalho e desigualdade": ["trabalho", "trabalhador", "desigualdade", "classe", "capitalis", "renda", "emprego"],
    "Movimentos sociais e cidadania": ["movimento", "cidadania", "direitos", "feminis", "racismo", "preconceito"],
  }},
  "Língua Portuguesa": { area: "Linguagens, Códigos e suas Tecnologias", topicos: {
    "Interpretação de texto": ["texto", "autor", "leitor", "sentido", "argument", "objetivo", "finalidade"],
    "Gramática e variação linguística": ["variacao", "linguistic", "norma", "gramatic", "verbo", "pronome", "conjuncao", "pontuacao", "coesao"],
    "Gêneros textuais e funções da linguagem": ["genero", "funcao da linguagem", "publicidade", "anuncio", "propaganda", "campanha", "noticia", "cronica"],
  }},
  "Literatura": { area: "Linguagens, Códigos e suas Tecnologias", topicos: {
    "Escolas literárias": ["romantismo", "realismo", "modernismo", "barroco", "arcadismo", "simbolismo", "parnasian"],
    "Análise de poemas e narrativas": ["poema", "poesia", "verso", "narrador", "romance", "personagem", "conto", "literari"],
  }},
  "Artes e Educação Física": { area: "Linguagens, Códigos e suas Tecnologias", topicos: {
    "Artes visuais, música e teatro": ["arte", "artista", "obra", "pintura", "musica", "teatro", "danca", "escultura"],
    "Corpo, esporte e saúde": ["esporte", "atividade fisica", "exercicio", "corpo", "jogo", "pratica corporal"],
  }},
  "Língua Inglesa": { area: "Linguagens, Códigos e suas Tecnologias", topicos: {
    "Leitura em língua inglesa": [],
  }},
  "Interdisciplinar": { area: "Conhecimentos Gerais", topicos: {
    "Conhecimentos gerais": [],
  }},
};

const VESTIBULARES = [
  ["ENEM", "Exame Nacional do Ensino Médio", "Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (INEP)", "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem", "Avaliação nacional usada no SiSU, ProUni, Fies e por diversas universidades. 180 questões objetivas (4 áreas) e redação dissertativo-argumentativa avaliada em 5 competências (0 a 1000)."],
  ["FUVEST", "Vestibular FUVEST - Universidade de São Paulo (USP)", "Fundação Universitária para o Vestibular (FUVEST)", "https://www.fuvest.br", "1ª fase com 90 questões de múltipla escolha (5 alternativas); 2ª fase discursiva com Português e Redação (D1) e disciplinas específicas (D2)."],
  ["UNICAMP", "Vestibular Unicamp", "Comissão Permanente para os Vestibulares (Comvest/Unicamp)", "https://www.comvest.unicamp.br", "1ª fase com 72 questões de múltipla escolha (4 alternativas); 2ª fase com redação (dois gêneros) e questões discursivas."],
];

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
const normalizar = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const sql = (s) => (s === null || s === undefined ? "NULL" : "N'" + String(s).replace(/'/g, "''") + "'");
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const CITA_TEXTO_AUSENTE = /(excerto|trecho|fragmento|texto|poema|citacao|cancao|letra da musica|passagem)/;
const textoAusente = (enunciado) => enunciado.length < 280 && CITA_TEXTO_AUSENTE.test(normalizar(enunciado));
const PALAVRAS_IMAGEM = /(figura|imagem|charge|grafico|mapa|tabela|quadrinho|tirinha|cartum|fotografia|foto |ilustra|esquema|infografico|cartaz|anuncio a seguir|quadro a seguir|observe|analise o|figura anterior|texto anterior|imagem anterior)/;

async function baixar(url, nome) {
  const destino = path.join(CACHE, nome);
  if (fs.existsSync(destino) && fs.statSync(destino).size > 0) return destino;
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    const resp = await fetch(url, { headers: { "User-Agent": "AproVest-TCC-importador/1.0" } });
    if (resp.ok) {
      fs.writeFileSync(destino, Buffer.from(await resp.arrayBuffer()));
      return destino;
    }
    if (resp.status === 429) { await espera(4000 * tentativa); continue; }
    throw new Error(`Falha ao baixar ${url}: HTTP ${resp.status}`);
  }
  throw new Error(`Limite de requisições excedido em ${url}`);
}

const pdfParaTexto = (arquivo, layout = false) =>
  execFileSync("pdftotext", [...(layout ? ["-layout"] : []), "-enc", "UTF-8", arquivo, "-"], { maxBuffer: 64 * 1024 * 1024 }).toString("utf8");

function pontuar(texto, palavras) {
  let p = 0;
  for (const w of palavras) if (texto.includes(w)) p += w.length > 6 ? 2 : 1;
  return p;
}

function classificarTopico(disciplina, texto) {
  const t = normalizar(texto);
  const topicos = TAXONOMIA[disciplina].topicos;
  let melhor = Object.keys(topicos)[0], nota = -1;
  for (const [nome, palavras] of Object.entries(topicos)) {
    const p = pontuar(t, palavras);
    if (p > nota) { nota = p; melhor = nome; }
  }
  return melhor;
}

function classificarDisciplina(texto, candidatas) {
  const t = normalizar(texto);
  let melhor = null, nota = 0;
  for (const d of candidatas) {
    const todas = Object.values(TAXONOMIA[d].topicos).flat();
    const p = pontuar(t, todas);
    if (p > nota) { nota = p; melhor = d; }
  }
  return melhor;
}

function dificuldadeInicial(vestibular, disciplina, texto) {
  // Calibração inicial heurística; o algoritmo Elo ajusta com as respostas reais dos alunos.
  let d = 1000;
  if (vestibular !== "ENEM") d += 70;
  if (["Matemática", "Física", "Química"].includes(disciplina)) d += 50;
  d += Math.min(80, Math.floor(texto.length / 60));
  return d;
}
const nivelDe = (d) => (d < 1040 ? "FACIL" : d < 1110 ? "MEDIO" : "DIFICIL");

// ---------------------------------------------------------------------
// ENEM (INEP via enem.dev)
// ---------------------------------------------------------------------
const AREA_ENEM = {
  "matematica": ["Matemática"],
  "ciencias-natureza": ["Física", "Química", "Biologia"],
  "ciencias-humanas": ["História", "Geografia", "Filosofia", "Sociologia"],
  "linguagens": ["Língua Portuguesa", "Literatura", "Artes e Educação Física"],
};

async function importarEnem() {
  const questoes = [];
  for (const ano of ANOS_ENEM) {
    const cacheAno = path.join(CACHE, `enem_${ano}.json`);
    let itens = [];
    if (fs.existsSync(cacheAno)) itens = JSON.parse(fs.readFileSync(cacheAno, "utf8"));
    else {
      for (let offset = 0; ; offset += 50) {
        let json;
        for (let tentativa = 1; tentativa <= 5; tentativa++) {
          const r = await fetch(`https://api.enem.dev/v1/exams/${ano}/questions?limit=50&offset=${offset}`);
          if (r.status === 429) { await espera(5000 * tentativa); continue; }
          if (!r.ok) throw new Error(`enem.dev ${ano}: HTTP ${r.status}`);
          json = await r.json();
          break;
        }
        itens.push(...json.questions);
        if (!json.metadata.hasMore) break;
        await espera(700);
      }
      fs.writeFileSync(cacheAno, JSON.stringify(itens));
    }
    for (const q of itens) {
      if (q.language && q.language !== "ingles") continue;           // mantém Inglês, ignora Espanhol
      if (q.files && q.files.length) continue;
      const contexto = (q.context || "").trim();
      const intro = (q.alternativesIntroduction || "").trim();
      if (/!\[|https?:\/\/\S+\.(png|jpe?g|gif|svg)/i.test(contexto + intro)) continue;
      if (!q.alternatives || q.alternatives.length !== 5) continue;
      if (q.alternatives.some((a) => a.file || !a.text || !a.text.trim())) continue;
      if (!/^[A-E]$/.test(q.correctAlternative || "")) continue;
      const textoTodo = contexto + " " + intro + " " + q.alternatives.map((a) => a.text).join(" ");
      const disciplina = q.language === "ingles"
        ? "Língua Inglesa"
        : classificarDisciplina(textoTodo, AREA_ENEM[q.discipline]) || AREA_ENEM[q.discipline][0];
      const dif = dificuldadeInicial("ENEM", disciplina, textoTodo);
      questoes.push({
        vestibular: "ENEM", disciplina, topico: classificarTopico(disciplina, textoTodo),
        enunciado: contexto || intro, introducao: contexto ? intro : null,
        alternativas: q.alternatives.map((a) => [a.letter, a.text.trim()]),
        gabarito: q.correctAlternative, ano: q.year, numero: q.index,
        dificuldade: dif, nivel: nivelDe(dif),
        fonte: `INEP - ENEM ${q.year}, questão ${q.index} (caderno azul / 1ª aplicação)`,
        url: `https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos`,
      });
    }
    console.log(`ENEM ${ano}: ${questoes.filter((x) => x.ano === ano).length} questões textuais aproveitadas`);
  }
  return questoes;
}

// ---------------------------------------------------------------------
// FUVEST 2025 (1ª fase, prova V1)
// ---------------------------------------------------------------------
const DISCIPLINAS_GERAIS = ["Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Língua Portuguesa", "Literatura", "Artes e Educação Física"];

function limparBloco(s) {
  return s
    .replace(/Concurso Vestibular FUVEST 2025 - Prova V1/g, " ")
    .replace(/UNICAMP VESTIBULAR 2025.*$/gm, " ")
    .replace(/\f/g, "\n")
    .replace(/^\s*\d{1,2}\s*$/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extrairAlternativas(bloco, regex, letras) {
  const marcas = [...bloco.matchAll(regex)];
  const sequencia = marcas.map((m) => m[2].toUpperCase()).join("");
  if (sequencia !== letras) return null;
  const enunciado = bloco.slice(0, marcas[0].index).trim();
  const alternativas = marcas.map((m, i) => {
    const inicio = m.index + m[0].length;
    const fim = i + 1 < marcas.length ? marcas[i + 1].index : bloco.length;
    let texto = bloco.slice(inicio, fim);
    texto = texto.split(/#####|\n\n/)[0];
    return [m[2].toUpperCase(), texto.replace(/\s+/g, " ").trim()];
  });
  if (alternativas.some(([, t]) => t.length < 1 || t.length > 700)) return null;
  return { enunciado, alternativas };
}

async function importarFuvest() {
  const prova = await baixar("https://www.fuvest.br/wp-content/uploads/fuvest2025_primeira_fase_prova_V1.pdf", "fuvest2025_prova_V1.pdf");
  const gab = await baixar("https://www.fuvest.br/wp-content/uploads/fuvest2025_gabarito_primeira_fase.pdf", "fuvest2025_gabarito.pdf");
  const gabarito = {};
  for (const linha of pdfParaTexto(gab, true).split("\n")) {
    const m = linha.match(/^\s*(\d{1,2})\s+([A-E])\s+(\d{1,2})\s+([A-E])/);
    if (m) { gabarito[+m[1]] = m[2]; gabarito[+m[3]] = m[4]; }
  }
  const texto = pdfParaTexto(prova);
  const partes = texto.split(/\{(\d{2})\}/);
  const questoes = [];
  for (let i = 1; i < partes.length; i += 2) {
    const numero = +partes[i];
    const bloco = limparBloco(partes[i + 1]);
    if (!gabarito[numero]) continue;
    const r = extrairAlternativas(bloco, /(^|\s)\(([A-E])\)\s/g, "ABCDE");
    if (!r || r.enunciado.length < 60) continue;
    if (PALAVRAS_IMAGEM.test(normalizar(r.enunciado)) || textoAusente(r.enunciado)) continue;
    const todo = r.enunciado + " " + r.alternativas.map((a) => a[1]).join(" ");
    const disciplina = classificarDisciplina(todo, DISCIPLINAS_GERAIS) || "Interdisciplinar";
    const dif = dificuldadeInicial("FUVEST", disciplina, todo);
    questoes.push({
      vestibular: "FUVEST", disciplina, topico: classificarTopico(disciplina, todo),
      enunciado: r.enunciado, introducao: null, alternativas: r.alternativas,
      gabarito: gabarito[numero], ano: 2025, numero, dificuldade: dif, nivel: nivelDe(dif),
      fonte: `FUVEST 2025 - 1ª fase, Prova V1, questão ${numero} (gabarito oficial)`,
      url: "https://www.fuvest.br/wp-content/uploads/fuvest2025_primeira_fase_prova_V1.pdf",
    });
  }
  console.log(`FUVEST 2025: ${questoes.length} questões textuais aproveitadas`);
  return questoes;
}

// ---------------------------------------------------------------------
// UNICAMP (1ª fase, caderno Q) - 2025 e 2026
// ---------------------------------------------------------------------
async function importarUnicamp(ano, urlProva, urlGabarito, caderno) {
  const prova = await baixar(urlProva, `unicamp${ano}_prova.pdf`);
  const gab = await baixar(urlGabarito, `unicamp${ano}_gabarito.pdf`);
  const gabarito = {};
  for (const m of pdfParaTexto(gab, true).matchAll(/(\d{2})\s+([A-D*])/g)) if (m[2] !== "*") gabarito[+m[1]] = m[2];
  const texto = pdfParaTexto(prova);
  const partes = texto.split(/QUESTÃO (\d{1,2})\s*\n/);
  const questoes = [];
  let bloquearProxima = 0;
  for (let i = 1; i < partes.length; i += 2) {
    const numero = +partes[i];
    const bloco = limparBloco(partes[i + 1]);
    const compartilhado = bloco.match(/quest[õo]es\s+(\d+)\s+e\s+(\d+)/i);
    const pular = bloquearProxima >= numero;
    if (compartilhado) bloquearProxima = Math.max(bloquearProxima, +compartilhado[2]);
    if (pular || !gabarito[numero]) continue;
    const r = extrairAlternativas(bloco, /(^|\n)([a-d])\)\s/g, "ABCD");
    if (!r || r.enunciado.length < 60) continue;
    if (PALAVRAS_IMAGEM.test(normalizar(r.enunciado)) || textoAusente(r.enunciado)) continue;
    if (/[�]|\s{2}\d{3,}\s{2}/.test(r.enunciado)) continue;
    const todo = r.enunciado + " " + r.alternativas.map((a) => a[1]).join(" ");
    const disciplina = classificarDisciplina(todo, DISCIPLINAS_GERAIS) || "Interdisciplinar";
    const dif = dificuldadeInicial("UNICAMP", disciplina, todo);
    questoes.push({
      vestibular: "UNICAMP", disciplina, topico: classificarTopico(disciplina, todo),
      enunciado: r.enunciado, introducao: null, alternativas: r.alternativas,
      gabarito: gabarito[numero], ano, numero, dificuldade: dif, nivel: nivelDe(dif),
      fonte: `Unicamp ${ano} - 1ª fase, Prova ${caderno}, questão ${numero} (gabarito oficial Comvest)`,
      url: urlProva,
    });
  }
  console.log(`UNICAMP ${ano}: ${questoes.length} questões textuais aproveitadas`);
  return questoes;
}

// ---------------------------------------------------------------------
// Geração do SQL
// ---------------------------------------------------------------------
function gerarSql(questoes) {
  const linhas = [];
  linhas.push("-- =====================================================================");
  linhas.push("-- AproVest - Vestibulares, disciplinas, tópicos e QUESTÕES OFICIAIS");
  linhas.push(`-- Arquivo GERADO por database/scripts/importar-questoes.mjs em ${new Date().toISOString().slice(0, 10)}`);
  linhas.push("-- Fontes: INEP (ENEM 2017-2023 via enem.dev), FUVEST 2025 (fuvest.br), Comvest/Unicamp 2025.");
  linhas.push(`-- Total de questões: ${questoes.length}`);
  linhas.push("-- =====================================================================");
  linhas.push("USE aprovestdb;\nGO\nSET NOCOUNT ON;\nGO\n");
  linhas.push("INSERT INTO Vestibular (sigla, nome, organizadora, site_oficial, descricao) VALUES");
  linhas.push(VESTIBULARES.map((v) => `(${v.map(sql).join(", ")})`).join(",\n") + ";\n");
  linhas.push("INSERT INTO Disciplina (nome, area) VALUES");
  linhas.push(Object.entries(TAXONOMIA).map(([nome, d]) => `(${sql(nome)}, ${sql(d.area)})`).join(",\n") + ";\n");
  linhas.push("INSERT INTO Topico (nome, disciplina_id) VALUES");
  const tops = [];
  for (const [disc, d] of Object.entries(TAXONOMIA))
    for (const t of Object.keys(d.topicos))
      tops.push(`(${sql(t)}, (SELECT id FROM Disciplina WHERE nome = ${sql(disc)}))`);
  linhas.push(tops.join(",\n") + ";\nGO\n");

  questoes.forEach((q, i) => {
    if (i % 40 === 0) linhas.push("GO\nDECLARE @q BIGINT;");
    linhas.push(
      `INSERT INTO Questao (enunciado, introducao_alternativas, gabarito, dificuldade, nivel, ano, numero, origem, fonte_descricao, fonte_url, vestibular_id, disciplina_id) VALUES (` +
      [sql(q.enunciado), sql(q.introducao), sql(q.gabarito), q.dificuldade, sql(q.nivel), q.ano, q.numero, "'OFICIAL'", sql(q.fonte), sql(q.url),
        `(SELECT id FROM Vestibular WHERE sigla = '${q.vestibular}')`, `(SELECT id FROM Disciplina WHERE nome = ${sql(q.disciplina)})`].join(", ") + ");");
    linhas.push("SET @q = SCOPE_IDENTITY();");
    linhas.push("INSERT INTO Alternativa (letra, texto, questao_id) VALUES " + q.alternativas.map(([l, t]) => `('${l}', ${sql(t)}, @q)`).join(", ") + ";");
    linhas.push(`INSERT INTO QuestaoTopico (questao_id, topico_id) SELECT @q, t.id FROM Topico t JOIN Disciplina d ON d.id = t.disciplina_id WHERE d.nome = ${sql(q.disciplina)} AND t.nome = ${sql(q.topico)};`);
  });
  linhas.push("GO\nPRINT 'Questões oficiais importadas.';\nGO\n");
  return linhas.join("\n");
}

const todas = [
  ...(await importarEnem()),
  ...(await importarFuvest()),
  ...(await importarUnicamp(2025, "https://www.comvest.unicamp.br/vest2025/F1/f12025Q_Z.pdf", "https://www.comvest.unicamp.br/wp-content/uploads/2024/10/QZ_gabarito_2025_FINAL_site.pdf", "Q")),
  ...(await importarUnicamp(2026, "https://www.comvest.unicamp.br/vest2026/F1/f12026Q_X.pdf", "https://www.comvest.unicamp.br/wp-content/uploads/2025/10/Q_X-gabarito.pdf", "Q")),
];
fs.writeFileSync(SAIDA, gerarSql(todas), "utf8");
const porVest = todas.reduce((acc, q) => ((acc[q.vestibular] = (acc[q.vestibular] || 0) + 1), acc), {});
const porDisc = todas.reduce((acc, q) => ((acc[`${q.vestibular}/${q.disciplina}`] = (acc[`${q.vestibular}/${q.disciplina}`] || 0) + 1), acc), {});
console.log("Resumo por vestibular:", porVest);
console.log("Resumo por disciplina:", porDisc);
console.log(`Arquivo gerado: ${SAIDA}`);
