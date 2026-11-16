import { NavLink } from "react-router-dom";
import styles from "../Layout/Menu.module.css";

// Menu de navegação do Aluno (equivalente ao MenuFuncionario do projeto modelo)
export const LINKS_ALUNO = [
  { grupo: "Estudo" },
  { para: "/aluno", icone: "fa-gauge-high", texto: "Painel da Meta", fim: true },
  { para: "/aluno/diagnostico", icone: "fa-stethoscope", texto: "Diagnóstico" },
  { para: "/aluno/banca", icone: "fa-bolt", texto: "Banca diária" },
  { para: "/aluno/simulados", icone: "fa-stopwatch", texto: "Simulados" },
  { para: "/aluno/plano", icone: "fa-route", texto: "Plano de estudo" },
  { grupo: "Redação" },
  { para: "/aluno/redacoes", icone: "fa-pen-nib", texto: "Caderno de redações" },
  { para: "/aluno/avaliacoes", icone: "fa-clipboard-check", texto: "Avaliações" },
  { grupo: "Conteúdos" },
  { para: "/aluno/biblioteca", icone: "fa-book-open", texto: "Biblioteca" },
  { para: "/aluno/fontes-oficiais", icone: "fa-building-columns", texto: "Fontes oficiais" },
  { para: "/aluno/questoes-enem", icone: "fa-layer-group", texto: "Acervo ENEM" },
  { grupo: "Desempenho" },
  { para: "/aluno/historico", icone: "fa-clock-rotate-left", texto: "Histórico" },
  { para: "/aluno/ranking", icone: "fa-trophy", texto: "Ranking e bolsas" },
  { para: "/aluno/relatorio", icone: "fa-file-pdf", texto: "Relatório PDF" },
  { para: "/aluno/acessos", icone: "fa-crown", texto: "Plano e créditos" },
];

const MenuAluno = ({ aoNavegar }) => <ListaMenu links={LINKS_ALUNO} aoNavegar={aoNavegar} />;

export function ListaMenu({ links, aoNavegar }) {
  return (
    <nav aria-label="Menu principal">
      <ul className={styles.lista}>
        {links.map((l, i) =>
          l.grupo ? (
            <li key={`g${i}`} className={styles.grupo}>{l.grupo}</li>
          ) : (
            <li key={l.para}>
              <NavLink to={l.para} end={l.fim} onClick={aoNavegar}
                className={({ isActive }) => `${styles.link} ${isActive ? styles.ativo : ""}`}>
                <i className={`fa-solid ${l.icone}`}></i>
                <span>{l.texto}</span>
              </NavLink>
            </li>
          )
        )}
      </ul>
    </nav>
  );
}

export default MenuAluno;
