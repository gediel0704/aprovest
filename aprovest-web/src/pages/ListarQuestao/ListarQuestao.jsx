import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import Modal from "../../components/Modal/Modal";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";

// RF08 / UC032 - Banco de questões: listar, filtrar, arquivar (sem exclusão física) e republicar
function ListarQuestao() {
  const [catalogo, setCatalogo] = useState(null);
  const [filtros, setFiltros] = useState({ vestibularId: "", disciplinaId: "", ativa: "", busca: "" });
  const [aplicados, setAplicados] = useState(filtros);
  const [pagina, setPagina] = useState(0);
  const qs = new URLSearchParams({ ...aplicados, pagina }).toString();
  const { dados, carregando, erro, recarregar } = useApi(`/admin/questoes?${qs}`, [qs]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questaoAlvo, setQuestaoAlvo] = useState(null);
  const [falha, setFalha] = useState("");
  const navigate = useNavigate();

  useEffect(() => { api.get("/publico/catalogo").then((r) => setCatalogo(r.data.data)); }, []);

  const openModal = (q) => { setQuestaoAlvo(q); setIsModalOpen(true); };

  const alterarPublicacao = async () => {
    try {
      await api.put(`/admin/questoes/${questaoAlvo.id}/publicacao?ativa=${!questaoAlvo.ativa}`);
      recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    }
    setIsModalOpen(false);
  };

  return (
    <Layout title="Banco de questões" subtitulo="Questões oficiais e autorais classificadas por vestibular, disciplina e tópico (RN04)."
      acoes={<>
        <Link to="/admin/questoes/nova" className="btn btn-gradiente"><i className="fa-solid fa-plus me-2"></i>Nova questão</Link>
        <Link to="/admin/questoes/importar" className="btn btn-suave"><i className="fa-solid fa-file-import me-2"></i>Importar lote</Link>
      </>}>
      <form className="av-card mb-4 row g-2 mx-0" onSubmit={(e) => { e.preventDefault(); setPagina(0); setAplicados(filtros); }}>
        <div className="col-md-4"><input className="form-control" placeholder="Buscar no enunciado ou na fonte" value={filtros.busca} onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })} /></div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={filtros.vestibularId} onChange={(e) => setFiltros({ ...filtros, vestibularId: e.target.value })} aria-label="Vestibular">
            <option value="">Vestibular</option>{catalogo?.vestibulares.map((v) => <option key={v.id} value={v.id}>{v.sigla}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select className="form-select" value={filtros.disciplinaId} onChange={(e) => setFiltros({ ...filtros, disciplinaId: e.target.value })} aria-label="Disciplina">
            <option value="">Disciplina</option>{catalogo?.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={filtros.ativa} onChange={(e) => setFiltros({ ...filtros, ativa: e.target.value })} aria-label="Situação">
            <option value="">Situação</option><option value="true">Publicadas</option><option value="false">Arquivadas</option>
          </select>
        </div>
        <div className="col-6 col-md-1 d-grid"><button className="btn btn-primary" aria-label="Filtrar"><i className="fa-solid fa-filter"></i></button></div>
      </form>
      {(erro || falha) && <div className="alert alert-danger">{erro || falha}</div>}
      {carregando ? <Carregando /> : dados && (dados.content.length ? (
        <div className="av-card">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-success"><tr><th>#</th><th>Enunciado</th><th>Vestibular</th><th>Disciplina</th><th>Gab.</th><th>Acerto</th><th>Situação</th><th></th></tr></thead>
              <tbody>
                {dados.content.map((q) => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td style={{ maxWidth: 380 }}><div className="text-truncate">{q.enunciado}</div><small className="text-suave">{q.fonte}</small></td>
                    <td>{q.vestibular}</td>
                    <td>{q.disciplina}</td>
                    <td><strong>{q.gabarito}</strong></td>
                    <td>{q.taxaAcerto !== null ? `${q.taxaAcerto}%` : "-"}</td>
                    <td><span className={`av-selo ${q.ativa ? "av-selo-sucesso" : "av-selo-alerta"}`}>{q.ativa ? "Publicada" : "Arquivada"}</span></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-warning me-1" onClick={() => navigate(`/admin/questoes/${q.id}`)} aria-label="Editar"><i className="fas fa-edit"></i></button>
                      <button className={`btn btn-sm ${q.ativa ? "btn-danger" : "btn-success"}`} onClick={() => openModal(q)} aria-label={q.ativa ? "Arquivar" : "Publicar"}>
                        <i className={`fas ${q.ativa ? "fa-box-archive" : "fa-upload"}`}></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-sm btn-suave" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
            <small className="text-suave">Página {pagina + 1} de {dados.totalPages} · {dados.totalElements} questões</small>
            <button className="btn btn-sm btn-suave" disabled={pagina + 1 >= dados.totalPages} onClick={() => setPagina(pagina + 1)}>Próxima</button>
          </div>
        </div>
      ) : <div className="av-card"><EstadoVazio icone="fa-database" titulo="Nenhuma questão encontrada" /></div>)}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={alterarPublicacao} perigo={questaoAlvo?.ativa}
        titulo={questaoAlvo?.ativa ? "Arquivar questão?" : "Publicar questão?"} textoConfirmar={questaoAlvo?.ativa ? "Arquivar" : "Publicar"}
        mensagem={questaoAlvo?.ativa ? "A questão sai das bancas e simulados, mas não é excluída fisicamente (o histórico dos alunos é preservado)." : "A questão volta a ser usada em bancas e simulados."} />
    </Layout>
  );
}

export default ListarQuestao;
