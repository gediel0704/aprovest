import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarNumero, STATUS_AVALIACAO } from "../../utils/formatar";

const MODOS = { DIAGNOSTICO: "Diagnóstico", BANCA: "Banca", SIMULADO: "Simulado" };

// RF15 / UC019 - Consultar histórico (impressão opcional pelo navegador)
function Historico() {
  const [aba, setAba] = useState("sessoes");
  const [pagina, setPagina] = useState(0);
  const { dados, carregando, erro } = useApi(`/painel/historico?pagina=${pagina}`, [pagina]);

  return (
    <Layout title="Histórico" subtitulo="Todas as suas sessões, respostas e redações avaliadas."
      acoes={<button className="btn btn-suave" onClick={() => window.print()}><i className="fa-solid fa-print me-2"></i>Imprimir</button>}>
      <ul className="nav nav-pills mb-3 nao-imprimir">
        {[["sessoes", "Sessões"], ["respostas", "Respostas"], ["avaliacoes", "Redações"]].map(([k, n]) => (
          <li className="nav-item" key={k}><button className={`nav-link ${aba === k ? "active" : ""}`} onClick={() => setAba(k)}>{n}</button></li>
        ))}
      </ul>
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (
        <div className="av-card">
          {aba === "sessoes" && (dados.sessoes.length ? (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead><tr><th>Início</th><th>Tipo</th><th>Vestibular</th><th>Situação</th><th>Acertos</th><th>Nota</th><th>Percentil</th><th className="nao-imprimir"></th></tr></thead>
                <tbody>
                  {dados.sessoes.map((s) => (
                    <tr key={s.id}>
                      <td>{formatarDataHora(s.iniciadaEm)}</td>
                      <td>{MODOS[s.modo]}{s.tipoSimulado ? ` ${s.tipoSimulado.toLowerCase()}` : ""}</td>
                      <td>{s.vestibular}</td>
                      <td><span className={`av-selo ${s.status === "CONCLUIDA" ? "av-selo-sucesso" : s.status === "EXPIRADA" ? "av-selo-alerta" : "av-selo-info"}`}>{{ CONCLUIDA: "Concluída", EXPIRADA: "Expirada", EM_ANDAMENTO: "Em andamento" }[s.status]}</span></td>
                      <td>{s.acertos}/{s.totalQuestoes}</td>
                      <td>{formatarNumero(s.notaEstimada, 1)}</td>
                      <td>{s.percentil != null ? `${formatarNumero(s.percentil)}º` : "-"}</td>
                      <td className="text-end nao-imprimir">
                        <Link className="btn btn-sm btn-suave" to={s.status === "EM_ANDAMENTO" ? `/aluno/sessao/${s.id}` : `/aluno/sessao/${s.id}/resultado`}>
                          {s.status === "EM_ANDAMENTO" ? "Continuar" : "Ver"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EstadoVazio icone="fa-clock-rotate-left" titulo="Sem registros" texto="Seu histórico aparece aqui após o primeiro diagnóstico ou banca." />)}

          {aba === "respostas" && (dados.respostas.length ? (
            <>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead><tr><th>Data</th><th>Origem</th><th>Disciplina</th><th>Questão</th><th>Marcada</th><th>Resultado</th></tr></thead>
                  <tbody>
                    {dados.respostas.map((r, i) => (
                      <tr key={i}>
                        <td>{formatarDataHora(r.data)}</td>
                        <td>{MODOS[r.modo]} · {r.vestibular}</td>
                        <td>{r.disciplina}</td>
                        <td><small>{r.fonte}</small></td>
                        <td>{r.marcada}</td>
                        <td>{r.correta ? <span className="av-selo av-selo-sucesso">Acerto</span> : <span className="av-selo av-selo-perigo">Erro</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3 nao-imprimir">
                <button className="btn btn-sm btn-suave" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
                <small className="text-suave">Página {pagina + 1} de {dados.paginas} · {dados.totalRespostas} respostas</small>
                <button className="btn btn-sm btn-suave" disabled={pagina + 1 >= dados.paginas} onClick={() => setPagina(pagina + 1)}>Próxima</button>
              </div>
            </>
          ) : <EstadoVazio icone="fa-list" titulo="Nenhuma resposta registrada" />)}

          {aba === "avaliacoes" && (dados.avaliacoes.length ? (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead><tr><th>Data</th><th>Redação</th><th>Banca</th><th>Tipo</th><th>Situação</th><th>Nota</th></tr></thead>
                <tbody>
                  {dados.avaliacoes.map((a) => (
                    <tr key={a.id}>
                      <td>{formatarDataHora(a.solicitadaEm)}</td>
                      <td><Link to={`/aluno/avaliacoes/${a.id}`}>{a.tituloSnapshot}</Link></td>
                      <td>{a.vestibular.sigla}</td>
                      <td>{a.tipo === "IA" ? "IA" : "Humana"}</td>
                      <td>{STATUS_AVALIACAO[a.status].texto}</td>
                      <td>{a.notaTotal !== null ? `${formatarNumero(a.notaTotal)}/${formatarNumero(a.notaMaxima)}` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EstadoVazio icone="fa-pen-nib" titulo="Nenhuma redação avaliada" />)}
        </div>
      )}
    </Layout>
  );
}

export default Historico;
