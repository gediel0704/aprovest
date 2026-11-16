import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import Modal from "../../components/Modal/Modal";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarDataHora } from "../../utils/formatar";
import styles from "./ListarRedacao.module.css";

// UC020 - Consultar redações (busca por título ou tema e filtro de situação) + UC023 excluir
function ListarRedacao() {
  const { dados: redacoes, carregando, erro, setDados } = useApi("/redacoes");
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [idAExcluir, setIdAExcluir] = useState(null);
  const [falha, setFalha] = useState("");
  const navigate = useNavigate();

  const filtradas = (redacoes || []).filter((r) =>
    (!busca || `${r.titulo} ${r.tema}`.toLowerCase().includes(busca.toLowerCase())) && (!situacao || r.status === situacao));

  const openModal = (id) => { setIdAExcluir(id); setIsModalOpen(true); };

  const deleteRedacao = async () => {
    try {
      await api.delete(`/redacoes/${idAExcluir}`);
      setDados(redacoes.filter((r) => r.id !== idAExcluir));
    } catch (e) {
      setFalha(mensagemErro(e));
    }
    setIsModalOpen(false);
  };

  return (
    <Layout title="Caderno de redações" subtitulo="Seus textos ficam salvos; cada correção guarda uma cópia da versão enviada."
      acoes={<Link to="/aluno/redacoes/nova" className="btn btn-gradiente"><i className="fa-solid fa-plus me-2"></i>Nova redação</Link>}>
      <div className="av-card mb-4">
        <div className="row g-2">
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-transparent"><i className="fa-solid fa-magnifying-glass"></i></span>
              <input className="form-control" placeholder="Buscar por título ou tema" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar redação" />
            </div>
          </div>
          <div className="col-md-4">
            <select className="form-select" value={situacao} onChange={(e) => setSituacao(e.target.value)} aria-label="Filtrar situação">
              <option value="">Todas as situações</option>
              <option value="RASCUNHO">Rascunho</option>
              <option value="FINALIZADA">Finalizada</option>
            </select>
          </div>
        </div>
      </div>
      {carregando && <Carregando />}
      {(erro || falha) && <div className="alert alert-danger">{erro || falha}</div>}
      {redacoes && (filtradas.length ? (
        <div className="row g-3">
          {filtradas.map((r) => (
            <div className="col-md-6 col-xl-4" key={r.id}>
              <div className={`av-card av-card-hover h-100 ${styles.cartao}`}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="av-selo av-selo-primario">{r.vestibular.sigla}</span>
                  <span className={`av-selo ${r.status === "FINALIZADA" ? "av-selo-sucesso" : "av-selo-alerta"}`}>{r.status === "FINALIZADA" ? "Finalizada" : "Rascunho"}</span>
                </div>
                <h3 className="h6 mb-1">{r.titulo}</h3>
                <p className="small text-suave mb-2">{r.tema}</p>
                <p className={`small ${styles.previa}`}>{r.texto}</p>
                <div className="d-flex justify-content-between align-items-center mt-auto pt-2">
                  <small className="text-suave">{r.palavras} palavras · {formatarDataHora(r.atualizadoEm)}</small>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-suave" onClick={() => navigate(`/aluno/redacoes/${r.id}`)} aria-label="Visualizar e editar"><i className="fa-solid fa-pen"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => openModal(r.id)} aria-label="Excluir"><i className="fa-solid fa-trash"></i></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="av-card">
          <EstadoVazio icone="fa-pen-nib" titulo={redacoes.length ? "Nenhuma redação encontrada" : "Seu caderno está vazio"}
            texto={redacoes.length ? "Ajuste a busca ou o filtro." : "Escreva sua primeira redação e receba correção nas competências oficiais."}>
            {!redacoes.length && <Link to="/aluno/redacoes/nova" className="btn btn-primary">Escrever redação</Link>}
          </EstadoVazio>
        </div>
      ))}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={deleteRedacao} perigo textoConfirmar="Excluir"
        titulo="Excluir redação?" mensagem="O texto será removido do caderno. As avaliações já feitas continuam no histórico com a cópia enviada." />
    </Layout>
  );
}

export default ListarRedacao;
