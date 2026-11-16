import styles from "./SeletorVestibular.module.css";

const OPCOES = [
  { sigla: "ENEM", nome: "ENEM", icone: "fa-building-columns" },
  { sigla: "FUVEST", nome: "FUVEST", icone: "fa-landmark" },
  { sigla: "UNICAMP", nome: "Unicamp", icone: "fa-university" },
];

// Abas para escolher o vestibular (banca). "opcoes" limita às siglas desejadas.
const SeletorVestibular = ({ valor, onChange, opcoes }) => {
  const lista = opcoes?.length ? OPCOES.filter((o) => opcoes.includes(o.sigla)) : OPCOES;
  return (
    <div className={styles.seletor} role="tablist" aria-label="Escolha o vestibular">
      {lista.map((o) => (
        <button key={o.sigla} role="tab" aria-selected={valor === o.sigla}
          className={`${styles.opcao} ${valor === o.sigla ? styles.ativa : ""}`} onClick={() => onChange(o.sigla)}>
          <i className={`fa-solid ${o.icone}`}></i> {o.nome}
        </button>
      ))}
    </div>
  );
};

export default SeletorVestibular;
