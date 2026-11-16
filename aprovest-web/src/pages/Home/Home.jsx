import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MenuPublico from "../../components/MenuPublico/MenuPublico";
import Rodape from "../../components/Rodape/Rodape";
import api from "../../services/api";
import styles from "./Home.module.css";

const RECURSOS = [
  { icone: "fa-bolt", titulo: "Banca adaptativa diária", texto: "Questões oficiais calibradas pelo algoritmo Elo (princípio da TRI): o nível se ajusta ao seu desempenho e prioriza seus pontos fracos." },
  { icone: "fa-pen-nib", titulo: "Correção de redação por IA", texto: "Feedback imediato nas competências oficiais de cada banca: 5 competências do ENEM, quesitos da FUVEST e grade da Unicamp." },
  { icone: "fa-user-check", titulo: "Corretor humano", texto: "Com créditos avulsos, um professor credenciado faz uma devolutiva completa em até 72 horas." },
  { icone: "fa-stopwatch", titulo: "Simulado preditivo", texto: "Simulados cronometrados com nota projetada na escala do vestibular e percentil entre quem mira o mesmo curso." },
  { icone: "fa-chart-line", titulo: "Painel da Meta", texto: "Proficiência por tópico, evolução, histórico de redações e recomendações de estudo em um só lugar." },
  { icone: "fa-rotate", titulo: "Repetição espaçada", texto: "O que você erra volta no momento certo para fixar o conteúdo de verdade." },
];

const PASSOS = [
  { n: "1", titulo: "Defina sua meta", texto: "Escolha curso, universidade e até 3 vestibulares (ENEM, FUVEST e Unicamp)." },
  { n: "2", titulo: "Faça o diagnóstico", texto: "30 questões oficiais calibram sua proficiência por disciplina e tópico." },
  { n: "3", titulo: "Estude todo dia", texto: "Banca adaptativa, redações corrigidas e materiais com base nas fontes oficiais." },
  { n: "4", titulo: "Meça sua evolução", texto: "Simulados semanais e mensais mostram sua projeção e seu percentil real." },
];

const PERGUNTAS = [
  ["As questões são oficiais?", "Sim. O banco reúne itens oficiais do ENEM (INEP), da FUVEST e da Unicamp (Comvest), cada um com a referência da prova e do gabarito oficial de origem."],
  ["A nota da IA é a nota oficial?", "Não. A correção segue as grades oficiais publicadas pelas bancas, mas é uma estimativa para treino. Para uma avaliação qualitativa, use a correção humana."],
  ["O que o plano gratuito inclui?", "20 questões por dia na banca adaptativa, 1 correção de redação por IA por mês, diagnóstico, biblioteca, fontes oficiais e simulados semanais."],
  ["Meus dados estão protegidos?", "Sim. As senhas são armazenadas com hash BCrypt, o acesso usa tokens JWT e você pode exportar ou solicitar a exclusão dos seus dados (LGPD)."],
];

