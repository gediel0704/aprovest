import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import TextoFormatado from "../../components/TextoFormatado/TextoFormatado";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";

// UC014 - Ler conteúdo + UC015 - Marcar leitura (concluído / não concluído)
function Material() {
  const { id } = useParams();
  const { dados: m, carregando, erro, setDados } = useApi(`/conteudos/${id}`, [id]);
  const [salvando, setSalvando] = useState(false);
  const [falha, setFalha] = useState("");

  const marcar = async (concluido) => {
    setSalvando(true);
    setFalha("");
    try {
      const r = await api.put(`/conteudos/${id}/leitura?concluido=${concluido}`);
      setDados(r.data.data);
    } catch (e) {
      setFalha(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout title={m?.titulo || "Conteúdo"} subtitulo={m?.resumo}
      acoes={<Link to="/aluno/biblioteca" className="btn btn-suave"><i className="fa-solid fa-arrow-left me-2"></i>Biblioteca</Link>}>
      {carregando && <Carregando />}
      {(erro || falha) && <div className="alert alert-danger">{erro || falha}</div>}
      {m && (
        <div className="row g-4">
          <div className="col-lg-8">
            <article className="av-card">
              <TextoFormatado texto={m.conteudo} />
            </article>
          </div>
          <div className="col-lg-4">
            <div className="av-card mb-3">
              <div className="av-titulo-secao"><i className="fa-solid fa-book-open-reader text-primary"></i> Progresso</div>
              {m.concluido ? (
                <>
                  <p className="text-success fw-semibold"><i className="fa-solid fa-circle-check me-2"></i>Leitura concluída</p>
                  <button className="btn btn-suave w-100" disabled={salvando} onClick={() => marcar(false)}>Marcar como não concluído</button>
                </>
              ) : (
                <button className="btn btn-gradiente w-100" disabled={salvando} onClick={() => marcar(true)}>
                  <i className="fa-solid fa-check me-2"></i>Concluir leitura
                </button>
              )}
            </div>
            <div className="av-card">
              <div className="av-titulo-secao"><i className="fa-solid fa-building-columns text-primary"></i> Referência</div>
              <p className="small text-suave">{m.fonteOrgao}</p>
              {m.fonteUrl && <a href={m.fonteUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-suave w-100">Abrir documento oficial <i className="fa-solid fa-arrow-up-right-from-square ms-1"></i></a>}
              <p className="small text-suave mt-3 mb-0">Conteúdo interno do AproVest, identificado separadamente das fontes oficiais.</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Material;
