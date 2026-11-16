import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import Modal from "../../components/Modal/Modal";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarNumero, STATUS_AVALIACAO } from "../../utils/formatar";

// UC034 - Atribuir correção humana a um corretor
function CorrecoesHumanas() {
  const [status, setStatus] = useState("PENDENTE");
  const { dados, carregando, erro, recarregar } = useApi(`/admin/correcoes?status=${status}`, [status]);
  const corretores = useApi("/admin/corretores");
  const [alvo, setAlvo] = useState(null);
  const [corretorId, setCorretorId] = useState("");
  const [falha, setFalha] = useState("");

  const atribuir = async () => {
    setFalha("");
    try {
      await api.put(`/admin/correcoes/${alvo.id}/atribuir`, { corretorId: Number(corretorId) });
      setAlvo(null);
      recarregar(true);
      corretores.recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    }
  };

  return (
    <Layout title="Correção humana" subtitulo="Distribua as solicitações entre os corretores credenciados (prazo de 72 horas).">
      <ul className="nav nav-pills mb-3">
        {["PENDENTE", "ATRIBUIDA", "CONCLUIDA"].map((s) => (
          <li className="nav-item" key={s}><button className={`nav-link ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>{STATUS_AVALIACAO[s].texto}</button></li>
        ))}
      </ul>
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (dados.length ? (
        <div className="av-card">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Redação</th><th>Aluno</th><th>Banca</th><th>Solicitada</th><th>Prazo</th><th>Corretor</th><th>Nota</th><th></th></tr></thead>
              <tbody>
                {dados.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.tituloSnapshot}</strong></td>
                    <td>{a.alunoNome}</td>
                    <td>{a.vestibular.sigla}</td>
                    <td>{formatarDataHora(a.solicitadaEm)}</td>
                    <td><span className={`av-selo ${new Date(a.prazo) < new Date() && a.status !== "CONCLUIDA" ? "av-selo-perigo" : ""}`}>{formatarDataHora(a.prazo)}</span></td>
                    <td>{a.corretorNome || "-"}</td>
                    <td>{a.notaTotal !== null ? `${formatarNumero(a.notaTotal)}/${formatarNumero(a.notaMaxima)}` : "-"}</td>
                    <td className="text-end text-nowrap">
                      {a.status !== "CONCLUIDA" && <button className="btn btn-sm btn-primary me-1" onClick={() => { setAlvo(a); setCorretorId(""); setFalha(""); }}>{a.status === "PENDENTE" ? "Atribuir" : "Reatribuir"}</button>}
                      <Link className="btn btn-sm btn-suave" to={`/corretor/correcao/${a.id}`}>Abrir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : <div className="av-card"><EstadoVazio icone="fa-user-check" titulo="Nenhuma solicitação nesta situação" /></div>)}
      <Modal isOpen={!!alvo} onClose={() => setAlvo(null)} onConfirm={atribuir} titulo="Atribuir correção" textoConfirmar="Atribuir">
        <p className="text-suave">{alvo?.tituloSnapshot}</p>
        <select className="form-select" value={corretorId} onChange={(e) => setCorretorId(e.target.value)} aria-label="Corretor">
          <option value="">Selecione o corretor</option>
          {corretores.dados?.map((c) => <option key={c.id} value={c.id}>{c.nome} · {c.fila} na fila</option>)}
        </select>
        {falha && <div className="alert alert-danger mt-2 mb-0">{falha}</div>}
      </Modal>
    </Layout>
  );
}

export default CorrecoesHumanas;
