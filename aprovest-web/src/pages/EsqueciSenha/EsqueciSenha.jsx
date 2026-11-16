import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/Logo/Logo";
import api, { mensagemErro } from "../../services/api";
import { PainelLateral } from "../Login/Login";
import styles from "../Login/Login.module.css";

// UC004 - Recuperar senha (passo 1: solicitar o link)
function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [resposta, setResposta] = useState(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const r = await api.post("/auth/esqueci-senha", { email: email.trim() });
      setResposta(r.data.data);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.pagina}>
      <PainelLateral />
      <main className={styles.formulario}>
        <div className={styles.caixa}>
          <div className="d-lg-none mb-4"><Logo /></div>
          <div className="av-icone-circulo mb-3"><i className="fa-solid fa-key"></i></div>
          <h1>Recuperar senha</h1>
          <p className="text-suave mb-4">Informe o e-mail da sua conta para receber um link de redefinição válido por 30 minutos.</p>
          {erro && <div className="alert alert-danger">{erro}</div>}
          {resposta ? (
            <div className="alert alert-success">
              <i className="fa-solid fa-envelope-circle-check me-2"></i>{resposta.mensagem}
              {resposta.linkDemonstracao && (
                <div className="mt-3 small">
                  <strong>Modo demonstração (sem servidor de e-mail):</strong>{" "}
                  <a href={resposta.linkDemonstracao}>abrir o link de redefinição</a>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={enviar}>
              <label className="form-label" htmlFor="email">E-mail</label>
              <input id="email" type="email" className="form-control mb-4" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <button className="btn btn-gradiente w-100" disabled={enviando || !email}>
                {enviando ? <span className="spinner-border spinner-border-sm"></span> : "Enviar link"}
              </button>
            </form>
          )}
          <p className="text-center mt-4"><Link to="/login" className="fw-semibold"><i className="fa-solid fa-arrow-left me-1"></i>Voltar ao login</Link></p>
        </div>
      </main>
    </div>
  );
}

export default EsqueciSenha;
