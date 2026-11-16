import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { iniciais } from "../../utils/formatar";
import styles from "./CredentialUser.module.css";

// Cabeçalho da página logada: recebe o título da página via props (como no projeto modelo)
// e mostra notificações, alternância de tema e o usuário conectado.
const CredentialUser = ({ title, subtitulo, aoAbrirMenu }) => {
  const { usuario, logout, alternarTemaLocal } = useAuth();
  const [naoLidas, setNaoLidas] = useState(0);
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let ativo = true;
    const buscar = () => api.get("/notificacoes/nao-lidas").then((r) => ativo && setNaoLidas(r.data.data.total)).catch(() => {});
    buscar();
    const timer = setInterval(buscar, 30000);
    return () => { ativo = false; clearInterval(timer); };
  }, [title]);

  const alternarTema = () => {
    const novo = usuario?.tema === "escuro" ? "claro" : "escuro";
    alternarTemaLocal(novo);
    api.put("/usuarios/me/preferencias", { tema: novo }).catch(() => {});
  };

  const sair = async () => {
    await logout();
    navigate("/login");
  };

  const papel = { ALUNO: usuario?.pro ? "Aluno Pro" : "Aluno", CORRETOR: "Corretor(a)", ADMIN: "Administrador(a)" }[usuario?.tipo];

  return (
    <header className={`${styles.cabecalho} nao-imprimir`}>
      <div className={styles.esquerda}>
        <button className={styles.botaoMenu} onClick={aoAbrirMenu} aria-label="Abrir menu"><i className="fa-solid fa-bars"></i></button>
        <div>
          <h1 className={styles.titulo}>{title}</h1>
          {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
        </div>
      </div>
      <div className={styles.direita}>
        <button className={styles.icone} onClick={alternarTema} aria-label="Alternar tema claro/escuro" title="Alternar tema">
          <i className={`fa-solid ${usuario?.tema === "escuro" ? "fa-sun" : "fa-moon"}`}></i>
        </button>
        <Link to="/notificacoes" className={styles.icone} aria-label={`Notificações (${naoLidas} não lidas)`} title="Notificações">
          <i className="fa-solid fa-bell"></i>
          {naoLidas > 0 && <span className={styles.contador}>{naoLidas > 9 ? "9+" : naoLidas}</span>}
        </Link>
        <div className={styles.usuario}>
          <button className={styles.botaoUsuario} onClick={() => setMenuAberto(!menuAberto)} aria-expanded={menuAberto}>
            <span className={styles.avatar}>{iniciais(usuario?.nome)}</span>
            <span className={styles.info}>
              <strong>{usuario?.nome?.split(" ")[0]}</strong>
              <small>{papel}</small>
            </span>
            <i className="fa-solid fa-chevron-down small"></i>
          </button>
          {menuAberto && (
            <div className={styles.dropdown} onMouseLeave={() => setMenuAberto(false)}>
              <Link to="/configuracoes" onClick={() => setMenuAberto(false)}><i className="fa-solid fa-gear"></i> Configurações</Link>
              {usuario?.tipo === "ALUNO" && <Link to="/aluno/meta" onClick={() => setMenuAberto(false)}><i className="fa-solid fa-bullseye"></i> Minha meta</Link>}
              {usuario?.tipo === "ALUNO" && <Link to="/aluno/acessos" onClick={() => setMenuAberto(false)}><i className="fa-solid fa-crown"></i> Plano e créditos</Link>}
              <button onClick={sair}><i className="fa-solid fa-right-from-bracket"></i> Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CredentialUser;
