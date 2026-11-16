import { Fragment } from "react";
import styles from "./TextoFormatado.module.css";

// Renderiza textos com marcações simples (## títulos, - listas, **negrito** e imagens ![](url)).
// Usado nos enunciados oficiais e nos resumos da biblioteca sem interpretar HTML externo (segurança).
function formatarLinha(texto, chave) {
  const partes = [];
  const regex = /(\*\*[^*]+\*\*|!\[[^\]]*\]\([^)]+\))/g;
  let ultimo = 0;
  let m;
  while ((m = regex.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      partes.push(<strong key={`${chave}-${m.index}`}>{token.slice(2, -2)}</strong>);
    } else {
      const url = token.match(/\(([^)]+)\)/)[1];
      if (/^https:\/\//.test(url) && !url.includes("broken-image")) {
        partes.push(<img key={`${chave}-${m.index}`} src={url} alt="Imagem da questão oficial" className={styles.imagem} loading="lazy" />);
      }
    }
    ultimo = m.index + token.length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

const TextoFormatado = ({ texto, className = "" }) => {
  if (!texto) return null;
  const blocos = texto.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className={`${styles.texto} ${className}`}>
      {blocos.map((bloco, i) => {
        const linhas = bloco.split("\n");
        if (bloco.startsWith("## ")) return <h4 key={i} className={styles.subtitulo}>{bloco.slice(3)}</h4>;
        if (linhas.every((l) => l.trim().startsWith("- ") || l.trim() === "")) {
          return <ul key={i}>{linhas.filter((l) => l.trim()).map((l, j) => <li key={j}>{formatarLinha(l.trim().slice(2), `${i}-${j}`)}</li>)}</ul>;
        }
        if (linhas.every((l) => /^\d+\.\s/.test(l.trim()) || l.trim() === "")) {
          return <ol key={i}>{linhas.filter((l) => l.trim()).map((l, j) => <li key={j}>{formatarLinha(l.trim().replace(/^\d+\.\s/, ""), `${i}-${j}`)}</li>)}</ol>;
        }
        return (
          <p key={i}>
            {linhas.map((l, j) => (
              <Fragment key={j}>{formatarLinha(l, `${i}-${j}`)}{j < linhas.length - 1 && <br />}</Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

export default TextoFormatado;
