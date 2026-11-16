import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import Questao from "../../components/Questao/Questao";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";

const AREAS = [["", "Todas as áreas"], ["linguagens", "Linguagens"], ["ciencias-humanas", "Ciências Humanas"], ["ciencias-natureza", "Ciências da Natureza"], ["matematica", "Matemática"]];
const NOMES_AREA = Object.fromEntries(AREAS);

// UC017 - Praticar questões ENEM externas (2009-2023, INEP via enem.dev). Não grava no histórico interno.
function QuestoesEnem() {
  const [ano, setAno] = useState(2023);
  const [area, setArea] = useState("");
  const [idioma, setIdioma] = useState("ingles");
  const [pagina, setPagina] = useState(0);
  const [selecao, setSelecao] = useState({});
  const [conferencia, setConferencia] = useState({});
  const [falha, setFalha] = useState("");
  const url = `/enem-externo/questoes?ano=${ano}&area=${area}&idioma=${idioma}&pagina=${pagina}`;
  const { dados, carregando, erro } = useApi(url, [url]);

  const conferir = async (q) => {
    setFalha("");
    try {
      const r = await api.post("/enem-externo/conferir", { ano: q.ano, indice: q.indice, idioma: q.idioma, alternativa: selecao[q.indice] });
      setConferencia({ ...conferencia, [q.indice]: r.data.data });
    } catch (e) {
      setFalha(mensagemErro(e));
    }
  };

  const mudarFiltro = (fn) => (e) => { fn(e.target.value); setPagina(0); setSelecao({}); setConferencia({}); };

  return (
    <Layout title="Acervo ENEM" subtitulo="Questões oficiais do INEP de 2009 a 2023, consultadas na API comunitária enem.dev.">
      <div className="av-card mb-4">
        <div className="row g-2">
          <div className="col-6 col-md-3">
            <label className="form-label" htmlFor="ano">Edição</label>
            <select id="ano" className="form-select" value={ano} onChange={mudarFiltro((v) => setAno(Number(v)))}>
              {Array.from({ length: 15 }, (_, i) => 2023 - i).map((a) => <option key={a} value={a}>ENEM {a}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-5">
            <label className="form-label" htmlFor="area">Área</label>
            <select id="area" className="form-select" value={area} onChange={mudarFiltro(setArea)}>
              {AREAS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="idioma">Língua estrangeira</label>
            <select id="idioma" className="form-select" value={idioma} onChange={mudarFiltro(setIdioma)}>
              <option value="ingles">Inglês</option><option value="espanhol">Espanhol</option>
            </select>
          </div>
        </div>
        <small className="text-suave d-block mt-2"><i className="fa-solid fa-circle-info me-1"></i>Prática livre: estas respostas não entram no seu histórico nem na proficiência. O gabarito só é consultado após sua resposta.</small>
      </div>
      {carregando && <Carregando texto="Consultando a fonte externa..." />}
      {(erro || falha) && <div className="alert alert-danger">{erro || falha}</div>}
      {dados && !carregando && (dados.questoes.length ? (
        <>
          {dados.questoes.map((q) => {
            const c = conferencia[q.indice];
            const questao = { ...q, enunciado: (q.contexto || "") + (q.arquivos || []).map((u) => `\n\n![](${u})`).join(""), disciplina: NOMES_AREA[q.area] || q.area, topicos: [], fonte: `INEP - ENEM ${q.ano}, questão ${q.indice}` };
            return (
              <div className="av-card mb-3" key={`${q.ano}-${q.indice}-${q.idioma}`}>
                <Questao questao={questao} numero={q.indice} selecionada={selecao[q.indice]} gabarito={c?.gabarito}
                  bloqueada={!!c} onSelecionar={(l) => setSelecao({ ...selecao, [q.indice]: l })} />
                <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                  {c ? <span className={`fw-bold ${c.correta ? "text-success" : "text-danger"}`}>{c.correta ? "Acertou!" : `Gabarito oficial: ${c.gabarito}`}</span> : <span />}
                  {!c && <button className="btn btn-primary" disabled={!selecao[q.indice]} onClick={() => conferir(q)}>Conferir resposta</button>}
                </div>
              </div>
            );
          })}
          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-suave" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}><i className="fa-solid fa-arrow-left me-2"></i>Anterior</button>
            <span className="small text-suave">Página {pagina + 1} de {dados.paginas} · {dados.total} questões</span>
            <button className="btn btn-suave" disabled={pagina + 1 >= dados.paginas} onClick={() => setPagina(pagina + 1)}>Próxima<i className="fa-solid fa-arrow-right ms-2"></i></button>
          </div>
          <p className="small text-suave mt-3">{dados.fonte}</p>
        </>
      ) : <div className="av-card"><EstadoVazio icone="fa-layer-group" titulo="Nenhuma questão encontrada" texto="Altere a edição ou a área." /></div>)}
    </Layout>
  );
}

export default QuestoesEnem;
