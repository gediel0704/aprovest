import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import api from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarDataHora } from "../../utils/formatar";
import styles from "./Notificacoes.module.css";

const ICONES = { BANCA: "fa-bolt", REDACAO: "fa-pen-nib", SIMULADO: "fa-stopwatch", NOVIDADE: "fa-bullhorn", SISTEMA: "fa-circle-info" };

// RF13 / UC007 - Consultar notificações e marcar como lidas
function Notificacoes() {
  const { dados, carregando, erro, setDados } = useApi("/notificacoes");
  const navigate = useNavigate();

  const abrir = async (n) => {
    if (!n.lida) {
      await api.put(`/notificacoes/${n.id}/lida`).catch(() => {});
      setDados(dados.map((x) => (x.id === n.id ? { ...x, lida: true } : x)));
    }
    if (n.link) navigate(n.link);
  };

  const todasLidas = async () => {
    await api.put("/notificacoes/lidas").catch(() => {});
    setDados(dados.map((x) => ({ ...x, lida: true })));
  };

  return (
    <Layout title="Notificações" subtitulo="Banca diária, correções, simulados e novidades da plataforma."
      acoes={dados?.some((n) => !n.lida) && <button className="btn btn-suave" onClick={todasLidas}><i className="fa-solid fa-check-double me-2"></i>Marcar todas como lidas</button>}>
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (dados.length ? (
        <div className="av-card p-2">
          {dados.map((n) => (
            <button key={n.id} className={`${styles.item} ${n.lida ? "" : styles.naoLida}`} onClick={() => abrir(n)}>
              <span className="av-icone-circulo"><i className={`fa-solid ${ICONES[n.tipo] || "fa-bell"}`}></i></span>
              <span className={styles.corpo}><strong>{n.titulo}</strong><span>{n.mensagem}</span><small>{formatarDataHora(n.criadoEm)}</small></span>
              {!n.lida && <span className={styles.ponto} aria-label="Não lida"></span>}
            </button>
          ))}
        </div>
      ) : <div className="av-card"><EstadoVazio icone="fa-bell-slash" titulo="Sem avisos por aqui" texto="Quando houver novidades, elas aparecerão nesta página." /></div>)}
    </Layout>
  );
}

export default Notificacoes;
