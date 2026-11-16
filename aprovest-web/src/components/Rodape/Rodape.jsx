import { Link } from "react-router-dom";
import Logo from "../Logo/Logo";
import styles from "./Rodape.module.css";

const Rodape = () => (
  <footer className={styles.rodape}>
    <div className="container">
      <div className="row g-4">
        <div className="col-lg-5">
          <Logo claro />
          <p className={styles.descricao}>
            Preparação para ENEM, FUVEST e Unicamp com banca adaptativa, correção de redação nas competências oficiais
            e simulados com percentil real. Projeto de TCC do Curso Técnico em Informática - FIEB / ITB Brasílio Flores de Azevedo.
          </p>
        </div>
        <div className="col-6 col-lg-2">
          <h6>Plataforma</h6>
          <Link to="/planos">Planos</Link>
          <Link to="/sobre">Sobre o projeto</Link>
          <Link to="/cadastro">Criar conta</Link>
        </div>
        <div className="col-6 col-lg-2">
          <h6>Fontes oficiais</h6>
          <a href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem" target="_blank" rel="noreferrer">INEP / ENEM</a>
          <a href="https://www.fuvest.br" target="_blank" rel="noreferrer">FUVEST</a>
          <a href="https://www.comvest.unicamp.br" target="_blank" rel="noreferrer">Comvest / Unicamp</a>
        </div>
        <div className="col-lg-3">
          <h6>Privacidade</h6>
          <p className={styles.descricao}>Seus dados são tratados conforme a LGPD (Lei nº 13.709/2018). Você pode exportá-los ou pedir a exclusão a qualquer momento.</p>
        </div>
      </div>
      <div className={styles.base}>© {new Date().getFullYear()} AproVest · INF2CM · Notas e percentis são estimativas de treino, não resultados oficiais.</div>
    </div>
  </footer>
);

export default Rodape;
