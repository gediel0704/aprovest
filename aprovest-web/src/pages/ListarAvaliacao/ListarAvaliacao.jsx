import { Link } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarNumero, STATUS_AVALIACAO } from "../../utils/formatar";

// UC026 - Consultar avaliações de redação
function ListarAvaliacao() {
  const { dados, carregando, erro } = useApi("/redacoes/avaliacoes");
  return (
    <Layout title="Avaliações de redação" subtitulo="Histórico de correções por IA e humanas, com a versão do texto enviada.">
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (dados.length ? (
        <div className="av-card">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Redação</th><th>Banca</th><th>Tipo</th><th>Solicitada</th><th>Situação</th><th>Nota</th><th></th></tr></thead>
              <tbody>
                {dados.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.tituloSnapshot}</strong><br /><small className="text-suave">{a.temaSnapshot}</small></td>
                    <td>{a.vestibular.sigla}</td>
                    <td>{a.tipo === "IA" ? <><i className="fa-solid fa-robot me-1 text-primary"></i>IA</> : <><i className="fa-solid fa-user-check me-1 text-success"></i>Humana</>}</td>
                    <td>{formatarDataHora(a.solicitadaEm)}</td>
                    <td><span className={`av-selo ${STATUS_AVALIACAO[a.status].classe}`}><i className={`fa-solid ${STATUS_AVALIACAO[a.status].icone}`}></i>{STATUS_AVALIACAO[a.status].texto}</span></td>
                    <td><strong>{a.notaTotal !== null ? formatarNumero(a.notaTotal) : "-"}</strong>{a.notaMaxima && <small className="text-suave">/{formatarNumero(a.notaMaxima)}</small>}</td>
                    <td className="text-end"><Link className="btn btn-sm btn-suave" to={`/aluno/avaliacoes/${a.id}`}>Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="av-card"><EstadoVazio icone="fa-clipboard-check" titulo="Nenhuma avaliação ainda" texto="Abra uma redação do caderno e solicite a correção.">
          <Link to="/aluno/redacoes" className="btn btn-primary">Ir para o caderno</Link></EstadoVazio></div>
      ))}
    </Layout>
  );
}

export default ListarAvaliacao;