function Home() {
  const [numeros, setNumeros] = useState(null);

  useEffect(() => {
    api.get("/publico/numeros").then((r) => setNumeros(r.data.data)).catch(() => {});
  }, []);

  return (
    <>
      <MenuPublico />

      {/* ---------- Herói ---------- */}
      <header className={styles.heroi}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className={styles.etiqueta}><i className="fa-solid fa-wand-magic-sparkles"></i> IA + ciência de dados aplicadas ao vestibular</span>
              <h1 className={styles.tituloHeroi}>
                Sua aprovação <span>guiada por dados</span>, não por achismo.
              </h1>
              <p className={styles.lead}>
                O AproVest combina banca adaptativa, correção de redação nas competências oficiais e simulados com percentil real
                para você estudar o que realmente falta para passar no ENEM, na FUVEST e na Unicamp.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/cadastro" className="btn btn-gradiente btn-lg">Começar grátis <i className="fa-solid fa-arrow-right ms-1"></i></Link>
                <a href="#como-funciona" className="btn btn-suave btn-lg">Como funciona</a>
              </div>
              <div className={styles.numeros}>
                <div><strong>{numeros ? numeros.questoesOficiais : "800+"}</strong><span>questões oficiais</span></div>
                <div><strong>{numeros ? numeros.temasOficiais : "15"}</strong><span>temas de redação oficiais</span></div>
                <div><strong>3</strong><span>vestibulares</span></div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className={styles.mockup} aria-hidden="true">
                <div className={styles.mockTopo}>
                  <span></span><span></span><span></span>
                  <small>Painel da Meta · Medicina USP</small>
                </div>
                <div className="row g-3">
                  <div className="col-6"><div className={styles.mockCard}><small>Projeção FUVEST</small><strong>68,4 <em>/90</em></strong><div className="av-progresso mt-2"><span style={{ width: "76%" }}></span></div></div></div>
                  <div className="col-6"><div className={styles.mockCard}><small>Percentil</small><strong>82º</strong><span className="av-selo av-selo-sucesso mt-2">+6 no mês</span></div></div>
                  <div className="col-12">
                    <div className={styles.mockCard}>
                      <small>Redação ENEM · 5 competências</small>
                      <div className={styles.barras}>
                        {[160, 200, 160, 180, 120].map((v, i) => (
                          <div key={i}><span style={{ height: `${v / 2.2}px` }}></span><em>C{i + 1}</em></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className={styles.mockFila}>
                      <i className="fa-solid fa-bolt"></i>
                      <div><strong>Banca de hoje pronta</strong><small>10 questões · foco em Estequiometria e Funções</small></div>
                      <span className="av-selo av-selo-primario">Iniciar</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Fontes oficiais ---------- */}
      <section className={styles.fontes}>
        <div className="container text-center">
          <p>Conteúdo didático baseado exclusivamente em fontes e organizações oficiais</p>
          <div className={styles.logosFontes}>
            <span><i className="fa-solid fa-building-columns"></i> INEP · ENEM</span>
            <span><i className="fa-solid fa-landmark"></i> FUVEST · USP</span>
            <span><i className="fa-solid fa-university"></i> Comvest · Unicamp</span>
          </div>
        </div>
      </section>

      {/* ---------- Problema ---------- */}
      <section className="container py-5">
        <div className="row g-4 align-items-center">
          <div className="col-lg-5">
            <h2 className={styles.tituloSecao}>O mesmo conteúdo para todos não funciona.</h2>
            <p className="text-suave">
              Plataformas tradicionais entregam a mesma videoaula para todo mundo, corrigem redações de forma superficial e não dizem se você
              está perto ou longe da aprovação. O AproVest foi criado para resolver exatamente esses três problemas.
            </p>
          </div>
          <div className="col-lg-7">
            <div className="row g-3">
              {[["fa-shuffle", "Falta de personalização", "Banca adaptativa por desempenho"], ["fa-file-pen", "Redação sem feedback de qualidade", "Correção híbrida IA + humana"], ["fa-bullseye", "Sem previsão de aprovação", "Simulado com percentil real"]].map(([ic, p, s]) => (
                <div className="col-md-4" key={p}>
                  <div className={`av-card h-100 ${styles.problema}`}>
                    <i className={`fa-solid ${ic}`}></i>
                    <small>Problema</small>
                    <strong>{p}</strong>
                    <small className="mt-2">Solução</small>
                    <span>{s}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Recursos ---------- */}
      <section id="recursos" className="container py-5">
        <div className="text-center mb-5">
          <span className="av-selo av-selo-primario mb-2">Recursos</span>
          <h2 className={styles.tituloSecao}>Tudo o que você precisa em uma única plataforma</h2>
        </div>
        <div className="row g-4">
          {RECURSOS.map((r) => (
            <div className="col-md-6 col-lg-4" key={r.titulo}>
              <div className="av-card av-card-hover h-100">
                <div className="av-icone-circulo mb-3"><i className={`fa-solid ${r.icone}`}></i></div>
                <h3 className="h5">{r.titulo}</h3>
                <p className="text-suave mb-0">{r.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Como funciona ---------- */}
      <section id="como-funciona" className={styles.comoFunciona}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className={styles.tituloSecao}>Como funciona</h2>
            <p className="text-suave">Em quatro passos você sai do achismo para um plano de estudos orientado por dados.</p>
          </div>
          <div className="row g-4">
            {PASSOS.map((p) => (
              <div className="col-md-6 col-lg-3" key={p.n}>
                <div className={styles.passo}>
                  <span>{p.n}</span>
                  <h3 className="h6">{p.titulo}</h3>
                  <p>{p.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Perguntas ---------- */}
      <section className="container py-5">
        <div className="row g-5">
          <div className="col-lg-4">
            <h2 className={styles.tituloSecao}>Perguntas frequentes</h2>
            <p className="text-suave">Transparência é parte do método: sabemos o que é estimativa e o que é oficial.</p>
          </div>
          <div className="col-lg-8">
            <div className="accordion" id="faq">
              {PERGUNTAS.map(([q, r], i) => (
                <div className={`accordion-item ${styles.faqItem}`} key={q}>
                  <h3 className="accordion-header">
                    <button className={`accordion-button ${i ? "collapsed" : ""}`} type="button" data-bs-toggle="collapse" data-bs-target={`#faq${i}`}>{q}</button>
                  </h3>
                  <div id={`faq${i}`} className={`accordion-collapse collapse ${i ? "" : "show"}`} data-bs-parent="#faq">
                    <div className="accordion-body text-suave">{r}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Chamada final ---------- */}
      <section className="container">
        <div className={`av-card av-card-gradiente ${styles.cta}`}>
          <div>
            <h2>Comece hoje. O diagnóstico é gratuito.</h2>
            <p>Crie sua conta em menos de um minuto e descubra exatamente onde investir suas horas de estudo.</p>
          </div>
          <Link to="/cadastro" className="btn btn-light btn-lg fw-bold">Criar minha conta</Link>
        </div>
      </section>

      <Rodape />
    </>
  );
}

export default Home;
