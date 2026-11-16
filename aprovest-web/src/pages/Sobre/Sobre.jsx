import MenuPublico from "../../components/MenuPublico/MenuPublico";
import Rodape from "../../components/Rodape/Rodape";
import styles from "./Sobre.module.css";

const EQUIPE = [
  ["Gediel França Terlesqui", "Fundador, Fullstack e Supervisor"],
  ["Isabella de Oliveira Celestino Almeida", "Fundadora, CMO e Front-End"],
  ["Livia Ivanira da Silveira Ponte", "Fundadora e DBA"],
  ["Nicole de Oliveira Justo", "Fundadora e ADM"],
  ["Vinicius Nunes Mendonça Gonçalves", "Fundador e Fullstack"],
];

const TECNOLOGIAS = [
  ["fa-brands fa-react", "React + Vite", "Front-end (JavaScript)"],
  ["fa-brands fa-bootstrap", "Bootstrap + CSS Modules", "Interface responsiva"],
  ["fa-brands fa-java", "Java 21 + Spring Boot", "API REST (back-end)"],
  ["fa-solid fa-database", "Microsoft SQL Server", "Banco de dados relacional"],
  ["fa-solid fa-shield-halved", "Spring Security + JWT", "Autenticação e BCrypt"],
  ["fa-solid fa-robot", "Claude (Anthropic)", "Correção de redação por IA"],
];

// UC001 - Página pública "Sobre"
function Sobre() {
  return (
    <>
      <MenuPublico />
      <header className={styles.topo}>
        <div className="container">
          <span className="av-selo av-selo-primario mb-3">Projeto de TCC · Técnico em Informática · Turma INF2CM</span>
          <h1>Sobre o AproVest</h1>
          <p>
            Como tornar a preparação para o vestibular mais eficiente, personalizada e mensurável utilizando inteligência artificial e ciência
            de dados aplicadas à educação? O AproVest nasceu dessa pergunta, na Fundação Instituto de Educação de Barueri (FIEB) -
            Unidade Brasílio Flores de Azevedo.
          </p>
        </div>
      </header>

      <section className="container py-5">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="av-card h-100">
              <div className="av-icone-circulo mb-3"><i className="fa-solid fa-bullseye"></i></div>
              <h2 className="h5">Objetivo</h2>
              <p className="text-suave mb-0">Apoiar candidatos com questões adaptativas, correção qualificada de redação e simulados com percentil real, reduzindo a ansiedade pré-prova e democratizando uma preparação de alto nível.</p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="av-card h-100">
              <div className="av-icone-circulo mb-3"><i className="fa-solid fa-flask"></i></div>
              <h2 className="h5">Metodologia</h2>
              <p className="text-suave mb-0">Algoritmo Elo (modelo logístico da Teoria de Resposta ao Item) para calibrar alunos e questões, repetição espaçada para revisão e grades oficiais de cada banca na correção de redação.</p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="av-card h-100">
              <div className="av-icone-circulo mb-3"><i className="fa-solid fa-building-columns"></i></div>
              <h2 className="h5">Fontes oficiais</h2>
              <p className="text-suave mb-0">Questões e gabaritos do INEP (ENEM), da FUVEST (USP) e da Comvest (Unicamp); critérios de correção e abordagens esperadas publicados pelas próprias bancas.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-5">
        <h2 className="h3 mb-4">Equipe</h2>
        <div className="row g-3">
          {EQUIPE.map(([nome, funcao]) => (
            <div className="col-sm-6 col-lg-4" key={nome}>
              <div className={`av-card ${styles.membro}`}>
                <span>{nome.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
                <div><strong>{nome}</strong><small>{funcao}</small></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-5">
        <h2 className="h3 mb-4">Tecnologias</h2>
        <div className="row g-3">
          {TECNOLOGIAS.map(([icone, nome, uso]) => (
            <div className="col-sm-6 col-lg-4" key={nome}>
              <div className={`av-card ${styles.tecnologia}`}>
                <i className={icone}></i>
                <div><strong>{nome}</strong><small>{uso}</small></div>
              </div>
            </div>
          ))}
        </div>
        <div className="alert alert-info mt-4 mb-0">
          <i className="fa-solid fa-circle-info me-2"></i>
          Notas, projeções e percentis exibidos pela plataforma são estimativas internas para treino. Não constituem nota oficial nem
          probabilidade de aprovação.
        </div>
      </section>
      <Rodape />
    </>
  );
}

export default Sobre;
