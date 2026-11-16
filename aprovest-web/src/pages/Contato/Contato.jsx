import { useState } from "react";
import { Link } from "react-router-dom";
import PaginaInstitucional from "../../components/PaginaInstitucional/PaginaInstitucional";
import api, { mensagemErro } from "../../services/api";
import styles from "./Contato.module.css";

export const ASSUNTOS = {
  DUVIDA: "Dúvida sobre a plataforma",
  SUGESTAO: "Sugestão",
  SUPORTE: "Suporte técnico",
  PARCERIA: "Parceria com escola ou cursinho",
  PRIVACIDADE: "Privacidade e dados pessoais (LGPD)",
};

const ENDERECO = "Rua Grupo Bandeirantes, 138 - Jardim Belval, Barueri - SP";
const VAZIO = { nome: "", email: "", assunto: "DUVIDA", mensagem: "" };

// UC048 - Enviar mensagem pelo Fale Conosco (página pública)
function Contato() {
  const [form, setForm] = useState(VAZIO);
  const [aceite, setAceite] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [protocolo, setProtocolo] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setErro("");
    if (!aceite) return setErro("É preciso autorizar o uso dos dados para que possamos responder.");
    setEnviando(true);
    try {
      const r = await api.post("/publico/contato", { ...form, aceite });
      setProtocolo(r.data.data.protocolo);
      setForm(VAZIO);
      setAceite(false);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PaginaInstitucional selo="Fale Conosco" titulo="Fale com a equipe AproVest"
      subtitulo="Dúvidas, sugestões, parcerias ou pedidos sobre seus dados pessoais: envie sua mensagem e responderemos pelo e-mail informado.">
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="av-card">
            {protocolo && (
              <div className="alert alert-success">
                <i className="fa-solid fa-circle-check me-2"></i>Mensagem enviada! Protocolo <strong>{protocolo}</strong>. Responderemos pelo e-mail informado.
              </div>
            )}
            {erro && <div className="alert alert-danger"><i className="fa-solid fa-circle-exclamation me-2"></i>{erro}</div>}
            <form onSubmit={enviar}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="nome">Nome</label>
                  <input id="nome" name="nome" className="form-control" value={form.nome} onChange={handleChange} required minLength={3} maxLength={120} autoComplete="name" />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="email">E-mail</label>
                  <input id="email" name="email" type="email" className="form-control" value={form.email} onChange={handleChange} required maxLength={160} autoComplete="email" />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="assunto">Assunto</label>
                  <select id="assunto" name="assunto" className="form-select" value={form.assunto} onChange={handleChange}>
                    {Object.entries(ASSUNTOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label d-flex justify-content-between" htmlFor="mensagem">
                    <span>Mensagem</span><small className="text-suave">{form.mensagem.length}/2.000</small>
                  </label>
                  <textarea id="mensagem" name="mensagem" className="form-control" rows="6" value={form.mensagem} onChange={handleChange} required minLength={10} maxLength={2000} />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="aceite" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
                    <label className="form-check-label small" htmlFor="aceite">
                      Autorizo o uso do meu nome e e-mail apenas para responder a esta mensagem, conforme a <Link to="/privacidade">Política de Privacidade</Link>.
                    </label>
                  </div>
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-gradiente px-4" disabled={enviando}>
                    {enviando ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fa-solid fa-paper-plane me-2"></i>Enviar mensagem</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="av-card mb-4">
            <div className={styles.info}>
              <div className="av-icone-circulo"><i className="fa-solid fa-location-dot"></i></div>
              <div><strong>Onde o projeto nasceu</strong><span>FIEB - ITB Brasílio Flores de Azevedo</span><span>{ENDERECO}</span></div>
            </div>
            <div className={styles.info}>
              <div className="av-icone-circulo"><i className="fa-solid fa-clock"></i></div>
              <div><strong>Prazo de resposta</strong><span>Até 2 dias úteis, pelo e-mail informado no formulário.</span></div>
            </div>
            <div className={styles.info}>
              <div className="av-icone-circulo"><i className="fa-solid fa-circle-question"></i></div>
              <div><strong>Resposta imediata</strong><span>Muitas dúvidas já estão respondidas na <Link to="/ajuda">Central de Ajuda</Link>.</span></div>
            </div>
          </div>
          <div className={`av-card p-0 overflow-hidden ${styles.mapa}`}>
            <iframe title="Localização da FIEB - ITB Brasílio Flores de Azevedo" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(ENDERECO)}&output=embed`}></iframe>
          </div>
        </div>
      </div>
    </PaginaInstitucional>
  );
}

export default Contato;
