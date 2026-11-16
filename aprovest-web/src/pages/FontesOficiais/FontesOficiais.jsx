import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import SeletorVestibular from "../../components/SeletorVestibular/SeletorVestibular";
import useApi from "../../utils/useApi";
import styles from "./FontesOficiais.module.css";

const TIPOS = { PROVA: ["Provas", "fa-file-lines"], GABARITO: ["Gabaritos", "fa-square-check"], MATRIZ: ["Matrizes", "fa-sitemap"],
  EDITAL: ["Editais e manuais", "fa-scroll"], GUIA_REDACAO: ["Redação", "fa-pen-nib"], MATERIAL_OFICIAL: ["Materiais", "fa-book"] };

// UC016 - Consultar fontes oficiais (catálogo de links para INEP, FUVEST e Comvest)
function FontesOficiais() {
  const [vestibular, setVestibular] = useState("ENEM");
  const [tipo, setTipo] = useState("");
  const url = `/conteudos/fontes-oficiais?vestibular=${vestibular}&tipo=${tipo}`;
  const { dados, carregando, erro } = useApi(url, [url]);

  return (
    <Layout title="Fontes oficiais" subtitulo="Documentos publicados pelos órgãos responsáveis por cada vestibular.">
      <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4">
        <SeletorVestibular valor={vestibular} onChange={setVestibular} />
        <select className="form-select w-auto" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo de documento">
          <option value="">Todos os tipos</option>
          {Object.entries(TIPOS).map(([k, [n]]) => <option key={k} value={k}>{n}</option>)}
        </select>
      </div>
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (dados.length ? (
        <div className="row g-3">
          {dados.map((f) => (
            <div className="col-md-6" key={f.id}>
              <a href={f.fonteUrl} target="_blank" rel="noreferrer" className={`av-card av-card-hover h-100 ${styles.fonte}`}>
                <div className="av-icone-circulo"><i className={`fa-solid ${(TIPOS[f.tipo] || TIPOS.MATERIAL_OFICIAL)[1]}`}></i></div>
                <div className="flex-grow-1">
                  <div className="d-flex gap-2 mb-1 flex-wrap">
                    <span className="av-selo av-selo-primario">{f.fonteOrgao}</span>
                    {f.ano && <span className="av-selo">{f.ano}</span>}
                    <span className="av-selo">{(TIPOS[f.tipo] || ["Documento"])[0]}</span>
                  </div>
                  <h3 className="h6 mb-1">{f.titulo}</h3>
                  <p className="small text-suave mb-0">{f.resumo}</p>
                </div>
                <i className="fa-solid fa-arrow-up-right-from-square text-suave"></i>
              </a>
            </div>
          ))}
        </div>
      ) : <div className="av-card"><EstadoVazio icone="fa-building-columns" titulo="Nenhuma referência para este filtro" texto="As referências apontam para os sites oficiais; o AproVest não inventa conteúdo." /></div>)}
      <p className="small text-suave mt-4 mb-0"><i className="fa-solid fa-circle-info me-1"></i>Os links abrem os sites oficiais. Se algum estiver fora do ar, a indisponibilidade é do órgão responsável.</p>
    </Layout>
  );
}

export default FontesOficiais;
