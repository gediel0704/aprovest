import { Link } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import CartaoEstatistica from "../../components/CartaoEstatistica/CartaoEstatistica";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarNumero } from "../../utils/formatar";

// UC027 - Consultar fila docente (somente as correções atribuídas ao professor)
function HomeCorretor() {
  const fila = useApi("/corretor/fila");
  const concluidas = useApi("/corretor/concluidas");
  const atrasadas = (fila.dados || []).filter((a) => new Date(a.prazo) < new Date()).length;

  return (
    <Layout title="Fila de correções" subtitulo="Redações atribuídas a você pela administração.">
      <div className="row g-3 mb-4">
        <div className="col-md-4"><CartaoEstatistica icone="fa-inbox" rotulo="Na fila" valor={fila.dados?.length ?? "-"} /></div>
        <div className="col-md-4"><CartaoEstatistica icone="fa-triangle-exclamation" rotulo="Prazo vencido" cor="perigo" valor={atrasadas} detalhe="prazo de 72 horas" /></div>
        <div className="col-md-4"><CartaoEstatistica icone="fa-circle-check" rotulo="Concluídas" cor="sucesso" valor={concluidas.dados?.length ?? "-"} /></div>
      </div>
      <div className="av-card mb-4">
        <div className="av-titulo-secao"><i className="fa-solid fa-hourglass-half text-primary"></i> Aguardando sua devolutiva</div>
        {fila.carregando ? <Carregando /> : fila.erro ? <div className="alert alert-danger">{fila.erro}</div> : fila.dados.length ? (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Redação</th><th>Banca</th><th>Solicitada</th><th>Prazo</th><th></th></tr></thead>
              <tbody>
                {fila.dados.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.tituloSnapshot}</strong><br /><small className="text-suave">{a.temaSnapshot}</small></td>
                    <td>{a.vestibular.sigla}</td>
                    <td>{formatarDataHora(a.solicitadaEm)}</td>
                    <td><span className={`av-selo ${new Date(a.prazo) < new Date() ? "av-selo-perigo" : "av-selo-alerta"}`}>{formatarDataHora(a.prazo)}</span></td>
                    <td className="text-end"><Link to={`/corretor/correcao/${a.id}`} className="btn btn-sm btn-primary">Corrigir</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EstadoVazio icone="fa-mug-hot" titulo="Fila vazia" texto="Nenhuma redação atribuída no momento." />}
      </div>
      <div className="av-card">
        <div className="av-titulo-secao"><i className="fa-solid fa-circle-check text-success"></i> Concluídas recentemente</div>
        {concluidas.dados?.length ? concluidas.dados.slice(0, 10).map((a) => (
          <div key={a.id} className="d-flex justify-content-between border-bottom py-2">
            <span>{a.tituloSnapshot} <small className="text-suave">· {a.vestibular.sigla} · {formatarDataHora(a.concluidaEm)}</small></span>
            <strong>{formatarNumero(a.notaTotal)}/{formatarNumero(a.notaMaxima)}</strong>
          </div>
        )) : <p className="text-suave mb-0">Nenhuma correção concluída.</p>}
      </div>
    </Layout>
  );
}

export default HomeCorretor;
