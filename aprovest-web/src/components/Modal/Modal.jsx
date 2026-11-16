import styles from "./Modal.module.css";

// props: (propriedades) são parâmetros que o componente pai envia para o componente filho.
// isOpen: controla a exibição | onClose: fecha | onConfirm: confirma a ação
const Modal = ({ isOpen, onClose, onConfirm, titulo = "Confirmar ação", mensagem = "Tem certeza que deseja continuar?",
  textoConfirmar = "Confirmar", perigo = false, children, semBotoes = false, largo = false, carregando = false }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={titulo}>
      <div className={`${styles.modalContent} ${largo ? styles.largo : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{titulo}</h3>
          <button className={styles.fechar} onClick={onClose} aria-label="Fechar"><i className="fa-solid fa-xmark"></i></button>
        </div>
        {children ? children : <p className={styles.mensagem}>{mensagem}</p>}
        {!semBotoes && (
          <div className={styles.modalButtons}>
            <button className="btn btn-suave" onClick={onClose}>Cancelar</button>
            <button className={`btn ${perigo ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={carregando}>
              {carregando && <span className="spinner-border spinner-border-sm me-2"></span>}
              {textoConfirmar}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
