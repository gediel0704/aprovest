import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import CartaoEstatistica from "../../components/CartaoEstatistica/CartaoEstatistica";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import styles from "./Banca.module.css";

// RF03 / UC012 - Banca adaptativa diária
function Banca() {
  const { dados, carregando, erro } = useApi("/estudo/status");
  const [iniciando, setIniciando] = useState("");
  const [falha, setFalha] = useState("");
  const navigate = useNavigate();

  const iniciar = async (sigla) => {
    setFalha("");
    setIniciando(sigla);
    try {
      const r = await api.post("/estudo/banca", { vestibular: sigla });
      navigate(`/aluno/sessao/${r.data.data.id}`);
    } catch (error) {
      setFalha(mensagemErro(error));
      setIniciando("");
    }
  };

  const restantes = dados ? Math.max(0, dados.limiteQuestoesDia - dados.questoesHoje) : 0;

  return (
    <Layout title="Banca diária adaptativa" subtitulo="Até 10 questões por rodada, calibradas para o seu nível em cada tópico.">
      {carregando && <Carregando />}
      {(erro || falha) && <div className="alert alert-danger">{erro || falha}</div>}
      {dados && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <CartaoEstatistica icone="fa-bolt" rotulo="Questões restantes hoje" valor={restantes} cor="destaque"
                detalhe={dados.pro ? "Plano Pro" : `Plano gratuito: ${dados.limiteQuestoesDia} por dia (RN02)`} />
            </div>
            <div className="col-md-4">
              <CartaoEstatistica icone="fa-rotate" rotulo="Revisões pendentes" valor={dados.revisoesPendentes} cor="info" detalhe="repetição espaçada (RF17)" />
            </div>
            <div className="col-md-4">
              <div className="av-card h-100 d-flex flex-column justify-content-center">
                <small className="text-suave fw-semibold">Uso de hoje</small>
                <div className="av-progresso my-2"><span style={{ width: `${Math.min(100, (dados.questoesHoje * 100) / dados.limiteQuestoesDia)}%` }}></span></div>
                <small>{dados.questoesHoje} de {dados.limiteQuestoesDia} questões</small>
              </div>
            </div>
          </div>

          <div className={`av-card mb-4 ${styles.explicacao}`}>
            <div className="av-icone-circulo"><i className="fa-solid fa-brain"></i></div>
            <div>
              <h2 className="h5">Como a banca escolhe suas questões</h2>
              <p className="text-suave mb-0">
                Cada tópico tem um <strong>rating de proficiência</strong> (algoritmo Elo, o mesmo princípio logístico da TRI). A banca prioriza
                seus tópicos mais fracos, escolhe itens um pouco acima do seu nível e inclui as revisões programadas das questões que você errou:
                erro volta em 1 dia, acerto em 7 dias. Você vê o gabarito logo após cada resposta.
              </p>
            </div>
          </div>

          {restantes === 0 && !dados.pro && (
            <div className="alert alert-warning d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span><i className="fa-solid fa-lock me-2"></i>Você usou as questões gratuitas de hoje. Volte amanhã ou assine o Plano Pro.</span>
              <Link to="/aluno/acessos" className="btn btn-sm btn-warning">Conhecer o Pro</Link>
            </div>
          )}

          <div className="row g-4">
            {dados.vestibulares.map((v) => (
              <div className="col-md-4" key={v.sigla}>
                <div className={`av-card h-100 ${styles.opcao}`}>
                  <h3 className="h4">{v.sigla === "UNICAMP" ? "Unicamp" : v.sigla}</h3>
                  <p className="text-suave small mb-3">{v.questoesDisponiveis} questões oficiais no banco</p>
                  {!v.diagnosticoConcluido && <p className="small text-warning"><i className="fa-solid fa-triangle-exclamation me-1"></i>Recomendado fazer o diagnóstico antes.</p>}
                  {v.sessaoAbertaBANCA ? (
                    <button className="btn btn-primary mt-auto" onClick={() => navigate(`/aluno/sessao/${v.sessaoAbertaBANCA}`)}>Continuar banca</button>
                  ) : (
                    <button className="btn btn-gradiente mt-auto" disabled={!!iniciando || restantes === 0} onClick={() => iniciar(v.sigla)}>
                      {iniciando === v.sigla ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fa-solid fa-bolt me-2"></i>Gerar banca</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}

export default Banca;
