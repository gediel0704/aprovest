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

const PILARES = [
  ["fa-bullseye", "Objetivo", "Desenvolver uma plataforma web que apoie candidatos ao ENEM, à FUVEST e à Unicamp com questões adaptativas, correção qualificada de redação e simulados com percentil real, ampliando a eficiência do estudo, reduzindo a ansiedade pré-prova e democratizando uma preparação de alto nível."],
  ["fa-scale-balanced", "Justificativa", "As plataformas atuais entregam o mesmo conteúdo para todos, corrigem redações de forma superficial ou cara e não mostram ao aluno se ele está perto da aprovação. O AproVest personaliza o estudo com dados, corrige a redação nos critérios oficiais de cada banca e mantém um plano gratuito para estudantes de baixa renda."],
  ["fa-flask", "Metodologia", "Algoritmo Elo (modelo logístico da Teoria de Resposta ao Item) para calibrar alunos e questões, repetição espaçada para revisão e grades oficiais de cada banca na correção de redação."],
  ["fa-building-columns", "Fontes oficiais", "Questões e gabaritos do INEP (ENEM), da FUVEST (USP) e da Comvest (Unicamp); critérios de correção e abordagens esperadas publicados pelas próprias bancas."],
];

const ODS = [
  { numero: 4, cor: "#C5192D", nome: "Educação de qualidade", fonte: "https://brasil.un.org/pt-br/sdgs/4",
    oficial: "Assegurar a educação inclusiva e equitativa e de qualidade, e promover oportunidades de aprendizagem ao longo da vida para todas e todos.",
    relacao: "Meta 4.3: igualdade de acesso à educação superior de qualidade. O AproVest prepara o aluno para o ingresso na universidade com conteúdo oficial e estudo personalizado." },
  { numero: 10, cor: "#DD1367", nome: "Redução das desigualdades", fonte: "https://brasil.un.org/pt-br/sdgs/10",
    oficial: "Reduzir a desigualdade dentro dos países e entre eles.",
    relacao: "O plano gratuito, as bolsas mensais por mérito (um mês de Plano Pro para os 100 melhores do ranking) e o acesso pelo celular aproximam a preparação de alto nível de quem não pode pagar um cursinho." },
];

// UC001 - Página pública "Sobre" (objetivo, justificativa e ODS)
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
          {PILARES.map(([icone, titulo, texto]) => (
            <div className="col-md-6" key={titulo}>
              <div className="av-card h-100">
                <div className="av-icone-circulo mb-3"><i className={`fa-solid ${icone}`}></i></div>
                <h2 className="h5">{titulo}</h2>
                <p className="text-suave mb-0">{texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-5" id="ods">
        <h2 className="h3 mb-2">Objetivos de Desenvolvimento Sustentável</h2>
        <p className="text-suave mb-4">O AproVest se relaciona com a Agenda 2030 da Organização das Nações Unidas (ONU).</p>
        <div className="row g-4">
          {ODS.map((o) => (
            <div className="col-md-6" key={o.numero}>
              <div className={`av-card h-100 ${styles.ods}`}>
                <div className={styles.odsNumero} style={{ background: o.cor }}><small>ODS</small>{o.numero}</div>
                <div>
                  <h3 className="h5 mb-1">{o.nome}</h3>
                  <p className="small text-suave fst-italic mb-2">{o.oficial}</p>
                  <p className="mb-2">{o.relacao}</p>
                  <a href={o.fonte} target="_blank" rel="noreferrer" className="small"><i className="fa-solid fa-arrow-up-right-from-square me-1"></i>Fonte: ONU Brasil</a>
                </div>
              </div>
            </div>
          ))}
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
