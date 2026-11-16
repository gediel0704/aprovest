import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../../components/Logo/Logo";
import { rotaInicial, useAuth } from "../../contexts/AuthContext";
import api, { mensagemErro } from "../../services/api";
import styles from "./Login.module.css";

// Botão oficial "Entrar com Google" (Google Identity Services). Só aparece se o servidor tiver Client ID.
export function BotaoGoogle({ aoEntrar, aoErro }) {
  const ref = useRef(null);
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    api.get("/auth/config").then((r) => setClientId(r.data.data.googleClientId)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!clientId) return;
    const iniciar = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: (resp) => aoEntrar(resp.credential).catch((e) => aoErro(mensagemErro(e))),
      });
      window.google?.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", width: 320, text: "continue_with", locale: "pt-BR" });
    };
    if (window.google?.accounts) return iniciar();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = iniciar;
    document.body.appendChild(script);
  }, [clientId, aoEntrar, aoErro]);

  if (!clientId) return null;
  return (
    <>
      <div className={styles.divisor}><span>ou</span></div>
      <div ref={ref} className="d-flex justify-content-center"></div>
    </>
  );
}

export function PainelLateral() {
  return (
    <div className={styles.lateral}>
      <Logo claro />
      <div>
        <h2>Estude o que falta para a sua aprovação.</h2>
        <ul>
          <li><i className="fa-solid fa-circle-check"></i> Questões oficiais de ENEM, FUVEST e Unicamp</li>
          <li><i className="fa-solid fa-circle-check"></i> Redação corrigida nas competências oficiais</li>
          <li><i className="fa-solid fa-circle-check"></i> Simulados com percentil real</li>
        </ul>
      </div>
      <small>Seus dados protegidos conforme a LGPD.</small>
    </div>
  );
}

function Login() {
  const { login, loginGoogle, carregando } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const entrar = (usuario) => navigate(params.get("voltar") || rotaInicial(usuario));

  const enviar = async (e) => {
    e.preventDefault(); // Cancela o recarregamento da página
    setErro("");
    try {
      entrar(await login(email.trim(), senha));
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
          <h1>Bem-vindo de volta</h1>
          <p className="text-suave mb-4">Entre para continuar seus estudos.</p>
          {params.get("sessao") === "expirada" && <div className="alert alert-warning">Sua sessão expirou. Faça login novamente.</div>}
          {erro && <div className="alert alert-danger" role="alert"><i className="fa-solid fa-circle-exclamation me-2"></i>{erro}</div>}
          <form onSubmit={enviar} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input id="email" type="email" className="form-control" placeholder="seu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="mb-2">
              <label className="form-label" htmlFor="senha">Senha</label>
              <div className="input-group">
                <input id="senha" type={mostrarSenha ? "text" : "password"} className="form-control" placeholder="Sua senha"
                  value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
                <button type="button" className="btn btn-suave" onClick={() => setMostrarSenha(!mostrarSenha)} aria-label="Mostrar ou ocultar senha">
                  <i className={`fa-solid ${mostrarSenha ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>
            <div className="text-end mb-4"><Link to="/esqueci-senha" className="small fw-semibold">Esqueci minha senha</Link></div>
            <button type="submit" className="btn btn-gradiente w-100 py-2" disabled={carregando || !email || !senha}>
              {carregando ? <span className="spinner-border spinner-border-sm"></span> : "Entrar"}
            </button>
          </form>
          <BotaoGoogle aoEntrar={async (c) => entrar(await loginGoogle(c))} aoErro={setErro} />
          <p className="text-center mt-4 mb-0 text-suave">Ainda não tem conta? <Link to="/cadastro" className="fw-bold">Cadastre-se grátis</Link></p>
          <p className="text-center mt-2"><Link to="/" className="small text-suave"><i className="fa-solid fa-arrow-left me-1"></i>Voltar ao início</Link></p>
        </div>
      </main>
    </div>
  );
}

export default Login;
