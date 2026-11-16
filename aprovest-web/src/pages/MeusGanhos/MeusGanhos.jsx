import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import CartaoEstatistica from "../../components/CartaoEstatistica/CartaoEstatistica";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarMoeda } from "../../utils/formatar";

// UC040 - Consultar remunerações (registro; nenhuma transferência é executada)
function MeusGanhos() {
  const { dados, carregando, erro } = useApi("/corretor/ganhos");
  return (
    <Layout title="Meus ganhos" subtitulo="Valores registrados por correção concluída.">
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-6"><CartaoEstatistica icone="fa-sack-dollar" rotulo="Total registrado" cor="sucesso" valor={formatarMoeda(dados.total)} /></div>
            <div className="col-md-6"><CartaoEstatistica icone="fa-pen-nib" rotulo="Correções remuneradas" valor={dados.quantidade} /></div>
          </div>
          <div className="av-card">
            {dados.registros.length ? (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead><tr><th>Data</th><th>Redação</th><th>Banca</th><th>Situação</th><th>Valor</th></tr></thead>
                  <tbody>
                    {dados.registros.map((r) => (
                      <tr key={r.id}><td>{formatarDataHora(r.data)}</td><td>{r.redacao}</td><td>{r.vestibular}</td>
                        <td><span className="av-selo av-selo-info">{r.status === "PAGO" ? "Pago" : "Registrado"}</span></td><td><strong>{formatarMoeda(r.valor)}</strong></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EstadoVazio icone="fa-sack-dollar" titulo="Nenhum registro" texto="Os valores aparecem após cada devolutiva concluída." />}
            <small className="text-suave d-block mt-3"><i className="fa-solid fa-circle-info me-1"></i>{dados.regra}</small>
          </div>
        </>
      )}
    </Layout>
  );
}

export default MeusGanhos;
