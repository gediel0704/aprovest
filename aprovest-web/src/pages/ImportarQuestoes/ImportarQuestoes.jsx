import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import api, { mensagemErro } from "../../services/api";

const EXEMPLO = JSON.stringify({
  questoes: [{
    enunciado: "Texto do enunciado...", gabarito: "C", nivel: "MEDIO", ano: 2023, numero: 140, origem: "OFICIAL",
    fonteDescricao: "INEP - ENEM 2023, questão 140", fonteUrl: "https://www.gov.br/inep/...",
    vestibularId: 1, disciplinaId: 1, topicoIds: [1],
    alternativas: [{ letra: "A", texto: "..." }, { letra: "B", texto: "..." }, { letra: "C", texto: "..." }, { letra: "D", texto: "..." }, { letra: "E", texto: "..." }],
  }],
}, null, 2);

// UC031 - Importar questões em lote (1 a 100 itens, validados um a um)
function ImportarQuestoes() {
  const [json, setJson] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregarArquivo = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => setJson(String(leitor.result));
    leitor.readAsText(arquivo);
  };

  const importar = async () => {
    setErro("");
    setResultado(null);
    let lote;
    try {
      lote = JSON.parse(json);
      if (Array.isArray(lote)) lote = { questoes: lote };
    } catch {
      return setErro("JSON inválido. Verifique a formatação.");
    }
    if (!lote.questoes?.length || lote.questoes.length > 100) return setErro("O lote deve ter de 1 a 100 questões.");
    setEnviando(true);
    try {
      const r = await api.post("/admin/questoes/importar", lote);
      setResultado(r.data.data);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Layout title="Importar questões" subtitulo="Envie um lote JSON. Se qualquer item for inválido, nada é gravado."
      acoes={<Link to="/admin/questoes" className="btn btn-suave"><i className="fa-solid fa-arrow-left me-2"></i>Banco de questões</Link>}>
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="av-card">
            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
              <label className="form-label mb-0" htmlFor="json">Lote (JSON)</label>
              <input type="file" accept=".json,application/json" className="form-control form-control-sm w-auto" onChange={carregarArquivo} aria-label="Carregar arquivo JSON" />
            </div>
            <textarea id="json" className="form-control font-monospace" rows="18" value={json} onChange={(e) => setJson(e.target.value)} placeholder="Cole aqui o JSON do lote" />
            {erro && <div className="alert alert-danger mt-3">{erro}</div>}
            {resultado && <div className="alert alert-success mt-3"><i className="fa-solid fa-circle-check me-2"></i>{resultado.importadas} questão(ões) importada(s). IDs: {resultado.ids.join(", ")}</div>}
            <button className="btn btn-gradiente mt-3" disabled={!json || enviando} onClick={importar}>
              {enviando ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fa-solid fa-file-import me-2"></i>Validar e importar</>}
            </button>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="av-card">
            <div className="av-titulo-secao"><i className="fa-solid fa-code text-primary"></i> Formato esperado</div>
            <pre className="small mb-2" style={{ maxHeight: 380, overflow: "auto" }}>{EXEMPLO}</pre>
            <button className="btn btn-sm btn-suave" onClick={() => setJson(EXEMPLO)}>Usar exemplo</button>
            <p className="small text-suave mt-3 mb-0">Os IDs de vestibular, disciplina e tópicos estão no formulário de nova questão. O importador oficial de provas (ENEM, FUVEST e Unicamp) fica em <code>database/scripts</code>.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ImportarQuestoes;
