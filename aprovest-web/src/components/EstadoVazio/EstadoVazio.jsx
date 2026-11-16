import styles from "./EstadoVazio.module.css";

// Mensagem exibida quando uma lista não possui registros ("estado vazio" dos casos de uso)
const EstadoVazio = ({ icone = "fa-inbox", titulo, texto, children }) => (
  <div className={styles.vazio}>
    <div className={styles.icone}><i className={`fa-solid ${icone}`}></i></div>
    <h3 className={styles.titulo}>{titulo}</h3>
    {texto && <p className={styles.texto}>{texto}</p>}
    {children}
  </div>
);

export default EstadoVazio;
