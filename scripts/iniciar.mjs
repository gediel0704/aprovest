// =====================================================================
// AproVest - inicia o projeto inteiro com "npm run dev":
//   1. localiza o Java 21 (mesmo que o terminal tenha sido aberto antes da instalação)
//   2. confere se o SQL Server está acessível na porta 1433
//   3. na primeira vez, pede a senha do usuário sa e grava em application-local.properties
//   4. sobe a API (Spring Boot); se o banco aprovestdb não existir, a API o cria com os scripts
//   5. sobe o site (Vite) e abre o navegador quando tudo estiver pronto
// Não precisa de dependências: usa só módulos nativos do Node.js.
// =====================================================================
import { spawn, spawnSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = path.join(RAIZ, "aprovest-api");
const WEB = path.join(RAIZ, "aprovest-web");
const LOCAL = path.join(API, "src", "main", "resources", "application-local.properties");
const WINDOWS = process.platform === "win32";
const PORTA_API = 8080, PORTA_WEB = 5173;
const URL_API = `http://localhost:${PORTA_API}/api/v1/index`;
const URL_SITE = `http://localhost:${PORTA_WEB}`;

const cor = (c, t) => (process.stdout.isTTY ? `\x1b[${c}m${t}\x1b[0m` : t);
const info = (t) => console.log(cor("36", "[aprovest] ") + t);
const erro = (t) => console.log(cor("31", "[aprovest] ") + t);
const sair = (t) => { erro(t); process.exit(1); };

// ---------- 1. Java 21 ----------
function versaoJava(javaHome) {
  const bin = path.join(javaHome, "bin", WINDOWS ? "java.exe" : "java");
  if (!fs.existsSync(bin)) return 0;
  const r = spawnSync(bin, ["-version"], { encoding: "utf8" }); // "java -version" escreve no stderr
  return Number(`${r.stdout || ""}${r.stderr || ""}`.match(/version "(\d+)/)?.[1] || 0);
}
function variavelDoSistema(nome) {
  // No Windows, lê o valor atual do registro (útil quando o terminal foi aberto antes da instalação)
  if (!WINDOWS) return null;
  for (const escopo of ["HKCU\\Environment", "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment"]) {
    try {
      const s = execFileSync("reg", ["query", escopo, "/v", nome], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      const m = s.match(new RegExp(`${nome}\\s+REG_(?:EXPAND_)?SZ\\s+(.+)`));
      if (m) return m[1].trim();
    } catch { /* não definida nesse escopo */ }
  }
  return null;
}
function localizarJava() {
  const candidatos = [process.env.JAVA_HOME, variavelDoSistema("JAVA_HOME")];
  if (WINDOWS) {
    for (const base of ["C:\\Program Files\\Microsoft", "C:\\Program Files\\Eclipse Adoptium", "C:\\Program Files\\Java", "C:\\Program Files\\Amazon Corretto", "C:\\Program Files\\Zulu"]) {
      if (!fs.existsSync(base)) continue;
      for (const d of fs.readdirSync(base).filter((n) => /jdk-?2[1-9]|zulu-?2[1-9]|jdk2[1-9]/i.test(n)).sort().reverse()) candidatos.push(path.join(base, d));
    }
  } else {
    candidatos.push("/usr/lib/jvm/java-21-openjdk-amd64", "/usr/lib/jvm/java-21-openjdk", "/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home");
  }
  for (const c of candidatos.filter(Boolean)) {
    const home = c.replace(/[\\/]+$/, "").replace(/[\\/]bin$/i, "");
    if (versaoJava(home) >= 21) return home;
  }
  return null;
}

// ---------- utilidades de rede ----------
const portaAberta = (porta) => new Promise((ok) => {
  const s = net.connect({ port: porta, host: "127.0.0.1" });
  s.setTimeout(1500);
  s.once("connect", () => { s.destroy(); ok(true); });
  s.once("error", () => ok(false));
  s.once("timeout", () => { s.destroy(); ok(false); });
});
async function apiNoAr() {
  try { const r = await fetch(URL_API); const j = await r.json(); return String(j?.data?.aplicacao || "").includes("AproVest"); } catch { return false; }
}
const pergunta = (texto, oculta = false) => new Promise((ok) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (oculta) rl._writeToOutput = (s) => { if (s.includes(texto)) rl.output.write(s); else rl.output.write("*".repeat(s.length ? 1 : 0)); };
  rl.question(texto, (r) => { rl.close(); if (oculta) process.stdout.write("\n"); ok(r); });
});

// ---------- processos filhos ----------
const filhos = [];
const ultimas = { api: [], web: [] };
// No Windows, os arquivos .cmd (mvnw.cmd, npx) precisam do cmd.exe; chamá-lo explicitamente evita shell: true
function executar(comando, args, opcoes) {
  return WINDOWS
    ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", [comando, ...args].join(" ")], { ...opcoes, windowsVerbatimArguments: true })
    : spawn(comando, args, opcoes);
}
function iniciar(nome, comando, args, cwd, env, filtro) {
  const p = executar(comando, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
  filhos.push(p);
  const prefixo = cor(nome === "api" ? "35" : "32", `[${nome}] `);
  const linhas = (buf) => buf.toString().split(/\r?\n/).filter((l) => l.trim()).forEach((l) => {
    ultimas[nome].push(l);
    if (ultimas[nome].length > 40) ultimas[nome].shift();
    if (!filtro || filtro(l)) console.log(prefixo + l);
  });
  p.stdout.on("data", linhas);
  p.stderr.on("data", linhas);
  return p;
}
function encerrar() {
  for (const p of filhos) {
    if (p.exitCode !== null) continue;
    try { WINDOWS ? execFileSync("taskkill", ["/pid", String(p.pid), "/T", "/F"], { stdio: "ignore" }) : p.kill("SIGTERM"); } catch { /* já encerrado */ }
  }
}
process.on("SIGINT", () => { info("Encerrando API e site..."); encerrar(); process.exit(0); });
process.on("exit", encerrar);

// ============================== execução ==============================
const apenasSite = process.argv.includes("--so-site");
info("Iniciando o AproVest...");

let envApi = { ...process.env };
let apiJaRodando = await apiNoAr();

if (!apenasSite && !apiJaRodando) {
  // 1. Java
  const java = localizarJava();
  if (!java) sair("Java 21 não encontrado. Instale com:  winget install Microsoft.OpenJDK.21  (depois feche e abra o terminal).");
  envApi.JAVA_HOME = java;
  // no Windows a variável se chama "Path"; usar a mesma chave evita duas variáveis de caminho no processo filho
  const chavePath = Object.keys(envApi).find((k) => k.toUpperCase() === "PATH") || "PATH";
  envApi[chavePath] = path.join(java, "bin") + path.delimiter + (envApi[chavePath] || "");
  info(`Java: ${java}`);

  // 2. SQL Server
  if (!(await portaAberta(1433))) {
    sair("SQL Server não respondeu na porta 1433. Verifique se o serviço está iniciado e se o TCP/IP está habilitado (veja database/configurar-sqlserver.ps1).");
  }

  // 3. Senha do banco
  if (!envApi.APROVEST_DB_PASSWORD && !fs.existsSync(LOCAL)) {
    info("Primeira execução: informe a senha do usuário 'sa' do SQL Server.");
    const senha = (await pergunta("Senha do sa: ", true)).trim();
    if (!senha) sair("Senha não informada.");
    fs.writeFileSync(LOCAL, `# Configuração local (NÃO versionar). Criado pelo npm run dev.\nspring.datasource.password=${senha}\n`, "utf8");
    info("Senha salva em aprovest-api/src/main/resources/application-local.properties (arquivo fora do Git).");
  }

  // 4. Porta 8080 ocupada por outro programa?
  if (await portaAberta(PORTA_API)) sair(`A porta ${PORTA_API} está ocupada por outro programa. Feche-o e rode "npm run dev" de novo.`);

  info("Subindo a API (a primeira execução baixa as dependências e pode levar alguns minutos)...");
  // caminho completo: alguns Windows não procuram executáveis na pasta atual (NoDefaultCurrentDirectoryInExePath)
  const mvnw = WINDOWS ? `"${path.join(API, "mvnw.cmd")}"` : "./mvnw";
  // mostra só o essencial (diferencia maiúsculas: o Spring escreve "[aprovest]" em todas as linhas de log)
  const filtroApi = (l) => /\[AproVest\]|ERROR|Exception|Caused by|Started AprovestApplication|APPLICATION FAILED|Login failed|BUILD FAILURE|Downloading from central|Port \d+ was already/.test(l)
    && !/Downloaded from| WARN /.test(l);
  let avisouDownload = false;
  const api = iniciar("api", mvnw, ["-q", "spring-boot:run"], API, envApi, (l) => {
    if (/Downloading from central/.test(l)) { if (!avisouDownload) { avisouDownload = true; return true; } return false; }
    return filtroApi(l);
  });
  api.on("exit", (codigo) => {
    if (!codigo) return;
    erro(`A API foi encerrada (código ${codigo}). Últimas mensagens:`);
    ultimas.api.slice(-25).forEach((l) => console.log(cor("35", "[api] ") + l));
  });
} else if (apiJaRodando) {
  info("A API já está rodando na porta 8080; ela será reaproveitada.");
}

// 5. Site
if (!fs.existsSync(path.join(WEB, "node_modules"))) {
  info("Instalando as dependências do site (npm install)...");
  await new Promise((ok, falha) => executar("npm", ["install", "--no-audit", "--no-fund"], { cwd: WEB, stdio: "inherit" })
    .on("exit", (c) => (c ? falha(new Error("npm install falhou")) : ok())));
}
if (await portaAberta(PORTA_WEB)) {
  info(`O site já está rodando em ${URL_SITE}.`);
} else {
  iniciar("web", "npx", ["vite", "--port", String(PORTA_WEB), "--strictPort"], WEB, process.env);
}

// Aguarda a API ficar pronta
if (!apenasSite) {
  const inicio = Date.now();
  while (!(await apiNoAr())) {
    if (Date.now() - inicio > 10 * 60_000) sair("A API não respondeu em 10 minutos. Veja as mensagens acima.");
    if (filhos[0] && filhos[0].exitCode !== null) sair("A API não conseguiu iniciar. Veja as mensagens acima.");
    await new Promise((r) => setTimeout(r, 2000));
  }
}
console.log("");
info(cor("1", `Tudo pronto! Acesse ${URL_SITE}`));
info("Contas de teste: aluno@aprovest.com.br, admin@aprovest.com.br e corretor@aprovest.com.br (senha padrão no README).");
info("Para encerrar, pressione Ctrl+C.");
if (!process.env.APROVEST_NAO_ABRIR) {
  try { WINDOWS ? spawn("cmd", ["/c", "start", "", URL_SITE], { stdio: "ignore", detached: true }) : spawn(process.platform === "darwin" ? "open" : "xdg-open", [URL_SITE], { stdio: "ignore", detached: true }); } catch { /* sem navegador */ }
}
