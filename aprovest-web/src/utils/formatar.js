// Funções utilitárias de formatação (datas, números e textos)
export const formatarData = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "-");

export const formatarDataHora = (iso) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-";

export const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatarNumero = (valor, casas = 0) =>
  valor === null || valor === undefined || valor === ""
    ? "-"
    : Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: casas, minimumFractionDigits: casas });

export const iniciais = (nome = "") =>
  nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");

export const formatarTempo = (segundos) => {
  if (segundos === null || segundos === undefined) return "--:--";
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return (h ? `${h}:` : "") + `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

export const NOMES_VESTIBULARES = { ENEM: "ENEM", FUVEST: "FUVEST", UNICAMP: "Unicamp" };

export const STATUS_AVALIACAO = {
  PROCESSANDO: { texto: "Corrigindo...", classe: "av-selo-info", icone: "fa-spinner fa-spin" },
  PENDENTE: { texto: "Aguardando corretor", classe: "av-selo-alerta", icone: "fa-hourglass-half" },
  ATRIBUIDA: { texto: "Em correção", classe: "av-selo-primario", icone: "fa-user-pen" },
  CONCLUIDA: { texto: "Concluída", classe: "av-selo-sucesso", icone: "fa-circle-check" },
  ERRO: { texto: "Erro", classe: "av-selo-perigo", icone: "fa-triangle-exclamation" },
};

/** Primeiro vestibular-alvo do aluno (ou ENEM). */
export const vestibularPadrao = (usuario) => usuario?.vestibularesAlvo?.[0] || "ENEM";
