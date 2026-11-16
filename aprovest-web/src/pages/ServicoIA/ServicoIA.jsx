import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarDataHora } from "../../utils/formatar";

// UC042 - Pausar/retomar o serviço de IA e RF18 - Sugestões de temas e questões com IA
function ServicoIA() {
  const { dados, carregando, erro, setDados } = useApi("/admin/ia");
  const [motivo, setMotivo] = useState("");
  const [sugestoes, setSugestoes] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [msg, setMsg] = useState({});

  const acao = async (url, corpo) => {
    setMsg({});
    try {
      await api.post(url, corpo);
      const r = await api.get("/admin/ia");
      setDados(r.data.data);
      setMsg({ tipo: "success", texto: "Estado do serviço atualizado." });
    } catch (e) {
      setMsg({ tipo: "danger", texto: mensagemErro(e) });
    }
  };

  const gerar = async () => {
    setGerando(true);
    setMsg({});
    try {
      const r = await api.post("/admin/ia/sugestoes", null, { timeout: 180000 });
      setSugestoes(r.data.data);
    } catch (e) {
      setMsg({ tipo: "danger", texto: mensagemErro(e) });
    } finally {
      setGerando(false);
    }
  };

  const aprovar = async (t) => {
    try {
      await api.post("/admin/ia/sugestoes/aprovar", t);
      setMsg({ tipo: "success", texto: `Tema "${t.titulo}" adicionado ao banco de temas (origem: SUGERIDO_IA).` });
    } catch (e) {
      setMsg({ tipo: "danger", texto: mensagemErro(e) });
    }
  };

  return (
    <Layout title="Serviço de IA" subtitulo="Controle operacional da correção por IA e sugestões de conteúdo para a equipe pedagógica.">
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {msg.texto && <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>}
      {dados && (
        <div className="row g-4 mb-4">
          <div className="col-lg-6">
            <div className="av-card h-100">
              <div className="av-titulo-secao"><i className="fa-solid fa-robot text-primary"></i> Situação</div>
              <p><strong>Provedor:</strong> {dados.configurada ? "Claude (Anthropic)" : "Sem chave de API: corretor offline por regras"}</p>
              <p><strong>Modelo:</strong> {dados.modelo}</p>
              <p className="mb-3"><strong>Estado:</strong> {dados.pausado ? <span className="av-selo av-selo-perigo">Pausado</span> : <span className="av-selo av-selo-sucesso">Ativo</span>}
                {dados.motivo && <small className="text-suave ms-2">({dados.motivo})</small>}</p>
              {dados.atualizadoEm && <small className="text-suave d-block mb-3">Última alteração: {formatarDataHora(dados.atualizadoEm)} por {dados.atualizadoPor}</small>}
              {dados.pausado ? (
                <button className="btn btn-success" onClick={() => acao("/admin/ia/retomar")}><i className="fa-solid fa-play me-2"></i>Retomar IA</button>
              ) : (
                <div className="d-flex gap-2">
                  <input className="form-control" placeholder="Motivo da pausa (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                  <button className="btn btn-outline-danger text-nowrap" onClick={() => acao("/admin/ia/pausar", { motivo })}><i className="fa-solid fa-pause me-2"></i>Pausar</button>
                </div>
              )}
              <small className="text-suave d-block mt-3">A retomada remove a pausa operacional; a disponibilidade do provedor externo não é garantida.</small>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="av-card h-100">
              <div className="av-titulo-secao"><i className="fa-solid fa-lightbulb text-warning"></i> Sugestões com IA (RF18)</div>
              <p className="text-suave">Gera novos temas de redação no estilo de cada banca e ideias de questões para os tópicos com pior desempenho na plataforma.</p>
              <button className="btn btn-gradiente" disabled={gerando} onClick={gerar}>
                {gerando ? <><span className="spinner-border spinner-border-sm me-2"></span>Gerando...</> : <><i className="fa-solid fa-wand-magic-sparkles me-2"></i>Gerar sugestões</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {sugestoes && (
        <div className="row g-4">
          <div className="col-12"><div className="alert alert-info mb-0">{sugestoes.observacao}</div></div>
          <div className="col-lg-7">
            <div className="av-card">
              <div className="av-titulo-secao">Temas sugeridos</div>
              {sugestoes.temas.map((t, i) => (
                <div key={i} className="border-bottom py-3">
                  <div className="d-flex justify-content-between gap-2"><strong>{t.titulo}</strong><span className="av-selo av-selo-primario">{t.vestibular} · {t.genero}</span></div>
                  <p className="small mb-1 mt-2">{t.proposta}</p>
                  <small className="text-suave">{t.justificativa}</small>
                  <div className="mt-2"><button className="btn btn-sm btn-suave" onClick={() => aprovar(t)}><i className="fa-solid fa-check me-1"></i>Aprovar e adicionar aos temas</button></div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-lg-5">
            <div className="av-card">
              <div className="av-titulo-secao">Ideias de questões</div>
              {sugestoes.questoes.length ? sugestoes.questoes.map((q, i) => (
                <div key={i} className="border-bottom py-2"><strong>{q.disciplina} · {q.topico}</strong><p className="small mb-1">{q.ideia}</p><small className="text-suave">{q.justificativa}</small></div>
              )) : <p className="text-suave mb-0">Ainda não há dados de desempenho suficientes.</p>}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default ServicoIA;
