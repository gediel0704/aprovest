import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import Modal from "../../components/Modal/Modal";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";

const VAZIO = { titulo: "", resumo: "", conteudo: "", tipo: "RESUMO", oficial: false, fonteOrgao: "", fonteUrl: "", ano: "", vestibularId: "", disciplinaId: "" };
const TIPOS = ["RESUMO", "PROVA", "GABARITO", "MATRIZ", "EDITAL", "GUIA_REDACAO", "MATERIAL_OFICIAL"];

// Gestão de materiais da biblioteca e do catálogo de fontes oficiais (RN03)
function ListarMaterial() {
  const { dados, carregando, erro, recarregar } = useApi("/admin/materiais");
  const [catalogo, setCatalogo] = useState(null);
  const [form, setForm] = useState(null);
  const [falha, setFalha] = useState("");

  useEffect(() => { api.get("/publico/catalogo").then((r) => setCatalogo(r.data.data)); }, []);

  const abrir = (m) => setForm(m ? { ...VAZIO, ...m, vestibularId: m.vestibular?.id || "", disciplinaId: m.disciplina?.id || "", ano: m.ano || "" } : VAZIO);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const salvar = async () => {
    setFalha("");
    const corpo = { ...form, ano: form.ano ? Number(form.ano) : null, vestibularId: form.vestibularId || null, disciplinaId: form.disciplinaId || null };
    try {
      if (form.id) await api.put(`/admin/materiais/${form.id}`, corpo);
      else await api.post("/admin/materiais", corpo);
      setForm(null);
      recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    }
  };

  const alternar = async (m) => {
    await api.put(`/admin/materiais/${m.id}/publicacao?ativo=${!m.codStatus}`).catch(() => {});
    recarregar(true);
  };

  return (
    <Layout title="Materiais" subtitulo="Resumos internos e referências a fontes oficiais."
      acoes={<button className="btn btn-gradiente" onClick={() => abrir(null)}><i className="fa-solid fa-plus me-2"></i>Novo material</button>}>
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (
        <div className="av-card">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Título</th><th>Tipo</th><th>Origem</th><th>Vestibular</th><th>Situação</th><th></th></tr></thead>
              <tbody>
                {dados.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.titulo}</strong><br /><small className="text-suave">{m.fonteOrgao}</small></td>
                    <td>{m.tipo}</td>
                    <td>{m.oficial ? <span className="av-selo av-selo-primario">Oficial</span> : <span className="av-selo">Interno</span>}</td>
                    <td>{m.vestibular?.sigla || "Todos"}</td>
                    <td><span className={`av-selo ${m.codStatus ? "av-selo-sucesso" : "av-selo-alerta"}`}>{m.codStatus ? "Publicado" : "Oculto"}</span></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-warning me-1" onClick={() => abrir(m)} aria-label="Editar"><i className="fas fa-edit"></i></button>
                      <button className="btn btn-sm btn-suave" onClick={() => alternar(m)} aria-label="Publicar ou ocultar"><i className={`fas ${m.codStatus ? "fa-eye-slash" : "fa-eye"}`}></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Modal isOpen={!!form} onClose={() => setForm(null)} onConfirm={salvar} largo titulo={form?.id ? "Editar material" : "Novo material"} textoConfirmar="Salvar">
        {form && (
          <div className="row g-2">
            <div className="col-md-8"><label className="form-label">Título</label><input name="titulo" className="form-control" value={form.titulo} onChange={handleChange} /></div>
            <div className="col-md-4"><label className="form-label">Tipo</label><select name="tipo" className="form-select" value={form.tipo} onChange={handleChange}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="col-12"><label className="form-label">Resumo</label><input name="resumo" className="form-control" value={form.resumo} onChange={handleChange} /></div>
            <div className="col-12"><label className="form-label">Conteúdo (## títulos, - listas, **negrito**)</label><textarea name="conteudo" rows="6" className="form-control" value={form.conteudo || ""} onChange={handleChange} /></div>
            <div className="col-md-6"><label className="form-label">Órgão / base</label><input name="fonteOrgao" className="form-control" value={form.fonteOrgao} onChange={handleChange} /></div>
            <div className="col-md-6"><label className="form-label">Link</label><input name="fonteUrl" className="form-control" value={form.fonteUrl || ""} onChange={handleChange} /></div>
            <div className="col-md-4"><label className="form-label">Vestibular</label><select name="vestibularId" className="form-select" value={form.vestibularId} onChange={handleChange}><option value="">Todos</option>{catalogo?.vestibulares.map((v) => <option key={v.id} value={v.id}>{v.sigla}</option>)}</select></div>
            <div className="col-md-4"><label className="form-label">Disciplina</label><select name="disciplinaId" className="form-select" value={form.disciplinaId} onChange={handleChange}><option value="">-</option>{catalogo?.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></div>
            <div className="col-md-2"><label className="form-label">Ano</label><input name="ano" type="number" className="form-control" value={form.ano} onChange={handleChange} /></div>
            <div className="col-md-2 d-flex align-items-end"><div className="form-check"><input id="oficial" name="oficial" type="checkbox" className="form-check-input" checked={form.oficial} onChange={handleChange} /><label htmlFor="oficial" className="form-check-label">Oficial</label></div></div>
            {falha && <div className="col-12"><div className="alert alert-danger mb-0">{falha}</div></div>}
          </div>
        )}
      </Modal>
    </Layout>
  );
}

export default ListarMaterial;
