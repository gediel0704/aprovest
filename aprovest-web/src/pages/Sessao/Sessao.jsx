import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import Modal from "../../components/Modal/Modal";
import Questao from "../../components/Questao/Questao";
import TextoFormatado from "../../components/TextoFormatado/TextoFormatado";
import api, { mensagemErro } from "../../services/api";
import { formatarTempo } from "../../utils/formatar";
import styles from "./Sessao.module.css";

const NOMES = { DIAGNOSTICO: "Diagnóstico", BANCA: "Banca diária", SIMULADO: "Simulado" };

// Execução de Diagnóstico (UC011), Banca diária (UC012) e Simulado (UC013)
function Sessao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sessao, setSessao] = useState(null);
  const [indice, setIndice] = useState(0);
  const [selecao, setSelecao] = useState({});
  const [devolutiva, setDevolutiva] = useState({});
  const [restante, setRestante] = useState(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmarFim, setConfirmarFim] = useState(false);
  const inicioQuestao = useRef(Date.now());

  useEffect(() => {
    api.get(`/estudo/sessoes/${id}`)
      .then((r) => {
        const s = r.data.data;
        if (s.status !== "EM_ANDAMENTO") return navigate(`/aluno/sessao/${id}/resultado`, { replace: true });
        setSessao(s);
        setRestante(s.segundosRestantes);
        const marcadas = {};
        const dev = {};
        s.questoes.forEach((q) => {
          if (q.alternativaMarcada) marcadas[q.id] = q.alternativaMarcada;
          if (q.gabarito) dev[q.id] = { correta: q.correta, gabarito: q.gabarito, explicacao: q.explicacao };
        });
        setSelecao(marcadas);
        setDevolutiva(dev);
        const primeiraAberta = s.questoes.findIndex((q) => !q.respondida);
        setIndice(primeiraAberta >= 0 ? primeiraAberta : 0);
      })
      .catch((e) => setErro(mensagemErro(e)));
  }, [id, navigate]);

  // Cronômetro (o servidor também valida o prazo)
  useEffect(() => {
    if (restante === null || restante === undefined) return;
    if (restante <= 0) {
      navigate(`/aluno/sessao/${id}/resultado`);
      return;
    }
    const t = setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [restante, id, navigate]);

  useEffect(() => { inicioQuestao.current = Date.now(); }, [indice]);

  const questao = sessao?.questoes[indice];
  const respondidas = useMemo(() => sessao?.questoes.filter((q) => selecao[q.id] && (sessao.modo === "SIMULADO" || devolutiva[q.id] || q.respondida)).length || 0, [sessao, selecao, devolutiva]);
  const ehBanca = sessao?.modo === "BANCA";
  const jaRespondida = questao && (devolutiva[questao.id] || (sessao.modo === "DIAGNOSTICO" && questao.respondida));

  const confirmar = async () => {
    if (!selecao[questao.id]) return;
    setErro("");
    setEnviando(true);
    try {
      const tempo = Math.round((Date.now() - inicioQuestao.current) / 1000);
      const r = await api.post(`/estudo/sessoes/${id}/respostas`, { questaoId: questao.id, alternativa: selecao[questao.id], tempoSegundos: tempo });
      const d = r.data.data;
      const atualizada = { ...sessao, questoes: sessao.questoes.map((q) => (q.id === questao.id ? { ...q, respondida: true } : q)) };
      setSessao(atualizada);
      if (ehBanca) setDevolutiva({ ...devolutiva, [questao.id]: d });
      if (d.resultado) {
        if (!ehBanca) navigate(`/aluno/sessao/${id}/resultado`);
        return;
      }
      if (!ehBanca) avancar(atualizada);
    } catch (e) {
      setErro(mensagemErro(e));
      if (String(mensagemErro(e)).includes("prazo")) navigate(`/aluno/sessao/${id}/resultado`);
    } finally {
      setEnviando(false);
    }
  };

  const avancar = (s = sessao) => {
    const proxima = s.questoes.findIndex((q, i) => i > indice && !q.respondida);
    const qualquer = s.questoes.findIndex((q) => !q.respondida);
    if (proxima >= 0) setIndice(proxima);
    else if (qualquer >= 0) setIndice(qualquer);
    else if (indice < s.questoes.length - 1) setIndice(indice + 1);
  };

  const concluir = async () => {
    setEnviando(true);
    try {
      await api.post(`/estudo/sessoes/${id}/concluir`);
      navigate(`/aluno/sessao/${id}/resultado`);
    } catch (e) {
      setErro(mensagemErro(e));
      setEnviando(false);
    }
  };

  if (!sessao) return <Layout title="Carregando sessão...">{erro ? <div className="alert alert-danger">{erro}</div> : <Carregando />}</Layout>;

  const todasRespondidas = sessao.questoes.every((q) => q.respondida);

  return (
    <Layout title={`${NOMES[sessao.modo]} · ${sessao.vestibular}`}
      subtitulo={sessao.modo === "SIMULADO" ? "O gabarito será exibido apenas no resultado." : ehBanca ? "Você vê a correção logo após confirmar cada resposta." : "Responda com calma. O gabarito aparece ao final."}>
      <div className={styles.barra}>
        <div className={styles.progresso}>
          <div className="d-flex justify-content-between small fw-semibold mb-1">
            <span>{respondidas} de {sessao.totalQuestoes} respondidas</span>
            <span>{Math.round((respondidas * 100) / sessao.totalQuestoes)}%</span>
          </div>
          <div className="av-progresso"><span style={{ width: `${(respondidas * 100) / sessao.totalQuestoes}%` }}></span></div>
        </div>
        {restante !== null && restante !== undefined && (
          <div className={`${styles.cronometro} ${restante < 300 ? styles.urgente : ""}`} aria-live="polite">
            <i className="fa-solid fa-stopwatch"></i> {formatarTempo(restante)}
          </div>
        )}
        {(sessao.modo === "SIMULADO" || (ehBanca && todasRespondidas)) && (
          <button className="btn btn-gradiente" onClick={() => (ehBanca ? navigate(`/aluno/sessao/${id}/resultado`) : setConfirmarFim(true))}>
            <i className="fa-solid fa-flag-checkered me-2"></i>{ehBanca ? "Ver resultado" : "Finalizar simulado"}
          </button>
        )}
      </div>

      <div className="row g-4">
        <div className="col-lg-9">
          <div className="av-card">
            {erro && <div className="alert alert-danger">{erro}</div>}
            <Questao questao={questao} numero={indice + 1} selecionada={selecao[questao.id]}
              onSelecionar={(l) => setSelecao({ ...selecao, [questao.id]: l })}
              bloqueada={!!jaRespondida || enviando}
              gabarito={ehBanca ? devolutiva[questao.id]?.gabarito : null} />

            {ehBanca && devolutiva[questao.id] && (
              <div className={`mt-3 alert ${devolutiva[questao.id].correta ? "alert-success" : "alert-danger"}`}>
                <strong>{devolutiva[questao.id].correta ? "Resposta correta!" : `Resposta incorreta. Gabarito oficial: ${devolutiva[questao.id].gabarito}`}</strong>
                {devolutiva[questao.id].explicacao
                  ? <TextoFormatado texto={devolutiva[questao.id].explicacao} className="mt-2" />
                  : <div className="small mt-1">{devolutiva[questao.id].correta ? "Ótimo! Ela volta para revisão em 7 dias." : "Ela entrou na sua agenda de revisão de amanhã."}</div>}
              </div>
            )}

            <div className="d-flex justify-content-between flex-wrap gap-2 mt-4">
              <button className="btn btn-suave" disabled={indice === 0} onClick={() => setIndice(indice - 1)}>
                <i className="fa-solid fa-arrow-left me-2"></i>Anterior
              </button>
              <div className="d-flex gap-2">
                {!jaRespondida && (
                  <button className="btn btn-primary" disabled={!selecao[questao.id] || enviando} onClick={confirmar}>
                    {enviando ? <span className="spinner-border spinner-border-sm"></span> : sessao.modo === "SIMULADO" && questao.respondida ? "Alterar resposta" : "Confirmar resposta"}
                  </button>
                )}
                {sessao.modo === "SIMULADO" && questao.respondida && !enviando && selecao[questao.id] && (
                  <span className="align-self-center small text-success"><i className="fa-solid fa-check me-1"></i>Registrada</span>
                )}
                <button className="btn btn-suave" disabled={indice === sessao.questoes.length - 1} onClick={() => setIndice(indice + 1)}>
                  Próxima<i className="fa-solid fa-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3">
          <div className={`av-card ${styles.mapa}`}>
            <div className="av-titulo-secao">Questões</div>
            <div className={styles.grade}>
              {sessao.questoes.map((q, i) => {
                const d = devolutiva[q.id];
                const classe = d ? (d.correta ? styles.acerto : styles.erro) : q.respondida ? styles.feita : "";
                return (
                  <button key={q.id} onClick={() => setIndice(i)} className={`${styles.celula} ${classe} ${i === indice ? styles.atual : ""}`}
                    aria-label={`Ir para a questão ${i + 1}`}>{i + 1}</button>
                );
              })}
            </div>
            <div className={styles.legenda}>
              <span><i className={styles.feita}></i>Respondida</span>
              {ehBanca && <><span><i className={styles.acerto}></i>Acerto</span><span><i className={styles.erro}></i>Erro</span></>}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={confirmarFim} onClose={() => setConfirmarFim(false)} onConfirm={concluir} carregando={enviando}
        titulo="Finalizar simulado?" textoConfirmar="Finalizar e ver resultado"
        mensagem={`Você respondeu ${respondidas} de ${sessao.totalQuestoes} questões. As não respondidas contam como erro.`} />
    </Layout>
  );
}

export default Sessao;
