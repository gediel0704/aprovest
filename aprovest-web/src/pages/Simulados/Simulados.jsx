import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import Modal from "../../components/Modal/Modal";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarNumero } from "../../utils/formatar";
import styles from "./Simulados.module.css";

const TIPOS = {
  SEMANAL: { nome: "Simulado semanal", questoes: 30, minutos: 60, icone: "fa-calendar-week" },
  MENSAL: { nome: "Simulado mensal", questoes: 60, minutos: 120, icone: "fa-calendar" },
};

// RF06 / UC013 - Simulado preditivo cronometrado
function Simulados() {
  const status = useApi("/estudo/status");
  const historico = useApi("/painel/historico");
  const [escolha, setEscolha] = useState(null);
  const [usarCredito, setUsarCredito] = useState(false);
  const [falha, setFalha] = useState("");
  const [iniciando, setIniciando] = useState(false);
  const navigate = useNavigate();

  const simulados = (historico.dados?.sessoes || []).filter((s) => s.modo === "SIMULADO");
  const disponivel = (tipo) => (tipo === "SEMANAL" ? status.dados?.simuladoSemanalDisponivel : status.dados?.simuladoMensalDisponivel);

  const iniciar = async () => {
    setFalha("");
    setIniciando(true);
    try {
      const r = await api.post("/estudo/simulados", { vestibular: escolha.sigla, tipoSimulado: escolha.tipo, usarCredito });
      navigate(`/aluno/sessao/${r.data.data.id}`);
    } catch (error) {
      setFalha(mensagemErro(error));
    } finally {
      setIniciando(false);
    }
  };

  return (
    <Layout title="Simulados" subtitulo="Simulados cronometrados com nota projetada e percentil entre alunos com a mesma meta.">
      {status.carregando && <Carregando />}
      {status.dados && (
        <div className="row g-4 mb-4">
          {Object.entries(TIPOS).map(([tipo, t]) => (
            <div className="col-lg-6" key={tipo}>
              <div className={`av-card h-100 ${styles.tipo}`}>
                <div className="d-flex gap-3 align-items-center mb-3">
                  <div className="av-icone-circulo"><i className={`fa-solid ${t.icone}`}></i></div>
                  <div>
                    <h2 className="h5 mb-0">{t.nome}</h2>
                    <small className="text-suave">Até {t.questoes} questões oficiais · {t.minutos} minutos</small>
                  </div>
                  <span className={`av-selo ms-auto ${disponivel(tipo) ? "av-selo-sucesso" : "av-selo-alerta"}`}>
                    {disponivel(tipo) ? "Disponível" : "Usado no período"}
                  </span>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  {status.dados.vestibulares.map((v) => (
                    v.sessaoAbertaSIMULADO ? (
                      <button key={v.sigla} className="btn btn-primary" onClick={() => navigate(`/aluno/sessao/${v.sessaoAbertaSIMULADO}`)}>
                        Continuar {v.sigla}
                      </button>
                    ) : (
                      <button key={v.sigla} className="btn btn-suave" onClick={() => { setUsarCredito(false); setFalha(""); setEscolha({ tipo, sigla: v.sigla }); }}>
                        {v.sigla === "UNICAMP" ? "Unicamp" : v.sigla}
                      </button>
                    )
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="av-card">
        <div className="av-titulo-secao"><i className="fa-solid fa-clock-rotate-left text-primary"></i> Meus simulados</div>
        {historico.carregando ? <Carregando /> : simulados.length ? (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Data</th><th>Vestibular</th><th>Tipo</th><th>Acertos</th><th>Nota projetada</th><th>Percentil</th><th></th></tr></thead>
              <tbody>
                {simulados.map((s) => (
                  <tr key={s.id}>
                    <td>{formatarDataHora(s.iniciadaEm)}</td>
                    <td><strong>{s.vestibular}</strong></td>
                    <td>{s.tipoSimulado === "MENSAL" ? "Mensal" : "Semanal"}</td>
                    <td>{s.status === "EM_ANDAMENTO" ? "-" : `${s.acertos}/${s.totalQuestoes}`}</td>
                    <td>{formatarNumero(s.notaEstimada, 1)}</td>
                    <td>{s.percentil != null ? `${formatarNumero(s.percentil, 0)}º` : <small className="text-suave">insuficiente</small>}</td>
                    <td className="text-end">
                      {s.status === "EM_ANDAMENTO"
                        ? <Link to={`/aluno/sessao/${s.id}`} className="btn btn-sm btn-primary">Continuar</Link>
                        : <Link to={`/aluno/sessao/${s.id}/resultado`} className="btn btn-sm btn-suave">Resultado</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EstadoVazio icone="fa-stopwatch" titulo="Nenhum simulado ainda" texto="Faça seu primeiro simulado para descobrir seu percentil." />}
      </div>

      <Modal isOpen={!!escolha} onClose={() => setEscolha(null)} onConfirm={iniciar} carregando={iniciando}
        titulo={escolha ? `${TIPOS[escolha.tipo].nome} · ${escolha.sigla}` : ""} textoConfirmar="Começar agora">
        {escolha && (
          <>
            <p className="text-suave">
              Você terá <strong>{TIPOS[escolha.tipo].minutos} minutos</strong>. O tempo é controlado pelo servidor: ao expirar, o simulado é encerrado
              com as respostas registradas. O gabarito aparece apenas no resultado.
            </p>
            {!disponivel(escolha.tipo) && (
              <div className="alert alert-warning">
                Você já usou o simulado {escolha.tipo === "SEMANAL" ? "semanal" : "mensal"} gratuito deste período.
                <div className="form-check mt-2">
                  <input className="form-check-input" type="checkbox" id="credito" checked={usarCredito} onChange={(e) => setUsarCredito(e.target.checked)} />
                  <label className="form-check-label" htmlFor="credito">Usar 1 crédito para um simulado extra (saldo: {status.dados?.creditos})</label>
                </div>
              </div>
            )}
            {falha && <div className="alert alert-danger">{falha}</div>}
          </>
        )}
      </Modal>
    </Layout>
  );
}

export default Simulados;
