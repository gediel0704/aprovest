import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import api, { mensagemErro } from "../../services/api";

// RF13 - Novidades da plataforma: comunicado enviado como notificação a todos os alunos
function Comunicados() {
  const [form, setForm] = useState({ titulo: "", mensagem: "", link: "" });
  const [msg, setMsg] = useState({});
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMsg({});
    try {
      const r = await api.post("/admin/comunicados", { ...form, link: form.link || null });
      setMsg({ tipo: "success", texto: `Comunicado enviado para ${r.data.data.destinatarios} aluno(s) (respeitando as preferências de notificação).` });
      setForm({ titulo: "", mensagem: "", link: "" });
    } catch (er) {
      setMsg({ tipo: "danger", texto: mensagemErro(er) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Layout title="Comunicados" subtitulo="Envie novidades da plataforma para os alunos.">
      <div className="row"><div className="col-lg-8">
        <form className="av-card" onSubmit={enviar}>
          {msg.texto && <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>}
          <label className="form-label" htmlFor="titulo">Título</label>
          <input id="titulo" className="form-control mb-3" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required maxLength={150} />
          <label className="form-label d-flex justify-content-between" htmlFor="mensagem"><span>Mensagem</span><small className="text-suave">{form.mensagem.length}/600</small></label>
          <textarea id="mensagem" className="form-control mb-3" rows="5" value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} required maxLength={600} />
          <label className="form-label" htmlFor="link">Link interno (opcional)</label>
          <input id="link" className="form-control mb-4" placeholder="/aluno/simulados" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
          <button className="btn btn-gradiente" disabled={enviando}><i className="fa-solid fa-bullhorn me-2"></i>Enviar comunicado</button>
        </form>
      </div></div>
    </Layout>
  );
}

export default Comunicados;
