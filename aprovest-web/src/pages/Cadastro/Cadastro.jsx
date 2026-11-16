import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../components/Logo/Logo";
import { useAuth } from "../../contexts/AuthContext";
import { mensagemErro } from "../../services/api";
import { BotaoGoogle, PainelLateral } from "../Login/Login";
import styles from "../Login/Login.module.css";

export function forcaSenha(senha) {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (/[A-Za-z]/.test(senha) && /\d/.test(senha)) pontos++;
  if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha) || senha.length >= 12) pontos++;
  const niveis = [
    { texto: "Muito fraca", cor: "#ef4444" }, { texto: "Fraca", cor: "#f97316" }, { texto: "Razoável", cor: "#f59e0b" },
    { texto: "Boa", cor: "#10b981" }, { texto: "Forte", cor: "#059669" },
  ];
  return { ...niveis[pontos], pontos };
}

// UC002 - Cadastrar conta (cadastro público sempre cria um Aluno)
function Cadastro() {
  const { cadastrar, loginGoogle, carregando } = useAuth();
  const [form, setForm] = useState({ nome: "", email: "", password: "", confirmar: "" });
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const forca = forcaSenha(form.password);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setErro("");
    if (form.password !== form.confirmar) return setErro("As senhas não conferem.");
    if (!aceite) return setErro("É preciso aceitar os termos de uso e a política de privacidade.");
    try {
      await cadastrar({ nome: form.nome.trim(), email: form.email.trim(), password: form.password, aceiteTermos: aceite });
      navigate("/aluno/meta");
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
          <h1>Crie sua conta grátis</h1>
          <p className="text-suave mb-4">Leva menos de um minuto. Sem cartão de crédito.</p>
          {erro && <div className="alert alert-danger"><i className="fa-solid fa-circle-exclamation me-2"></i>{erro}</div>}
          <form onSubmit={enviar}>
            <div className="mb-3">
              <label className="form-label" htmlFor="nome">Nome completo</label>
              <input id="nome" name="nome" className="form-control" value={form.nome} onChange={handleChange} required minLength={3} autoComplete="name" />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" className="form-control" value={form.email} onChange={handleChange} required autoComplete="email" />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-sm-6">
                <label className="form-label" htmlFor="password">Senha</label>
                <input id="password" name="password" type="password" className="form-control" value={form.password} onChange={handleChange} required autoComplete="new-password" />
                {form.password && (
                  <>
                    <div className={styles.forca}><span style={{ width: `${(forca.pontos + 1) * 20}%`, background: forca.cor }}></span></div>
                    <small style={{ color: forca.cor }}>{forca.texto}</small>
                  </>
                )}
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="confirmar">Confirmar senha</label>
                <input id="confirmar" name="confirmar" type="password" className="form-control" value={form.confirmar} onChange={handleChange} required autoComplete="new-password" />
              </div>
              <div className="col-12"><small className="text-suave">Mínimo de 8 caracteres, com letras e números.</small></div>
            </div>
            <div className="form-check mb-4">
              <input className="form-check-input" type="checkbox" id="aceite" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
              <label className="form-check-label small" htmlFor="aceite">
                Li e aceito os <Link to="/termos">termos de uso</Link> e a <Link to="/privacidade">política de privacidade</Link>. Autorizo o tratamento dos meus dados de estudo para
                personalizar minha preparação, conforme a LGPD.
              </label>
            </div>
            <button type="submit" className="btn btn-gradiente w-100 py-2" disabled={carregando}>
              {carregando ? <span className="spinner-border spinner-border-sm"></span> : "Criar conta"}
            </button>
          </form>
          <BotaoGoogle aoEntrar={async (c) => { await loginGoogle(c); navigate("/aluno/meta"); }} aoErro={setErro} />
          <p className="text-center mt-4 text-suave">Já tem conta? <Link to="/login" className="fw-bold">Entrar</Link></p>
        </div>
      </main>
    </div>
  );
}

export default Cadastro;
