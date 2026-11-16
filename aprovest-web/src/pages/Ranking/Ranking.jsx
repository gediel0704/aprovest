import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import useApi from "../../utils/useApi";
import { formatarNumero } from "../../utils/formatar";
import styles from "./Ranking.module.css";

const mesAtual = () => new Date().toISOString().slice(0, 7);

// RF12 - Ranking mensal e bolsa por mérito (1 mês de Pro para os 100 primeiros)
function Ranking() {
  const [mes, setMes] = useState(mesAtual());
  const { dados, carregando, erro } = useApi(`/painel/ranking?mes=${mes}`, [mes]);
  const podio = dados?.ranking.slice(0, 3) || [];

  return (
    <Layout title="Ranking e bolsas" subtitulo="Os 100 primeiros do mês ganham 1 mês de Plano Pro.">
      <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4">
        <input type="month" className="form-control w-auto" value={mes} max={mesAtual()} onChange={(e) => setMes(e.target.value)} aria-label="Mês do ranking" />
        {dados && (
          <div className="av-card py-2 px-3">
            {dados.participando
              ? <span><i className="fa-solid fa-user me-2 text-primary"></i>Sua posição: <strong>{dados.minhaPosicao ? `${dados.minhaPosicao}º` : "ainda sem pontos"}</strong></span>
              : <span>Você optou por não aparecer no ranking. <Link to="/configuracoes">Alterar</Link></span>}
          </div>
        )}
      </div>
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (dados.ranking.length ? (
        <>
          <div className={styles.podio}>
            {[1, 0, 2].map((i) => podio[i] && (
              <div key={i} className={`${styles.lugar} ${styles["p" + (i + 1)]}`}>
                <span className={styles.medalha}><i className="fa-solid fa-medal"></i></span>
                <strong>{podio[i].nome}</strong>
                <small>{formatarNumero(podio[i].pontos, 1)} pts</small>
                <div className={styles.degrau}>{i + 1}º</div>
              </div>
            ))}
          </div>
          <div className="av-card">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead><tr><th>Posição</th><th>Aluno</th><th>Acertos</th><th>Pontos</th></tr></thead>
                <tbody>
                  {dados.ranking.map((r) => (
                    <tr key={r.posicao} className={r.voce ? styles.voce : ""}>
                      <td><strong>{r.posicao}º</strong></td>
                      <td>{r.nome} {r.voce && <span className="av-selo av-selo-primario ms-1">Você</span>}</td>
                      <td>{r.acertos}</td>
                      <td>{formatarNumero(r.pontos, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : <div className="av-card"><EstadoVazio icone="fa-trophy" titulo="Ranking vazio neste mês" texto="Responda questões para pontuar." /></div>)}
      {dados && <p className="small text-suave mt-3"><i className="fa-solid fa-circle-info me-1"></i>{dados.regra}</p>}
    </Layout>
  );
}

export default Ranking;
