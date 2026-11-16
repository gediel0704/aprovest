import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import api from "../../services/api";
import useApi from "../../utils/useApi";
import styles from "./Biblioteca.module.css";

// UC014 - Consultar conteúdos (resumos internos elaborados a partir das matrizes e programas oficiais)
function Biblioteca() {
  const [params] = useSearchParams();
  const [vestibular, setVestibular] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [busca, setBusca] = useState(params.get("busca") || "");
  const [termo, setTermo] = useState(params.get("busca") || "");
  const [disciplinas, setDisciplinas] = useState([]);
  const url = `/conteudos/biblioteca?vestibular=${vestibular}&disciplinaId=${disciplinaId}&busca=${encodeURIComponent(termo)}`;
  const { dados, carregando, erro } = useApi(url, [url]);

  useEffect(() => {
    api.get("/publico/catalogo").then((r) => setDisciplinas(r.data.data.disciplinas)).catch(() => {});
  }, []);

  const concluidos = dados?.filter((m) => m.concluido).length || 0;

  return (
    <Layout title="Biblioteca" subtitulo="Resumos de estudo elaborados a partir da Matriz do ENEM e dos programas da FUVEST e da Unicamp.">
      <div className="av-card mb-4">
        <form className="row g-2" onSubmit={(e) => { e.preventDefault(); setTermo(busca); }}>
          <div className="col-md-5">
            <input className="form-control" placeholder="Buscar conteúdo" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar conteúdo" />
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={vestibular} onChange={(e) => setVestibular(e.target.value)} aria-label="Vestibular">
              <option value="">Todos os vestibulares</option><option>ENEM</option><option>FUVEST</option><option value="UNICAMP">Unicamp</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} aria-label="Disciplina">
              <option value="">Todas as disciplinas</option>
              {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div className="col-md-1 d-grid"><button className="btn btn-primary" aria-label="Buscar"><i className="fa-solid fa-magnifying-glass"></i></button></div>
        </form>
      </div>
      {dados && dados.length > 0 && (
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="av-progresso flex-grow-1"><span style={{ width: `${(concluidos * 100) / dados.length}%` }}></span></div>
          <small className="fw-semibold">{concluidos}/{dados.length} lidos</small>
        </div>
      )}
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (dados.length ? (
        <div className="row g-3">
          {dados.map((m) => (
            <div className="col-md-6 col-xl-4" key={m.id}>
              <Link to={`/aluno/biblioteca/${m.id}`} className={`av-card av-card-hover h-100 ${styles.material}`}>
                <div className="d-flex justify-content-between gap-2 mb-2">
                  <span className="av-selo av-selo-primario">{m.disciplina || "Geral"}</span>
                  {m.concluido ? <span className="av-selo av-selo-sucesso"><i className="fa-solid fa-check"></i>Lido</span> : <span className="av-selo">{m.vestibular || "Todos"}</span>}
                </div>
                <h3 className="h6">{m.titulo}</h3>
                <p className="small text-suave mb-3">{m.resumo}</p>
                <small className={styles.fonte}><i className="fa-solid fa-building-columns me-1"></i>{m.fonteOrgao}</small>
              </Link>
            </div>
          ))}
        </div>
      ) : <div className="av-card"><EstadoVazio icone="fa-book-open" titulo="Nenhum conteúdo encontrado" texto="Tente outra busca ou outro filtro." /></div>)}
    </Layout>
  );
}

export default Biblioteca;
