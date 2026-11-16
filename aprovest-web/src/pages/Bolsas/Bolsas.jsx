import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import Modal from "../../components/Modal/Modal";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarNumero } from "../../utils/formatar";

const mesAnterior = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); };

// RF12 / UC036 - Conceder bolsas por mérito (1 mês de Pro aos 100 primeiros do mês encerrado)
function Bolsas() {
  const { dados, carregando, erro, recarregar } = useApi("/admin/bolsas");
  const [mes, setMes] = useState(mesAnterior());
  const [confirmar, setConfirmar] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [falha, setFalha] = useState("");

  const conceder = async () => {
    setFalha("");
    try {
      const r = await api.post("/admin/bolsas", { mes });
      setResultado(r.data.data);
      recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    }
    setConfirmar(false);
  };

  return (
    <Layout title="Bolsas por mérito" subtitulo="Concedidas automaticamente todo dia 1º; também podem ser processadas manualmente.">
      <div className="av-card mb-4 d-flex flex-wrap gap-3 align-items-end">
        <div><label className="form-label" htmlFor="mes">Mês encerrado</label><input id="mes" type="month" className="form-control" value={mes} max={mesAnterior()} onChange={(e) => setMes(e.target.value)} /></div>
        <button className="btn btn-gradiente" onClick={() => setConfirmar(true)}><i className="fa-solid fa-award me-2"></i>Conceder bolsas do mês</button>
      </div>
      {falha && <div className="alert alert-danger">{falha}</div>}
      {resultado && <div className="alert alert-success">{resultado.bolsasConcedidas} bolsa(s) concedida(s) para {resultado.mes}. {resultado.observacao}</div>}
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (dados.length ? (
        <div className="av-card">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Mês</th><th>Posição</th><th>Aluno</th><th>Pontuação</th><th>Concedida em</th></tr></thead>
              <tbody>{dados.map((b) => <tr key={b.id}><td>{b.mesReferencia}</td><td>{b.posicao}º</td><td>{b.alunoNome}</td><td>{formatarNumero(b.pontuacao, 1)}</td><td>{formatarDataHora(b.concedidaEm)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      ) : <div className="av-card"><EstadoVazio icone="fa-award" titulo="Nenhuma bolsa concedida ainda" /></div>)}
      <Modal isOpen={confirmar} onClose={() => setConfirmar(false)} onConfirm={conceder} titulo={`Conceder bolsas de ${mes}?`} textoConfirmar="Conceder"
        mensagem="Os até 100 primeiros alunos do ranking (que consentiram em participar) recebem 30 dias de Plano Pro e uma notificação. A operação não pode ser repetida para o mesmo mês." />
    </Layout>
  );
}

export default Bolsas;
