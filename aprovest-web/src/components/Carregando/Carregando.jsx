import styles from "./Carregando.module.css";

const Carregando = ({ texto = "Carregando..." }) => (
  <div className={styles.carregando} role="status" aria-live="polite">
    <div className={styles.spinner}></div>
    <span>{texto}</span>
  </div>
);

export default Carregando;
