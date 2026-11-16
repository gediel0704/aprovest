import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import styles from "../Banca/Banca.module.css";

// RF02 / UC011 - Diagnóstico inicial com 30 questões oficiais
function Diagnostico() {
  const { dados, carregando, erro } = useApi("/estudo/status");
  const [iniciando, setIniciando] = useState("");
  const [falha, setFalha] = useState("");
  const navigate = useNavigate();

  const iniciar = async (sigla) => {
    setFalha("");
    setIniciando(sigla);
    try {
      const r = await api.post("/estudo/diagnostico", { vestibular: sigla });
      navigate(`/aluno/sessao/${r.data.data.id}`);
    } catch (error) {
      setFalha(mensagemErro(error));
      setIniciando("");
    }
  };

  return (
    <Layout title="Diagnóstico inicial" subtitulo="30 questões oficiais para calibrar sua proficiência por disciplina e tópico.">
      <div className={`av-card mb-4 ${styles.explicacao}`}>
        <div className="av-icone-circulo"><i className="fa-solid fa-stethoscope"></i></div>
        <div>
          <h2 className="h5">Como funciona</h2>
          <ul className="mb-0">
            <li>As questões são distribuídas entre as disciplinas do vestibular escolhido.</li>
            <li>O gabarito <strong>não</strong> é mostrado durante a prova, como em um exame real.</li>
            <li>Ao final, você vê o resultado por disciplina e sua proficiência inicial é registrada.</li>
          </ul>
        </div>
      </div>
      {carregando && <Carregando />}
      {(erro || falha) && <div className="alert alert-danger">{erro || falha}</div>}
      <div className="row g-4">
        {dados?.vestibulares.map((v) => (
          <div className="col-md-4" key={v.sigla}>
            <div className={`av-card h-100 ${styles.opcao}`}>
              <div className="d-flex justify-content-between align-items-start">
                <h3 className="h4 mb-1">{v.sigla === "UNICAMP" ? "Unicamp" : v.sigla}</h3>
                {v.diagnosticoConcluido && <span className="av-selo av-selo-sucesso"><i className="fa-solid fa-check"></i> Concluído</span>}
              </div>
              <p className="text-suave small">{v.nome}</p>
              <p className="small mb-3"><i className="fa-solid fa-database me-1 text-primary"></i>{v.questoesDisponiveis} questões oficiais disponíveis</p>
              {v.sessaoAbertaDIAGNOSTICO ? (
                <button className="btn btn-primary mt-auto" onClick={() => navigate(`/aluno/sessao/${v.sessaoAbertaDIAGNOSTICO}`)}>
                  <i className="fa-solid fa-play me-2"></i>Continuar diagnóstico
                </button>
              ) : (
                <button className="btn btn-gradiente mt-auto" disabled={!!iniciando} onClick={() => iniciar(v.sigla)}>
                  {iniciando === v.sigla ? <span className="spinner-border spinner-border-sm"></span> : v.diagnosticoConcluido ? "Refazer diagnóstico" : "Iniciar diagnóstico"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export default Diagnostico;
