import { Link } from "react-router-dom";
import styles from "./Logo.module.css";

// Logotipo do AproVest. A prop "claro" deixa o texto branco (para fundos escuros).
const Logo = ({ claro = false, para = "/" }) => (
  <Link to={para} className={`${styles.logo} ${claro ? styles.claro : ""}`} aria-label="AproVest - página inicial">
    <span className={styles.marca}>
      <i className="fa-solid fa-graduation-cap"></i>
    </span>
    <span className={styles.texto}>
      Apro<strong>Vest</strong>
    </span>
  </Link>
);

export default Logo;
