// =====================================================================
// AproVest - Gera o Dicionário de Dados e o DER (Mermaid) a partir do
// script 01_aprovest_banco.sql, garantindo que a documentação reflita
// exatamente o banco implementado no SQL Server.
// Uso: node database/scripts/gerar-dicionario.mjs
// Saídas: docs/DICIONARIO_DE_DADOS.md e docs/diagramas/der.mmd
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const sqlTexto = fs.readFileSync(path.join(RAIZ, "database", "01_aprovest_banco.sql"), "utf8");
fs.mkdirSync(path.join(RAIZ, "docs", "diagramas"), { recursive: true });

const tabelas = [];
const regexTabela = /CREATE TABLE (\w+) \(([\s\S]*?)\n\);/g;
let m;
while ((m = regexTabela.exec(sqlTexto)) !== null) {
  const nome = m[1];
  const corpo = m[2];
  // comentário de seção imediatamente anterior
  const antes = sqlTexto.slice(0, m.index).split("\n").reverse().find((l) => l.startsWith("-- ") && !l.startsWith("-- ---")) || "";
  const colunas = [];
  const fks = [];
  const uniques = [];
  for (let linha of corpo.split("\n")) {
    const comentario = (linha.match(/--\s*(.*)$/) || [])[1] || "";
    linha = linha.replace(/--.*$/, "").trim().replace(/,$/, "").replace(/\s+/g, " ");
    if (!linha) continue;
    const fk = linha.match(/CONSTRAINT (\w+) FOREIGN KEY \((\w+)\) REFERENCES (\w+) \((\w+)\)(.*)/);
    if (fk) { fks.push({ coluna: fk[2], tabela: fk[3], ref: fk[4], regra: fk[5].trim() }); continue; }
    const uk = linha.match(/CONSTRAINT (\w+) UNIQUE \(([^)]+)\)/);
    if (uk) { uniques.push(uk[2]); continue; }
    const pkComp = linha.match(/CONSTRAINT \w+ PRIMARY KEY \(([^)]+)\)/);
    if (pkComp) { pkComp[1].split(",").map((c) => c.trim()).forEach((c) => { const col = colunas.find((x) => x.nome === c); if (col) col.pk = true; }); continue; }
    if (linha.startsWith("CONSTRAINT")) continue;
    const c = linha.match(/^(\w+)\s+([A-Z][A-Z0-9]*(?:\([^)]*\))?)\s*(.*)$/);
    if (!c) continue;
    colunas.push({
      nome: c[1], tipo: c[2], pk: /PRIMARY KEY/.test(c[3]), nulo: !/NOT NULL/.test(c[3]),
      padrao: (c[3].match(/DEFAULT\s+([^\s,]+(?:\(\))?)/) || [])[1] || "", identity: /IDENTITY/.test(c[3]), descricao: comentario.replace(/\|/g, "/"),
    });
  }
  fks.forEach((f) => { const col = colunas.find((x) => x.nome === f.coluna); if (col) col.fk = `${f.tabela}(${f.ref})`; });
  tabelas.push({ nome, secao: antes.replace(/^--\s*/, ""), colunas, fks, uniques });
}

const DESCRICOES = {
  Usuario: "Usuários do sistema (herança em tabela única: ALUNO, CORRETOR e ADMIN).",
  tokens: "Tokens JWT emitidos no login (revogados no logout ou em novo login).",
  TokenRecuperacao: "Tokens de uso único para recuperação de senha (validade de 30 minutos).",
  Vestibular: "Vestibulares atendidos (ENEM, FUVEST e UNICAMP) e seus órgãos oficiais.",
  Disciplina: "Disciplinas e respectivas áreas do conhecimento.",
  Topico: "Tópicos de conteúdo de cada disciplina (RN04).",
  Questao: "Banco de questões oficiais e autorais com dificuldade calibrada (Elo).",
  Alternativa: "Alternativas de cada questão (4 na Unicamp, 5 no ENEM/FUVEST).",
  QuestaoTopico: "Associação N:N entre questões e tópicos (RN04: no mínimo um tópico).",
  SessaoEstudo: "Sessões de diagnóstico, banca diária e simulado.",
  SessaoQuestao: "Questões sorteadas para cada sessão, na ordem apresentada.",
  Resposta: "Respostas do aluno em cada sessão.",
  Proficiencia: "Proficiência (rating Elo) do aluno por tópico.",
  Revisao: "Agenda de repetição espaçada por aluno e questão (RF17).",
  TemaRedacao: "Temas/propostas de redação oficiais com a abordagem esperada pela banca.",
  Redacao: "Caderno de redações do aluno.",
  AvaliacaoRedacao: "Correções por IA ou humanas, com cópia (snapshot) do texto enviado.",
  NotaCriterio: "Nota por competência/quesito oficial de cada avaliação.",
  Assinatura: "Plano do aluno (FREE ou PRO) e vigência.",
  CarteiraCredito: "Saldo de créditos avulsos do aluno.",
  MovimentoCredito: "Extrato de entradas e consumos de créditos.",
  Pagamento: "Pagamentos do checkout de demonstração.",
  Notificacao: "Notificações internas (RF13).",
  Material: "Resumos internos e catálogo de fontes oficiais.",
  LeituraMaterial: "Progresso de leitura do aluno (UC015).",
  BolsaMerito: "Bolsas por mérito concedidas pelo ranking mensal (RF12).",
  SolicitacaoLgpd: "Solicitações do titular dos dados (LGPD).",
  ParecerConteudo: "Pareceres de professores sobre questões (UC029).",
  RemuneracaoCorretor: "Valores registrados por correção humana concluída (UC040).",
  EstadoIA: "Estado operacional do serviço de IA (pausado/ativo - UC042).",
};

