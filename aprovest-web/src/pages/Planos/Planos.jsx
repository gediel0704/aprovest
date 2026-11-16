import { Link } from "react-router-dom";
import MenuPublico from "../../components/MenuPublico/MenuPublico";
import Rodape from "../../components/Rodape/Rodape";
import styles from "./Planos.module.css";

export const PLANOS = [
  {
    nome: "Gratuito", preco: "R$ 0", periodo: "para sempre", destaque: false,
    itens: ["20 questões por dia na banca adaptativa", "1 correção de redação por IA por mês", "Diagnóstico inicial completo",
      "1 simulado semanal e 1 mensal", "Biblioteca e fontes oficiais", "Ranking e bolsa por mérito"],
  },
  {
    nome: "Pro", preco: "R$ 29,90", periodo: "por mês", destaque: true,
    itens: ["Banca adaptativa sem limite diário", "30 correções de redação por IA por mês", "Simulados ilimitados com percentil",
      "Plano de estudo e relatório em PDF", "Todos os recursos do plano gratuito"],
  },
  {
    nome: "Créditos avulsos", preco: "R$ 9,90", periodo: "por crédito (5 por R$ 39,90)", destaque: false,
    itens: ["Correção humana por professor credenciado", "Devolutiva completa em até 72 horas", "Simulado extra no plano gratuito", "Sem mensalidade"],
  },
];

// Página pública de planos (modelo freemium descrito na justificativa do projeto)
function Planos() {
  return (
    <>
      <MenuPublico />
      <section className="container py-5">
        <div className="text-center mb-5">
          <span className="av-selo av-selo-primario mb-2">Planos</span>
          <h1>Estude de graça. Acelere quando quiser.</h1>
          <p className="text-suave">Modelo freemium: o essencial é gratuito para garantir o acesso de estudantes de baixa renda.</p>
        </div>
        <div className="row g-4 align-items-stretch">
          {PLANOS.map((p) => (
            <div className="col-lg-4" key={p.nome}>
              <div className={`av-card h-100 ${styles.plano} ${p.destaque ? styles.destaque : ""}`}>
                {p.destaque && <span className={styles.fita}>Mais escolhido</span>}
                <h2 className="h4">{p.nome}</h2>
                <div className={styles.preco}>{p.preco} <small>{p.periodo}</small></div>
                <ul>
                  {p.itens.map((i) => <li key={i}><i className="fa-solid fa-check"></i>{i}</li>)}
                </ul>
                <Link to="/cadastro" className={`btn w-100 mt-auto ${p.destaque ? "btn-gradiente" : "btn-suave"}`}>Começar</Link>
              </div>
            </div>
          ))}
        </div>
        <div className="row g-4 mt-4">
          <div className="col-md-6">
            <div className="av-card h-100">
              <h3 className="h5"><i className="fa-solid fa-award text-warning me-2"></i>Bolsa por mérito</h3>
              <p className="text-suave mb-0">Todo mês, os 100 alunos mais bem colocados no ranking ganham automaticamente 1 mês de Plano Pro.</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="av-card h-100">
              <h3 className="h5"><i className="fa-solid fa-school text-primary me-2"></i>Escolas e cursinhos (B2B)</h3>
              <p className="text-suave mb-0">Licenças para escolas e cursinhos populares acompanharem turmas com dados de desempenho. Fale com a equipe AproVest.</p>
            </div>
          </div>
        </div>
        <p className="text-center small text-suave mt-4">Ambiente acadêmico: os pagamentos são simulados para demonstração e nenhuma cobrança real é realizada.</p>
      </section>
      <Rodape />
    </>
  );
}

export default Planos;
