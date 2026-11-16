import { useEffect, useState } from "react";
import api from "../../services/api";
import TextoFormatado from "../TextoFormatado/TextoFormatado";
import styles from "./RedacaoForm.module.css";

const VAZIO = { titulo: "", tema: "", texto: "", status: "RASCUNHO", vestibularId: "", temaRedacaoId: "" };

// Formulário de redação (UC021 / UC022): título 3-120, tema 3-180, texto 20-12.000 caracteres e até 2.500 palavras
const RedacaoForm = ({ inicial, onSalvar, salvando }) => {
  const [form, setForm] = useState({ ...VAZIO, ...inicial });
  const [temas, setTemas] = useState([]);
  const [vestibulares, setVestibulares] = useState([]);
  const [verProposta, setVerProposta] = useState(false);

  useEffect(() => {
    api.get("/conteudos/temas").then((r) => setTemas(r.data.data)).catch(() => {});
    api.get("/publico/catalogo").then((r) => {
      setVestibulares(r.data.data.vestibulares);
      if (!form.vestibularId && !inicial?.vestibularId) setForm((f) => ({ ...f, vestibularId: r.data.data.vestibulares[0]?.id }));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (inicial) setForm({ ...VAZIO, ...inicial }); }, [inicial]);

  const temaSelecionado = temas.find((t) => String(t.id) === String(form.temaRedacaoId));
  const palavras = form.texto.trim() ? form.texto.trim().split(/\s+/).length : 0;
  const linhasAprox = Math.ceil(form.texto.length / 75);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const escolherTema = (e) => {
    const t = temas.find((x) => String(x.id) === e.target.value);
    setForm({ ...form, temaRedacaoId: e.target.value, tema: t ? t.titulo.slice(0, 180) : form.tema, vestibularId: t ? t.vestibular.id : form.vestibularId });
  };

  const enviar = (e, status) => {
    e.preventDefault();
    onSalvar({ ...form, status, vestibularId: form.vestibularId || null, temaRedacaoId: form.temaRedacaoId || null });
  };

  return (
    <form onSubmit={(e) => enviar(e, form.status)} className="row g-4">
      <div className="col-lg-8">
        <div className="av-card">
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label" htmlFor="temaRedacaoId">Tema oficial (opcional)</label>
              <select id="temaRedacaoId" className="form-select" value={form.temaRedacaoId || ""} onChange={escolherTema}>
                <option value="">Tema livre</option>
                {["ENEM", "FUVEST", "UNICAMP"].map((sigla) => (
                  <optgroup key={sigla} label={sigla}>
                    {temas.filter((t) => t.vestibular.sigla === sigla).map((t) => (
                      <option key={t.id} value={t.id}>{t.ano} · {t.titulo}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="vestibularId">Banca da correção</label>
              <select id="vestibularId" name="vestibularId" className="form-select" value={form.vestibularId || ""} onChange={handleChange} disabled={!!temaSelecionado}>
                {vestibulares.map((v) => <option key={v.id} value={v.id}>{v.sigla}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="titulo">Título</label>
              <input id="titulo" name="titulo" className="form-control" value={form.titulo} onChange={handleChange} required minLength={3} maxLength={120} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="tema">Tema</label>
              <input id="tema" name="tema" className="form-control" value={form.tema} onChange={handleChange} required minLength={3} maxLength={180} />
            </div>
            <div className="col-12">
              <label className="form-label d-flex justify-content-between" htmlFor="texto">
                <span>Texto</span>
                <small className={palavras > 2500 ? "text-danger" : "text-suave"}>{palavras} palavras · {form.texto.length}/12.000 caracteres · ~{linhasAprox} linhas</small>
              </label>
              <textarea id="texto" name="texto" className={`form-control ${styles.texto}`} rows="18" value={form.texto} onChange={handleChange}
                required minLength={20} maxLength={12000} placeholder="Escreva sua redação aqui. Separe os parágrafos com uma linha em branco." />
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-4">
        {temaSelecionado && (
          <div className="av-card mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="av-selo av-selo-primario">{temaSelecionado.vestibular.sigla} {temaSelecionado.ano}</span>
              <span className="av-selo">{temaSelecionado.genero}</span>
            </div>
            <h3 className="h6">{temaSelecionado.titulo}</h3>
            <button type="button" className="btn btn-sm btn-suave w-100" onClick={() => setVerProposta(!verProposta)}>
              {verProposta ? "Ocultar proposta" : "Ver proposta oficial"}
            </button>
            {verProposta && (
              <div className={styles.proposta}>
                <TextoFormatado texto={temaSelecionado.proposta} />
                {temaSelecionado.textosApoio && <p className="small text-suave"><strong>Coletânea:</strong> {temaSelecionado.textosApoio}</p>}
                <a href={temaSelecionado.fonteUrl} target="_blank" rel="noreferrer" className="small"><i className="fa-solid fa-arrow-up-right-from-square me-1"></i>{temaSelecionado.fonteDescricao}</a>
              </div>
            )}
          </div>
        )}
        <div className="av-card">
          <div className="av-titulo-secao"><i className="fa-solid fa-lightbulb text-warning"></i> Dicas rápidas</div>
          <ul className="small text-suave ps-3">
            <li>Estruture em 4 ou 5 parágrafos.</li>
            <li>Apresente a tese já na introdução.</li>
            <li>Use repertório legitimado (dados, leis, autores).</li>
            <li>ENEM: termine com proposta de intervenção completa.</li>
            <li>Unicamp: respeite o gênero e o interlocutor pedidos.</li>
          </ul>
          <div className="d-grid gap-2">
            <button type="button" className="btn btn-suave" disabled={salvando} onClick={(e) => enviar(e, "RASCUNHO")}>
              <i className="fa-solid fa-floppy-disk me-2"></i>Salvar rascunho
            </button>
            <button type="button" className="btn btn-gradiente" disabled={salvando} onClick={(e) => enviar(e, "FINALIZADA")}>
              {salvando ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fa-solid fa-check me-2"></i>Salvar como finalizada</>}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default RedacaoForm;
