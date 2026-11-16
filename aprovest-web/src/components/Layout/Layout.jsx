import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../Logo/Logo";
import MenuAluno from "../MenuAluno/MenuAluno";
import MenuCorretor from "../MenuCorretor/MenuCorretor";
import MenuAdmin from "../MenuAdmin/MenuAdmin";
import CredentialUser from "../CredentialUser/CredentialUser";
import styles from "./Layout.module.css";

// Estrutura padrão das páginas logadas: menu lateral (por papel) + cabeçalho com título.
const Layout = ({ title, subtitulo, children, acoes }) => {
  const { usuario } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const fechar = () => setMenuAberto(false);

  const Menu = usuario?.tipo === "ADMIN" ? MenuAdmin : usuario?.tipo === "CORRETOR" ? MenuCorretor : MenuAluno;
  const inicio = usuario?.tipo === "ADMIN" ? "/admin" : usuario?.tipo === "CORRETOR" ? "/corretor" : "/aluno";

  return (
    <div className={styles.app}>
      <a href="#conteudo" className="pular-conteudo">Pular para o conteúdo</a>
      <aside className={`${styles.sidebar} ${menuAberto ? styles.aberto : ""} nao-imprimir`}>
        <div className={styles.topoSidebar}>
          <Logo para={inicio} />
          <button className={styles.fechar} onClick={fechar} aria-label="Fechar menu"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className={styles.menu}>
          <Menu aoNavegar={fechar} />
        </div>
        {usuario?.tipo === "ALUNO" && !usuario?.pro && (
          <div className={styles.promo}>
            <i className="fa-solid fa-crown"></i>
            <strong>Plano Pro</strong>
            <span>Banca ilimitada e 30 correções por IA ao mês.</span>
            <Link to="/aluno/acessos" onClick={fechar} className="btn btn-sm btn-light w-100 mt-2">Conhecer</Link>
          </div>
        )}
      </aside>
      {menuAberto && <div className={styles.sombra} onClick={fechar}></div>}
      <main className={styles.principal} id="conteudo">
        <div className={styles.conteudo}>
          <CredentialUser title={title} subtitulo={subtitulo} aoAbrirMenu={() => setMenuAberto(true)} />
          {acoes && <div className={`${styles.acoes} nao-imprimir`}>{acoes}</div>}
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
