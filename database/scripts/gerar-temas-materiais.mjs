// =====================================================================
// AproVest - Gera ../03_temas_e_materiais.sql
// Temas de redação OFICIAIS (INEP, FUVEST, Comvest) com a abordagem
// esperada publicada pelas próprias bancas + catálogo de fontes oficiais
// + resumos de estudo elaborados a partir das matrizes/programas oficiais.
// Uso: node database/scripts/gerar-temas-materiais.mjs
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fonte = (arq) => fs.readFileSync(path.join(RAIZ, "fontes", arq), "utf8").replace(/\f/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
const sql = (s) => (s === null || s === undefined ? "NULL" : "N'" + String(s).replace(/'/g, "''") + "'");

function trecho(texto, inicio, fim) {
  const i = texto.indexOf(inicio);
  if (i < 0) return texto;
  const j = fim ? texto.indexOf(fim, i + inicio.length) : -1;
  return texto.slice(i, j > 0 ? j : undefined).trim();
}

// ---------------------------------------------------------------------
// ENEM - temas oficiais (INEP). Comando padrão da prova de redação.
// ---------------------------------------------------------------------
const comandoEnem = (tema) =>
  `A partir da leitura dos textos motivadores e com base nos conhecimentos construídos ao longo de sua formação, redija texto dissertativo-argumentativo em modalidade escrita formal da língua portuguesa sobre o tema "${tema}", apresentando proposta de intervenção que respeite os direitos humanos. Selecione, organize e relacione, de forma coerente e coesa, argumentos e fatos para defesa de seu ponto de vista.`;
const expectativaEnem =
  "Critérios oficiais do INEP (Cartilha do Participante - A redação no Enem): C1 domínio da modalidade escrita formal; C2 compreensão da proposta e aplicação de conceitos de várias áreas dentro do tipo dissertativo-argumentativo, sem tangenciar o tema; C3 seleção, relação, organização e interpretação de informações em defesa de um ponto de vista (projeto de texto); C4 conhecimento dos mecanismos linguísticos para a argumentação (coesão); C5 proposta de intervenção detalhada (agente, ação, meio/modo, efeito e detalhamento) que respeite os direitos humanos. Cada competência vale de 0 a 200 pontos (níveis 0, 40, 80, 120, 160 e 200). Fuga total ao tema, texto com até 7 linhas, outro tipo textual ou desrespeito aos direitos humanos (no ENEM atual, este último zera apenas C5) levam a penalidades previstas na cartilha.";
const temasEnem = [
  [2024, "Desafios para a valorização da herança africana no Brasil"],
  [2023, "Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil"],
  [2022, "Desafios para a valorização de comunidades e povos tradicionais no Brasil"],
  [2021, "Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil"],
  [2020, "O estigma associado às doenças mentais na sociedade brasileira"],
  [2019, "Democratização do acesso ao cinema no Brasil"],
  [2018, "Manipulação do comportamento do usuário pelo controle de dados na internet"],
  [2017, "Desafios para a formação educacional de surdos no Brasil"],
];

// ---------------------------------------------------------------------
// FUVEST e UNICAMP - propostas e expectativas extraídas dos PDFs oficiais
// ---------------------------------------------------------------------
const fuv25 = fonte("fuvest2025_redacao_proposta_e_abordagem.txt");
const fuv26 = fonte("fuvest2026_redacao_abordagem_esperada.txt");
const uni25 = fonte("unicamp2025_redacao_expectativas_banca.txt");
const uni24 = fonte("unicamp2024_redacao_expectativas_banca.txt");

const temas = [];
for (const [ano, tema] of temasEnem) {
  temas.push({ vest: "ENEM", ano, titulo: tema, proposta: comandoEnem(tema), apoio: "Os textos motivadores oficiais estão no caderno de prova do INEP (link da fonte).", expectativa: expectativaEnem,
    genero: "Dissertativo-argumentativo", fonteDesc: `INEP - Prova de redação do ENEM ${ano}`, url: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos" });
}
temas.push({ vest: "FUVEST", ano: 2025, titulo: "As relações sociais por meio da solidariedade",
  proposta: "Considerando as ideias apresentadas nos textos e outras informações que julgar pertinentes, redija uma dissertação, na qual você exponha seu ponto de vista sobre o tema: As relações sociais por meio da solidariedade.",
  apoio: trecho(fuv25, "Texto 1", "Considerando as ideias"), expectativa: trecho(fuv25, "Com o tema apresentado"),
  genero: "Dissertativo-argumentativo", fonteDesc: "FUVEST 2025 - 2ª fase, Redação (Guia de respostas esperadas)", url: "https://www.fuvest.br/wp-content/uploads/fuvest_2025_guia_respostas.pdf" });
temas.push({ vest: "FUVEST", ano: 2026, titulo: "O perdão é um ato que pode ser condicionado ou limitado (Proposta 1)",
  proposta: "Redija um texto dissertativo-argumentativo, no qual seja exposto seu ponto de vista sobre o tema: O perdão é um ato que pode ser condicionado ou limitado.",
  apoio: "Coletânea oficial com 6 textos (Juliana de Albuquerque, Carla Madeira, Sophia de Mello Breyner Andresen, fotografia de cessar-fogo, Arlindo Cruz e Machado de Assis) disponível no caderno da FUVEST.",
  expectativa: fuv26, genero: "Dissertativo-argumentativo", fonteDesc: "FUVEST 2026 - 2ª fase, Dia 1, Redação (Abordagem esperada)", url: "https://www.fuvest.br/fuvest2026-fase2-dia1-abordagem-esperada-redacao.pdf" });
temas.push({ vest: "FUVEST", ano: 2026, titulo: "Carta a quem o(a) acusou falsamente: conceder ou não o perdão (Proposta 2)",
  proposta: "Redija uma carta a uma personagem hipotética que o(a) tenha acusado falsamente da prática de um ato moralmente reprovável, explicando as razões pelas quais você lhe concede ou não o perdão. Sua redação deve conter, necessariamente, as partes que compõem a estrutura de uma carta. ATENÇÃO: assine sua carta com o termo \"Nome\".",
  apoio: "Mesma coletânea oficial da Proposta 1 (caderno FUVEST 2026, 2ª fase, Dia 1).",
  expectativa: fuv26, genero: "Carta", fonteDesc: "FUVEST 2026 - 2ª fase, Dia 1, Redação (Abordagem esperada)", url: "https://www.fuvest.br/fuvest2026-fase2-dia1-prova.pdf" });
temas.push({ vest: "UNICAMP", ano: 2025, titulo: "Texto de apresentação de Projeto de Lei pela igualdade de gênero no Congresso (Proposta 1)",
  proposta: "Você é integrante de um coletivo que defende a igualdade de gênero. Após ler matérias sobre a aprovação de leis que afetam diretamente as mulheres, você constatou que tais leis são elaboradas por um Parlamento majoritariamente masculino. Então decidiu mobilizar suas/seus colegas do coletivo para articular, por meio de iniciativa popular, um Projeto de Lei (PL) que estabeleça igualdade de gêneros nas cadeiras do Congresso Nacional. Você ficou responsável por escrever o texto de apresentação desse PL, o qual será lido na Câmara dos Deputados. Em seu texto, você deve destacar: a) malefícios que a desigualdade de gênero no Parlamento tem gerado na sociedade brasileira; e b) argumentos que comprovam que uma representação política mais igualitária pode levar a um cenário de maior justiça social no país. Você deve, obrigatoriamente, apropriar-se de elementos da coletânea a seguir, demonstrando leitura crítica dela na elaboração de seu próprio texto.",
  apoio: "Coletânea oficial (AzMina/Jornal da USP, IBGE Censo 2022, composição da Câmara, experiência do México, PL 1904/24 e fala da deputada Soraya Santos) no caderno da Comvest.",
  expectativa: trecho(uni25, "REDAÇÃO", "PROPOSTA 2"), genero: "Texto de apresentação de Projeto de Lei", fonteDesc: "Vestibular Unicamp 2025 - 2ª fase, Redação, Proposta 1 (Expectativas da Banca)", url: "https://www.comvest.unicamp.br/vest2025/F2/provas/2025F2redporingcn.pdf" });
temas.push({ vest: "UNICAMP", ano: 2025, titulo: "Comunicado da direção escolar sobre apostas online (bets) entre alunos (Proposta 2)",
  proposta: "Você é diretor/a de uma escola pública e, ao circular pelos corredores dela, no intervalo entre as aulas, notou que os/as alunos/as do Ensino Fundamental estavam usando o celular para apostar dinheiro em um jogo de azar. Preocupado/a com a situação, você decidiu escrever um comunicado a ser enviado aos responsáveis por esses/as alunos/as, expressando as preocupações da instituição com esse novo hábito de crianças e pré-adolescentes. Em seu texto, você: a) explica de que forma essas apostas por celular podem prejudicar o comportamento dos alunos na escola; e b) alerta sobre os principais perigos a que crianças e pré-adolescentes estão sujeitos ao se envolverem com as bets. Você deve, obrigatoriamente, apropriar-se de elementos da coletânea a seguir, demonstrando leitura crítica dela na elaboração de seu próprio texto.",
  apoio: "Coletânea oficial (Instituto Alana, pesquisa Poder360, charge \"Alice no país das bets\", regulamentação das apostas e casos de endividamento) no caderno da Comvest.",
  expectativa: trecho(uni25, "PROPOSTA 2"), genero: "Comunicado", fonteDesc: "Vestibular Unicamp 2025 - 2ª fase, Redação, Proposta 2 (Expectativas da Banca)", url: "https://www.comvest.unicamp.br/vest2025/F2/provas/2025F2redporingcn.pdf" });
temas.push({ vest: "UNICAMP", ano: 2024, titulo: "Carta-denúncia ao Ministério Público do Trabalho sobre trabalho doméstico (Proposta 1)",
  proposta: "Você foi estudar para o vestibular na casa de um/a colega de classe em um final de semana. Lá, em meio a leituras e resolução de exercícios, você percebeu a presença de uma empregada doméstica trabalhando de dia e de noite. Intrigado/a, perguntou ao seu/sua colega a respeito da funcionária e foi surpreendido/a com a resposta de que ela morava em casa e era considerada parte da família. Não convencido/a, você decidiu denunciar aquela situação ao Ministério Público do Trabalho. Elabore uma carta-denúncia em cujo texto você: a) descreva uma situação testemunhada na casa de seu colega que pode ser considerada crime e b) argumente no sentido de defender os direitos daquela empregada doméstica. Você deve, obrigatoriamente, se apropriar de elementos da coletânea a seguir, demonstrando leitura crítica dela na elaboração de seu texto.",
  apoio: "Coletânea oficial sobre trabalho análogo à escravidão e direitos das trabalhadoras domésticas no caderno da Comvest.",
  expectativa: trecho(uni24, "PROPOSTA 1", "PROPOSTA 2"), genero: "Carta-denúncia", fonteDesc: "Vestibular Unicamp 2024 - 2ª fase, Redação, Proposta 1 (Expectativas da Banca)", url: "https://www.comvest.unicamp.br/vest2024/F2/provas/2024F2redporingcn.pdf" });
temas.push({ vest: "UNICAMP", ano: 2024, titulo: "Discurso no MONUEM em defesa do acolhimento a refugiados (Proposta 2)",
  proposta: "Sua escola participa do MONUEM (Modelo de Simulação da ONU para o Ensino Médio), projeto concebido pelo Ministério das Relações Exteriores, e que tem como objetivo realizar, nas escolas da rede pública de ensino de São Paulo, simulações de rodadas de negociação entre representantes das Nações Unidas. Cada delegado representa a posição de seu país na geopolítica. Você representa a delegação brasileira e, como tal, foi escolhido/a para responder, em plenário, ao discurso do delegado da Hungria, país contrário à política de acolhimento a refugiados. Elabore um discurso em resposta ao delegado húngaro em cujo texto você: a) rebata a posição política da Hungria; e b) defenda o acolhimento aos refugiados em apoio às boas práticas nas relações internacionais do Brasil. Você deve, obrigatoriamente, se apropriar de elementos da coletânea a seguir, demonstrando leitura crítica dela na elaboração de seu texto.",
  apoio: "Coletânea oficial sobre refúgio, asilo e política migratória no caderno da Comvest.",
  expectativa: trecho(uni24, "PROPOSTA 2"), genero: "Discurso", fonteDesc: "Vestibular Unicamp 2024 - 2ª fase, Redação, Proposta 2 (Expectativas da Banca)", url: "https://www.comvest.unicamp.br/vest2024/F2/provas/2024F2redporingcn.pdf" });

// ---------------------------------------------------------------------
// Catálogo de FONTES OFICIAIS (UC016) - links para os órgãos responsáveis
// ---------------------------------------------------------------------
const oficiais = [
  ["ENEM", null, "Provas e gabaritos do ENEM (todas as edições)", "Cadernos de prova, gabaritos e redações exemplares publicados pelo INEP.", "PROVA", "INEP", "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos", null],
  ["ENEM", null, "Matriz de Referência do ENEM", "Competências, habilidades e objetos de conhecimento cobrados em cada área do exame.", "MATRIZ", "INEP", "https://download.inep.gov.br/download/enem/matriz_referencia.pdf", null],
  ["ENEM", null, "A redação no Enem - Cartilha do Participante", "Documento oficial que explica as 5 competências e os níveis de pontuação da redação.", "GUIA_REDACAO", "INEP", "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/outros-documentos", null],
  ["ENEM", null, "Edital e informações oficiais do ENEM", "Página oficial do exame com edital, cronograma e documentos.", "EDITAL", "INEP", "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem", null],
  ["FUVEST", null, "FUVEST 2025 - 1ª fase (Prova V1)", "Caderno oficial de Conhecimentos Gerais com 90 questões.", "PROVA", "FUVEST", "https://www.fuvest.br/wp-content/uploads/fuvest2025_primeira_fase_prova_V1.pdf", 2025],
  ["FUVEST", null, "FUVEST 2025 - Gabarito oficial da 1ª fase", "Gabaritos das provas V1 a V4.", "GABARITO", "FUVEST", "https://www.fuvest.br/wp-content/uploads/fuvest2025_gabarito_primeira_fase.pdf", 2025],
  ["FUVEST", null, "FUVEST 2025 - Respostas esperadas da 2ª fase", "Guia oficial com as respostas esperadas e a abordagem da redação.", "GABARITO", "FUVEST", "https://www.fuvest.br/wp-content/uploads/fuvest_2025_guia_respostas.pdf", 2025],
  ["FUVEST", null, "FUVEST 2026 - Abordagem esperada da redação", "Explicação oficial da banca sobre as duas propostas de 2026.", "GUIA_REDACAO", "FUVEST", "https://www.fuvest.br/fuvest2026-fase2-dia1-abordagem-esperada-redacao.pdf", 2026],
  ["FUVEST", null, "Critérios de avaliação da redação FUVEST", "Quatro quesitos (tema/coletânea/autoria; tipo e gênero; coesão e coerência; norma escrita) com notas de 1 a 4 e pesos 3-2-3-2.", "GUIA_REDACAO", "FUVEST", "https://www.fuvest.br/wp-content/uploads/simulado2027-2edicao-redacao-criterio_pesos.pdf", 2027],
  ["FUVEST", null, "Guia de provas FUVEST 2027", "Estrutura das provas, conteúdos e orientações oficiais.", "EDITAL", "FUVEST", "https://www.fuvest.br/wp-content/uploads/fuvest2027-guia-provas.pdf", 2027],
  ["UNICAMP", null, "Unicamp 2025 - 1ª fase (Prova Q)", "Caderno oficial de Conhecimentos Gerais com 72 questões.", "PROVA", "Comvest/Unicamp", "https://www.comvest.unicamp.br/vest2025/F1/f12025Q_Z.pdf", 2025],
  ["UNICAMP", null, "Unicamp 2025 - Gabarito oficial (Provas Q e Z)", "Gabarito oficial publicado pela Comvest.", "GABARITO", "Comvest/Unicamp", "https://www.comvest.unicamp.br/wp-content/uploads/2024/10/QZ_gabarito_2025_FINAL_site.pdf", 2025],
  ["UNICAMP", null, "Unicamp 2026 - 1ª fase (Prova Q)", "Caderno oficial de Conhecimentos Gerais.", "PROVA", "Comvest/Unicamp", "https://www.comvest.unicamp.br/vest2026/F1/f12026Q_X.pdf", 2026],
  ["UNICAMP", null, "Unicamp 2026 - Gabarito oficial (Provas Q e X)", "Gabarito oficial publicado pela Comvest.", "GABARITO", "Comvest/Unicamp", "https://www.comvest.unicamp.br/wp-content/uploads/2025/10/Q_X-gabarito.pdf", 2026],
  ["UNICAMP", null, "Diretrizes de Avaliação da Redação - Unicamp", "Grade oficial: Proposta temática (0-2), Gênero (0-3), Leitura da coletânea (0-3) e Convenções da escrita e coesão (1-4).", "GUIA_REDACAO", "Comvest/Unicamp", "https://www.comvest.unicamp.br/wp-content/uploads/2025/05/Diretrizes-de-Avaliacao-da-Redacao-site.pdf", 2025],
  ["UNICAMP", null, "Unicamp 2025 - Expectativas da Banca (Redação)", "O que a banca esperava em cada proposta de 2025.", "GUIA_REDACAO", "Comvest/Unicamp", "https://www.comvest.unicamp.br/wp-content/uploads/2024/12/Expectativa-Banca_RED_FINAL.pdf", 2025],
  ["UNICAMP", null, "Manual e programa das provas - Vestibular Unicamp 2026", "Conteúdos programáticos e obras de leitura obrigatória.", "EDITAL", "Comvest/Unicamp", "https://www.comvest.unicamp.br/wp-content/uploads/2025/06/Manual-Programa_provas_VU2026.pdf", 2026],
  ["UNICAMP", null, "Vestibulares anteriores - Comvest", "Arquivo oficial com provas e documentos das edições anteriores.", "PROVA", "Comvest/Unicamp", "https://www.comvest.unicamp.br/base-de-dados-comvest/vestibulares/vestibulares-anteriores/", null],
];

// ---------------------------------------------------------------------
// Resumos de estudo (conteúdo interno AproVest, baseado nas matrizes)
// ---------------------------------------------------------------------
const resumos = JSON.parse(fs.readFileSync(path.join(RAIZ, "fontes", "resumos_estudo.json"), "utf8"));

const out = [];
out.push("-- =====================================================================");
out.push("-- AproVest - Temas de redação oficiais, fontes oficiais e resumos de estudo");
out.push("-- Arquivo GERADO por database/scripts/gerar-temas-materiais.mjs");
out.push("-- =====================================================================");
out.push("USE aprovestdb;\nGO\nSET NOCOUNT ON;\nGO\n");
for (const t of temas) {
  out.push(`INSERT INTO TemaRedacao (titulo, proposta, textos_apoio, expectativa_banca, genero, ano, origem, fonte_descricao, fonte_url, vestibular_id) VALUES (${[
    sql(t.titulo), sql(t.proposta), sql(t.apoio), sql(t.expectativa), sql(t.genero), t.ano, "'OFICIAL'", sql(t.fonteDesc), sql(t.url),
    `(SELECT id FROM Vestibular WHERE sigla = '${t.vest}')`].join(", ")});`);
}
out.push("GO\n");
for (const [vest, disc, titulo, resumo, tipo, orgao, url, ano] of oficiais) {
  out.push(`INSERT INTO Material (titulo, resumo, conteudo, tipo, oficial, fonte_orgao, fonte_url, ano, vestibular_id, disciplina_id) VALUES (${[
    sql(titulo), sql(resumo), "NULL", sql(tipo), 1, sql(orgao), sql(url), ano ?? "NULL",
    vest ? `(SELECT id FROM Vestibular WHERE sigla = '${vest}')` : "NULL", disc ? `(SELECT id FROM Disciplina WHERE nome = ${sql(disc)})` : "NULL"].join(", ")});`);
}
out.push("GO\n");
for (const r of resumos) {
  out.push(`INSERT INTO Material (titulo, resumo, conteudo, tipo, oficial, fonte_orgao, fonte_url, ano, vestibular_id, disciplina_id) VALUES (${[
    sql(r.titulo), sql(r.resumo), sql(r.conteudo), "'RESUMO'", 0, sql(r.base), sql(r.url), "NULL",
    r.vestibular ? `(SELECT id FROM Vestibular WHERE sigla = '${r.vestibular}')` : "NULL",
    r.disciplina ? `(SELECT id FROM Disciplina WHERE nome = ${sql(r.disciplina)})` : "NULL"].join(", ")});`);
}
out.push("GO\nINSERT INTO EstadoIA (pausado, motivo, atualizado_por) VALUES (0, NULL, 'instalação');\nGO\nPRINT 'Temas, materiais e estado da IA inseridos.';\nGO\n");
fs.writeFileSync(path.join(RAIZ, "03_temas_e_materiais.sql"), out.join("\n"), "utf8");
console.log(`Temas: ${temas.length} | Fontes oficiais: ${oficiais.length} | Resumos: ${resumos.length}`);
