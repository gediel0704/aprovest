import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import Modal from "../../components/Modal/Modal";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";

const VAZIO = { titulo: "", proposta: "", textosApoio: "", expectativaBanca: "", genero: "Dissertativo-argumentativo", ano: new Date().getFullYear(), origem: "AUTORAL", fonteDescricao: "", fonteUrl: "", vestibularId: "" };

// Gestão dos temas de redação (RN03)
function ListarTema() {
  const { dados, carregando, erro, recarregar } = useApi("/admin/temas");
  const [vestibulares, setVestibulares] = useState([]);
  const [form, setForm] = useState(null);
  const [falha, setFalha] = useState("");

  useEffect(() => { api.get("/publico/catalogo").then((r) => setVestibulares(r.data.data.vestibulares)); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const salvar = async () => {
    setFalha("");
    try {
      const corpo = { ...form, ano: form.ano ? Number(form.ano) : null, vestibularId: Number(form.vestibularId) };
      if (form.id) await api.put(`/admin/temas/${form.id}`, corpo); else await api.post("/admin/temas", corpo);
      setForm(null);
      recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    }
  };

  const alternar = async (t) => { await api.put(`/admin/temas/${t.id}/publicacao?ativo=${!t.codStatus}`).catch(() => {}); recarregar(true); };

  return (
    <Layout title="Temas de redação" subtitulo="Propostas oficiais com a abordagem esperada pela banca (usada como referência na correção por IA)."
      acoes={<button className="btn btn-gradiente" onClick={() => setForm(VAZIO)}><i className="fa-solid fa-plus me-2"></i>Novo tema</button>}>
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (
        <div className="av-card">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Ano</th><th>Banca</th><th>Tema</th><th>Gênero</th><th>Origem</th><th>Situação</th><th></th></tr></thead>
              <tbody>
                {dados.map((t) => (
                  <tr key={t.id}>
                    <td>{t.ano}</td><td>{t.vestibular.sigla}</td>
                    <td style={{ maxWidth: 360 }}><strong>{t.titulo}</strong>{t.expectativaBanca && <><br /><small className="text-success"><i className="fa-solid fa-check me-1"></i>com abordagem esperada oficial</small></>}</td>
                    <td>{t.genero}</td>
                    <td><span className={`av-selo ${t.origem === "OFICIAL" ? "av-selo-primario" : t.origem === "SUGERIDO_IA" ? "av-selo-info" : ""}`}>{t.origem}</span></td>
                    <td><span className={`av-selo ${t.codStatus ? "av-selo-sucesso" : "av-selo-alerta"}`}>{t.codStatus ? "Ativo" : "Inativo"}</span></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-warning me-1" onClick={() => setForm({ ...VAZIO, ...t, vestibularId: t.vestibular.id })} aria-label="Editar"><i className="fas fa-edit"></i></button>
                      <button className="btn btn-sm btn-suave" onClick={() => alternar(t)} aria-label="Ativar ou desativar"><i className={`fas ${t.codStatus ? "fa-eye-slash" : "fa-eye"}`}></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Modal isOpen={!!form} onClose={() => setForm(null)} onConfirm={salvar} largo titulo={form?.id ? "Editar tema" : "Novo tema"} textoConfirmar="Salvar">
        {form && (
          <div className="row g-2">
            <div className="col-md-9"><label className="form-label">Título</label><input name="titulo" className="form-control" value={form.titulo} onChange={handleChange} /></div>
            <div className="col-md-3"><label className="form-label">Banca</label><select name="vestibularId" className="form-select" value={form.vestibularId} onChange={handleChange}><option value="">-</option>{vestibulares.map((v) => <option key={v.id} value={v.id}>{v.sigla}</option>)}</select></div>
            <div className="col-12"><label className="form-label">Proposta</label><textarea name="proposta" rows="4" className="form-control" value={form.proposta} onChange={handleChange} /></div>
            <div className="col-12"><label className="form-label">Coletânea (resumo)</label><textarea name="textosApoio" rows="2" className="form-control" value={form.textosApoio || ""} onChange={handleChange} /></div>
            <div className="col-12"><label className="form-label">Abordagem esperada pela banca</label><textarea name="expectativaBanca" rows="4" className="form-control" value={form.expectativaBanca || ""} onChange={handleChange} /></div>
            <div className="col-md-4"><label className="form-label">Gênero</label><input name="genero" className="form-control" value={form.genero} onChange={handleChange} /></div>
            <div className="col-md-2"><label className="form-label">Ano</label><input name="ano" type="number" className="form-control" value={form.ano || ""} onChange={handleChange} /></div>
            <div className="col-md-3"><label className="form-label">Origem</label><select name="origem" className="form-select" value={form.origem} onChange={handleChange}><option>OFICIAL</option><option>AUTORAL</option><option>SUGERIDO_IA</option></select></div>
            <div className="col-md-3"><label className="form-label">Link</label><input name="fonteUrl" className="form-control" value={form.fonteUrl || ""} onChange={handleChange} /></div>
            <div className="col-12"><label className="form-label">Fonte</label><input name="fonteDescricao" className="form-control" value={form.fonteDescricao || ""} onChange={handleChange} /></div>
            {falha && <div className="col-12"><div className="alert alert-danger mb-0">{falha}</div></div>}
          </div>
        )}
      </Modal>
    </Layout>
  );
}

export default ListarTema;
