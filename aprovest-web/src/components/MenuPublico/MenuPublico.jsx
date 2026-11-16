import { Link, NavLink } from "react-router-dom";
import { useAuth, rotaInicial } from "../../contexts/AuthContext";
import Logo from "../Logo/Logo";
import styles from "./MenuPublico.module.css";

// Barra de navegação das páginas públicas (navbar Bootstrap com botão hambúrguer, como no projeto modelo)
const MenuPublico = () => {
  const { usuario, alternarTemaLocal } = useAuth();
  const tema = document.documentElement.getAttribute("data-tema");

  return (
    <nav className={`navbar navbar-expand-lg ${styles.navbar}`}>
      <div className="container">
        <Logo />
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPublico"
          aria-controls="menuPublico" aria-expanded="false" aria-label="Abrir menu de navegação">
          <i className="fa-solid fa-bars"></i>
        </button>
        <div className="collapse navbar-collapse" id="menuPublico">
          <ul className="navbar-nav mx-auto gap-lg-2">
            <li className="nav-item"><NavLink className={`nav-link ${styles.link}`} to="/" end>Início</NavLink></li>
            <li className="nav-item"><a className={`nav-link ${styles.link}`} href="/#recursos">Recursos</a></li>
            <li className="nav-item"><NavLink className={`nav-link ${styles.link}`} to="/planos">Planos</NavLink></li>
            <li className="nav-item"><NavLink className={`nav-link ${styles.link}`} to="/sobre">Sobre</NavLink></li>
          </ul>
          <div className="d-flex gap-2 align-items-center mt-3 mt-lg-0">
            <button className="btn btn-suave" onClick={() => alternarTemaLocal(tema === "escuro" ? "claro" : "escuro")} aria-label="Alternar tema">
              <i className={`fa-solid ${tema === "escuro" ? "fa-sun" : "fa-moon"}`}></i>
            </button>
            {usuario ? (
              <Link to={rotaInicial(usuario)} className="btn btn-gradiente">Ir para minha área</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-suave">Entrar</Link>
                <Link to="/cadastro" className="btn btn-gradiente">Criar conta grátis</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MenuPublico;
