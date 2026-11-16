import TextoFormatado from "../TextoFormatado/TextoFormatado";
import styles from "./Questao.module.css";

/**
 * Exibe uma questão oficial com alternativas.
 * props: questao, selecionada, onSelecionar, bloqueada, gabarito (mostra correção), numero
 */
const Questao = ({ questao, selecionada, onSelecionar, bloqueada = false, gabarito = null, numero }) => {
  const estado = (letra) => {
    if (!gabarito) return selecionada === letra ? styles.selecionada : "";
    if (letra === gabarito) return styles.correta;
    if (letra === selecionada) return styles.errada;
    return styles.apagada;
  };

  return (
    <article className={styles.questao}>
      <div className={styles.meta}>
        {numero && <span className={styles.numero}>Questão {numero}</span>}
        <span className="av-selo av-selo-primario">{questao.disciplina}</span>
        {questao.topicos?.map((t) => <span key={t} className="av-selo">{t}</span>)}
        {questao.nivel && <span className="av-selo">{{ FACIL: "Fácil", MEDIO: "Médio", DIFICIL: "Difícil" }[questao.nivel]}</span>}
      </div>
      <TextoFormatado texto={questao.enunciado} />
      {questao.introducaoAlternativas && <TextoFormatado texto={questao.introducaoAlternativas} className={styles.introducao} />}
      <div className={styles.alternativas} role="radiogroup" aria-label="Alternativas">
        {questao.alternativas.map((a) => (
          <button key={a.letra} type="button" role="radio" aria-checked={selecionada === a.letra}
            className={`${styles.alternativa} ${estado(a.letra)}`} disabled={bloqueada} onClick={() => onSelecionar?.(a.letra)}>
            <span className={styles.letra}>{a.letra}</span>
            <span className={styles.textoAlt}>
              {a.texto}
              {a.imagem && <img src={a.imagem} alt={`Alternativa ${a.letra}`} className={styles.imagemAlt} />}
            </span>
            {gabarito && a.letra === gabarito && <i className="fa-solid fa-circle-check ms-auto text-success"></i>}
            {gabarito && a.letra === selecionada && a.letra !== gabarito && <i className="fa-solid fa-circle-xmark ms-auto text-danger"></i>}
          </button>
        ))}
      </div>
      {questao.fonte && (
        <p className={styles.fonte}>
          <i className="fa-solid fa-building-columns me-1"></i>Fonte oficial: {questao.fonte}
          {questao.fonteUrl && <> · <a href={questao.fonteUrl} target="_blank" rel="noreferrer">ver prova original</a></>}
        </p>
      )}
    </article>
  );
};

export default Questao;
