import { useEffect, useState } from "react";
import api from "../../services/api";

const LETRAS = ["A", "B", "C", "D", "E"];
export const QUESTAO_VAZIA = {
  enunciado: "", introducaoAlternativas: "", gabarito: "A", explicacao: "", nivel: "MEDIO", ano: new Date().getFullYear(), numero: "",
  origem: "OFICIAL", fonteDescricao: "", fonteUrl: "", vestibularId: "", disciplinaId: "", topicoIds: [],
  alternativas: LETRAS.map((l) => ({ letra: l, texto: "" })),
};

// Formulário de questão (UC030 cadastrar / UC041 editar). RN04: disciplina + ao menos 1 tópico + vestibular.
const QuestaoForm = ({ inicial, onSalvar, salvando }) => {
  const [form, setForm] = useState(inicial || QUESTAO_VAZIA);
  const [catalogo, setCatalogo] = useState(null);

  useEffect(() => { api.get("/publico/catalogo").then((r) => setCatalogo(r.data.data)); }, []);
  useEffect(() => { if (inicial) setForm(inicial); }, [inicial]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const topicos = catalogo?.topicos.filter((t) => String(t.disciplinaId) === String(form.disciplinaId)) || [];
  const qtdAlternativas = form.alternativas.length;

  const alternarTopico = (id) => setForm({ ...form, topicoIds: form.topicoIds.includes(id) ? form.topicoIds.filter((t) => t !== id) : [...form.topicoIds, id] });
  const setAlternativa = (i, texto) => setForm({ ...form, alternativas: form.alternativas.map((a, j) => (j === i ? { ...a, texto } : a)) });
  const mudarQuantidade = (n) => setForm({ ...form, alternativas: LETRAS.slice(0, n).map((l, i) => form.alternativas[i] || { letra: l, texto: "" }),
    gabarito: LETRAS.slice(0, n).includes(form.gabarito) ? form.gabarito : "A" });

  const enviar = (e) => {
    e.preventDefault();
    onSalvar({ ...form, ano: form.ano ? Number(form.ano) : null, numero: form.numero ? Number(form.numero) : null,
      vestibularId: Number(form.vestibularId), disciplinaId: Number(form.disciplinaId) });
  };

  return (
    <form onSubmit={enviar} className="row g-4">
      <div className="col-lg-8">
        <div className="av-card">
          <label className="form-label" htmlFor="enunciado">Enunciado (aceita **negrito**, listas com "- " e imagens ![](https://...))</label>
          <textarea id="enunciado" name="enunciado" className="form-control mb-3" rows="8" value={form.enunciado} onChange={handleChange} required />
          <label className="form-label" htmlFor="introducaoAlternativas">Comando antes das alternativas (opcional)</label>
          <input id="introducaoAlternativas" name="introducaoAlternativas" className="form-control mb-3" value={form.introducaoAlternativas || ""} onChange={handleChange} />
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label mb-0">Alternativas</label>
            <select className="form-select form-select-sm w-auto" value={qtdAlternativas} onChange={(e) => mudarQuantidade(Number(e.target.value))} aria-label="Quantidade de alternativas">
              <option value={5}>5 alternativas (ENEM/FUVEST)</option><option value={4}>4 alternativas (Unicamp)</option>
            </select>
          </div>
          {form.alternativas.map((a, i) => (
            <div className="input-group mb-2" key={a.letra}>
              <button type="button" className={`btn ${form.gabarito === a.letra ? "btn-success" : "btn-suave"}`} onClick={() => setForm({ ...form, gabarito: a.letra })}
                title="Marcar como gabarito" aria-label={`Marcar ${a.letra} como gabarito`}>{a.letra}</button>
              <input className="form-control" value={a.texto} onChange={(e) => setAlternativa(i, e.target.value)} required placeholder={`Texto da alternativa ${a.letra}`} />
            </div>
          ))}
          <small className="text-suave">Clique na letra para marcar o gabarito. Gabarito atual: <strong>{form.gabarito}</strong></small>
          <label className="form-label mt-3" htmlFor="explicacao">Explicação / resolução (opcional)</label>
          <textarea id="explicacao" name="explicacao" className="form-control" rows="4" value={form.explicacao || ""} onChange={handleChange} />
        </div>
      </div>
      <div className="col-lg-4">
        <div className="av-card mb-3">
          <label className="form-label" htmlFor="vestibularId">Vestibular</label>
          <select id="vestibularId" name="vestibularId" className="form-select mb-3" value={form.vestibularId} onChange={handleChange} required>
            <option value="">Selecione</option>{catalogo?.vestibulares.map((v) => <option key={v.id} value={v.id}>{v.sigla}</option>)}
          </select>
          <label className="form-label" htmlFor="disciplinaId">Disciplina</label>
          <select id="disciplinaId" name="disciplinaId" className="form-select mb-3" value={form.disciplinaId} onChange={(e) => setForm({ ...form, disciplinaId: e.target.value, topicoIds: [] })} required>
            <option value="">Selecione</option>{catalogo?.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
          <label className="form-label">Tópicos (mínimo 1)</label>
          <div className="d-flex flex-wrap gap-1 mb-3">
            {topicos.length ? topicos.map((t) => (
              <button type="button" key={t.id} className={`btn btn-sm ${form.topicoIds.includes(t.id) ? "btn-primary" : "btn-suave"}`} onClick={() => alternarTopico(t.id)}>{t.nome}</button>
            )) : <small className="text-suave">Escolha a disciplina.</small>}
          </div>
          <div className="row g-2">
            <div className="col-6"><label className="form-label" htmlFor="ano">Ano</label><input id="ano" name="ano" type="number" className="form-control" value={form.ano || ""} onChange={handleChange} /></div>
            <div className="col-6"><label className="form-label" htmlFor="numero">Nº na prova</label><input id="numero" name="numero" type="number" className="form-control" value={form.numero || ""} onChange={handleChange} /></div>
            <div className="col-6"><label className="form-label" htmlFor="nivel">Nível inicial</label>
              <select id="nivel" name="nivel" className="form-select" value={form.nivel} onChange={handleChange}><option value="FACIL">Fácil</option><option value="MEDIO">Médio</option><option value="DIFICIL">Difícil</option></select></div>
            <div className="col-6"><label className="form-label" htmlFor="origem">Origem</label>
              <select id="origem" name="origem" className="form-select" value={form.origem} onChange={handleChange}><option value="OFICIAL">Oficial</option><option value="AUTORAL">Autoral</option></select></div>
          </div>
        </div>
        <div className="av-card mb-3">
          <label className="form-label" htmlFor="fonteDescricao">Fonte / referência</label>
          <input id="fonteDescricao" name="fonteDescricao" className="form-control mb-2" value={form.fonteDescricao} onChange={handleChange} required placeholder="Ex.: INEP - ENEM 2023, questão 140" />
          <label className="form-label" htmlFor="fonteUrl">Link da prova oficial</label>
          <input id="fonteUrl" name="fonteUrl" type="url" className="form-control" value={form.fonteUrl || ""} onChange={handleChange} placeholder="https://" />
        </div>
        <button className="btn btn-gradiente w-100" disabled={salvando || form.topicoIds.length === 0}>
          {salvando ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fa-solid fa-floppy-disk me-2"></i>Salvar questão</>}
        </button>
      </div>
    </form>
  );
};

export default QuestaoForm;
