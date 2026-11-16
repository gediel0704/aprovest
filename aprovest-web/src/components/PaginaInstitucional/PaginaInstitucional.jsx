import MenuPublico from "../MenuPublico/MenuPublico";
import Rodape from "../Rodape/Rodape";
import styles from "./PaginaInstitucional.module.css";

// Estrutura comum das páginas públicas do site (Fale Conosco, Ajuda, Privacidade, Termos)
const PaginaInstitucional = ({ selo, titulo, subtitulo, children }) => (
  <>
    <MenuPublico />
    <header className={styles.topo}>
      <div className="container">
        {selo && <span className="av-selo av-selo-primario mb-3">{selo}</span>}
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
    </header>
    <main className="container pb-5">{children}</main>
    <Rodape />
  </>
);

export default PaginaInstitucional;
