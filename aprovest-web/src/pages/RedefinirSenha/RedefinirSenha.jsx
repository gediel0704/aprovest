import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../../components/Logo/Logo";
import api, { mensagemErro } from "../../services/api";
import { PainelLateral } from "../Login/Login";
import styles from "../Login/Login.module.css";

// UC004 - Recuperar senha (passo 2: definir a nova senha pelo link recebido)
function RedefinirSenha() {
  const [params] = useSearchParams();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();

  const enviar = async (e) => {
    e.preventDefault();
    setErro("");
    if (senha !== confirmar) return setErro("As senhas não conferem.");
    try {
      await api.post("/auth/redefinir-senha", { token: params.get("token"), novaSenha: senha });
      setSucesso(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  };

  return (
    <div className={styles.pagina}>
      <PainelLateral />
      <main className={styles.formulario}>
        <div className={styles.caixa}>
          <div className="d-lg-none mb-4"><Logo /></div>
          <h1>Definir nova senha</h1>
          <p className="text-suave mb-4">Use pelo menos 8 caracteres, com letras e números.</p>
          {!params.get("token") && <div className="alert alert-warning">Link inválido. Solicite uma nova recuperação.</div>}
          {erro && <div className="alert alert-danger">{erro}</div>}
          {sucesso ? (
            <div className="alert alert-success"><i className="fa-solid fa-circle-check me-2"></i>Senha alterada! Redirecionando para o login...</div>
          ) : (
            <form onSubmit={enviar}>
              <label className="form-label" htmlFor="senha">Nova senha</label>
              <input id="senha" type="password" className="form-control mb-3" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="new-password" />
              <label className="form-label" htmlFor="confirmar">Confirmar nova senha</label>
              <input id="confirmar" type="password" className="form-control mb-4" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required autoComplete="new-password" />
              <button className="btn btn-gradiente w-100" disabled={!params.get("token")}>Salvar nova senha</button>
            </form>
          )}
          <p className="text-center mt-4"><Link to="/esqueci-senha">Solicitar novo link</Link></p>
        </div>
      </main>
    </div>
  );
}

export default RedefinirSenha;
