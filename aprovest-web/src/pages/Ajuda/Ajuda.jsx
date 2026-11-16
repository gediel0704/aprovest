import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PaginaInstitucional from "../../components/PaginaInstitucional/PaginaInstitucional";
import styles from "./Ajuda.module.css";

// Perguntas frequentes agrupadas por categoria (conteúdo fiel às regras de negócio implementadas)
export const PERGUNTAS = [
  { categoria: "Conta e acesso", pergunta: "O AproVest é gratuito?",
    resposta: "Sim. O plano gratuito inclui diagnóstico, banca diária de até 20 questões por dia, simulados semanal e mensal, biblioteca, fontes oficiais e 1 correção de redação por IA por mês. O Plano Pro amplia a banca para 200 questões por dia e a correção por IA para 30 por mês." },
  { categoria: "Conta e acesso", pergunta: "Como recupero minha senha?",
    resposta: "Na tela de login, clique em \"Esqueci minha senha\" e informe seu e-mail. O sistema gera um link válido por tempo limitado para cadastrar uma nova senha (nesta versão acadêmica, sem servidor de e-mail, o link aparece na própria tela). Após 5 tentativas de login erradas, a conta fica bloqueada por 15 minutos, por segurança." },
  { categoria: "Conta e acesso", pergunta: "Posso mudar de vestibular, curso ou universidade depois?",
    resposta: "Pode. Em \"Minha meta\" você escolhe de 1 a 3 vestibulares (ENEM, FUVEST e Unicamp), o curso e a universidade. A meta personaliza a banca, os simulados e o percentil." },
  { categoria: "Estudo", pergunta: "Como funciona a banca adaptativa?",
    resposta: "Cada questão e cada aluno têm uma nota de dificuldade/proficiência calculada pelo algoritmo Elo, baseado no modelo logístico da Teoria de Resposta ao Item. A banca prioriza seus tópicos mais fracos e escolhe questões um pouco acima do seu nível. Questões erradas voltam para revisão no dia seguinte; as certas, em 7 dias." },
  { categoria: "Estudo", pergunta: "De onde vêm as questões?",
    resposta: "Todas as questões são de provas oficiais: ENEM (INEP), FUVEST e Unicamp (Comvest), com a referência da prova e do gabarito oficial em cada uma." },
  { categoria: "Estudo", pergunta: "O que é o percentil do simulado?",
    resposta: "É a porcentagem de alunos com desempenho menor que o seu no mesmo simulado, comparando primeiro com quem mira o mesmo curso e universidade. Ele só é exibido quando há pelo menos 5 alunos comparáveis." },
  { categoria: "Redação", pergunta: "Como a IA corrige minha redação?",
    resposta: "A correção segue a grade oficial de cada banca: as 5 competências do ENEM (0 a 200 cada), os 4 quesitos com pesos da FUVEST e a grade de proposta, gênero, leitura e convenções da Unicamp. A nota é uma estimativa para treino, não a nota oficial." },
  { categoria: "Redação", pergunta: "Como peço uma correção humana?",
    resposta: "Na redação finalizada, clique em \"Correção humana (1 crédito)\". Um professor credenciado corrige na mesma grade oficial, com prazo registrado de 72 horas. Créditos podem ser comprados avulsos ou em pacote." },
  { categoria: "Privacidade", pergunta: "Como exporto ou excluo meus dados?",
    resposta: "Em Configurações, use \"Exportar meus dados\" para baixar um arquivo com suas informações ou \"Solicitar exclusão\" para pedir a anonimização da conta, conforme a LGPD." },
  { categoria: "Privacidade", pergunta: "Meus dados são vendidos ou compartilhados?",
    resposta: "Não. Os dados de estudo são usados apenas para personalizar sua preparação. Senhas são guardadas com hash BCrypt e o acesso usa tokens JWT. Veja a Política de Privacidade." },
];

// Central de Ajuda com pesquisa (página pública)
function Ajuda() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [aberta, setAberta] = useState(0);
  const categorias = ["Todas", ...new Set(PERGUNTAS.map((p) => p.categoria))];

  const resultado = useMemo(() => {
    const normalizar = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const termo = normalizar(busca.trim());
    return PERGUNTAS.filter((p) => (categoria === "Todas" || p.categoria === categoria) &&
      (!termo || normalizar(p.pergunta + " " + p.resposta).includes(termo)))
      // perguntas que citam o termo no título aparecem primeiro
      .sort((a, b) => (termo ? Number(normalizar(b.pergunta).includes(termo)) - Number(normalizar(a.pergunta).includes(termo)) : 0));
  }, [busca, categoria]);

  return (
    <PaginaInstitucional selo="Central de Ajuda" titulo="Como podemos ajudar?"
      subtitulo="Pesquise nas perguntas frequentes sobre conta, estudo, redação e privacidade.">
      <div className={`av-card mb-4 ${styles.pesquisa}`}>
        <i className="fa-solid fa-magnifying-glass"></i>
        <input type="search" className="form-control form-control-lg" placeholder="Pesquisar: percentil, redação, senha..." aria-label="Pesquisar na Central de Ajuda"
          value={busca} onChange={(e) => { setBusca(e.target.value); setAberta(0); }} />
      </div>
      <div className="d-flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Categorias">
        {categorias.map((c) => (
          <button key={c} type="button" className={`btn btn-sm ${categoria === c ? "btn-primary" : "btn-suave"}`} onClick={() => { setCategoria(c); setAberta(0); }}>{c}</button>
        ))}
      </div>
      <p className="text-suave small">{resultado.length} {resultado.length === 1 ? "resultado" : "resultados"}</p>
      {resultado.length ? (
        <div className="d-flex flex-column gap-3">
          {resultado.map((p, i) => (
            <div key={p.pergunta} className={`av-card ${styles.item}`}>
              <button type="button" className={styles.pergunta} aria-expanded={aberta === i} onClick={() => setAberta(aberta === i ? -1 : i)}>
                <span><small className="av-selo me-2">{p.categoria}</small>{p.pergunta}</span>
                <i className={`fa-solid ${aberta === i ? "fa-minus" : "fa-plus"}`}></i>
              </button>
              {aberta === i && <p className={styles.resposta}>{p.resposta}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="av-card text-center py-5">
          <i className="fa-solid fa-circle-question fa-2x text-suave mb-3"></i>
          <p className="mb-2">Nenhuma pergunta encontrada para "{busca}".</p>
          <Link to="/contato" className="btn btn-primary">Falar com a equipe</Link>
        </div>
      )}
    </PaginaInstitucional>
  );
}

export default Ajuda;