let md = "# Dicionário de Dados - AproVest (Microsoft SQL Server)\n\n";
md += "Gerado automaticamente a partir de `database/01_aprovest_banco.sql`. Banco: `aprovestdb` · Collation `Latin1_General_100_CI_AI_SC_UTF8`.\n\n";
md += `Total de tabelas: **${tabelas.length}**.\n\n`;
md += "Legenda: PK = chave primária; FK = chave estrangeira; UK = restrição de unicidade; Nulo = aceita valor nulo.\n\n";
for (const t of tabelas) {
  md += `## ${t.nome}\n\n${DESCRICOES[t.nome] || ""}\n\n`;
  md += "| Coluna | Tipo | PK | FK (referência) | Nulo | Padrão | Descrição |\n|---|---|---|---|---|---|---|\n";
  for (const c of t.colunas) {
    md += `| ${c.nome} | ${c.tipo}${c.identity ? " IDENTITY" : ""} | ${c.pk ? "Sim" : ""} | ${c.fk || ""} | ${c.nulo ? "Sim" : "Não"} | ${c.padrao} | ${c.descricao} |\n`;
  }
  if (t.uniques.length) md += `\nUnicidade (UK): ${t.uniques.map((u) => `(${u})`).join(", ")}\n`;
  md += "\n";
}
fs.writeFileSync(path.join(RAIZ, "docs", "DICIONARIO_DE_DADOS.md"), md, "utf8");

// ---------- DER em Mermaid (erDiagram) ----------
const tipoMermaid = (t) => t.replace(/\(.*\)/, "").toLowerCase();

// Gera um DER (apenas PK/FK) com as tabelas indicadas; null = todas
function gerarDer(nomes) {
  const sel = nomes ? tabelas.filter((t) => nomes.includes(t.nome)) : tabelas;
  let er = "erDiagram\n";
  for (const t of sel) {
    er += `  ${t.nome} {\n`;
    // DER resumido: apenas chaves primárias e estrangeiras (os demais atributos estão no dicionário de dados)
    for (const c of t.colunas.filter((x) => x.pk || x.fk)) er += `    ${tipoMermaid(c.tipo)} ${c.nome}${c.pk ? " PK" : " FK"}\n`;
    er += "  }\n";
  }
  for (const t of sel) {
    for (const f of t.fks) {
      if (nomes && !nomes.includes(f.tabela)) continue;
      const unico = t.uniques.some((u) => u.trim() === f.coluna);
      er += `  ${f.tabela} ||--${unico ? "o|" : "o{"} ${t.nome} : "${f.coluna}"\n`;
    }
  }
  return er;
}
const MODULOS = {
  "der-1-usuarios-e-acesso": ["Usuario", "tokens", "TokenRecuperacao", "Assinatura", "CarteiraCredito", "MovimentoCredito", "Pagamento", "Notificacao", "SolicitacaoLgpd", "BolsaMerito"],
  "der-2-questoes-e-estudo": ["Usuario", "Vestibular", "Disciplina", "Topico", "Questao", "Alternativa", "QuestaoTopico", "SessaoEstudo", "SessaoQuestao", "Resposta", "Proficiencia", "Revisao"],
  "der-3-redacao-e-conteudo": ["Usuario", "Vestibular", "Disciplina", "Questao", "TemaRedacao", "Redacao", "AvaliacaoRedacao", "NotaCriterio", "RemuneracaoCorretor", "ParecerConteudo", "Material", "LeituraMaterial", "EstadoIA"],
};
fs.writeFileSync(path.join(RAIZ, "docs", "diagramas", "der.mmd"), gerarDer(null), "utf8");
for (const [nome, lista] of Object.entries(MODULOS)) fs.writeFileSync(path.join(RAIZ, "docs", "diagramas", `${nome}.mmd`), gerarDer(lista), "utf8");
console.log(`Tabelas: ${tabelas.length} | Relacionamentos: ${tabelas.reduce((s, t) => s + t.fks.length, 0)}`);
