import styles from "./CartaoEstatistica.module.css";

const CartaoEstatistica = ({ icone, rotulo, valor, detalhe, cor = "primaria" }) => (
  <div className={`av-card ${styles.cartao}`}>
    <div className={`${styles.icone} ${styles[cor]}`}><i className={`fa-solid ${icone}`}></i></div>
    <div className={styles.corpo}>
      <div className={styles.rotulo}>{rotulo}</div>
      <div className={styles.valor}>{valor}</div>
      {detalhe && <div className={styles.detalhe}>{detalhe}</div>}
    </div>
  </div>
);

export default CartaoEstatistica;
