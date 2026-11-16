import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import SeletorVestibular from "../../components/SeletorVestibular/SeletorVestibular";
import { useAuth } from "../../contexts/AuthContext";
import useApi from "../../utils/useApi";
import { vestibularPadrao } from "../../utils/formatar";
import styles from "./PlanoEstudo.module.css";

const PRIORIDADES = {
  ALTA: { texto: "Prioridade alta", classe: "av-selo-perigo" },
  MEDIA: { texto: "Prioridade média", classe: "av-selo-alerta" },
  BAIXA: { texto: "Manutenção", classe: "av-selo-sucesso" },
  SEM_DADOS: { texto: "Sem dados recentes", classe: "" },
};

// UC018 - Consultar plano de estudo (heurística pelas taxas recentes de acerto)
function PlanoEstudo() {
  const { usuario } = useAuth();
  const [vestibular, setVestibular] = useState(vestibularPadrao(usuario));
  const { dados, carregando, erro } = useApi(`/painel/plano?vestibular=${vestibular}`, [vestibular]);
  const total = dados?.disciplinas.reduce((s, d) => s + d.questoesSugeridasSemana, 0) || 0;

  return (
    <Layout title="Plano de estudo" subtitulo="Prioridades da semana calculadas a partir do seu desempenho recente.">
      <div className="mb-4"><SeletorVestibular valor={vestibular} onChange={setVestibular} opcoes={usuario?.vestibularesAlvo} /></div>
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && (
        <>
          {dados.orientacaoInicial && <div className="alert alert-info"><i className="fa-solid fa-compass me-2"></i>{dados.orientacaoInicial} <Link to="/aluno/diagnostico">Fazer diagnóstico</Link></div>}
          <div className="av-card mb-4 d-flex flex-wrap gap-3 justify-content-between align-items-center">
            <div><strong>Meta da semana:</strong> {total} questões distribuídas por prioridade</div>
            <small className="text-suave">{dados.criterio}</small>
          </div>
          <div className="row g-3">
            {dados.disciplinas.map((d) => (
              <div className="col-md-6 col-xl-4" key={d.disciplina}>
                <div className={`av-card h-100 ${styles.disciplina}`}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div><h3 className="h6 mb-0">{d.disciplina}</h3><small className="text-suave">{d.area}</small></div>
                    <span className={`av-selo ${PRIORIDADES[d.prioridade].classe}`}>{PRIORIDADES[d.prioridade].texto}</span>
                  </div>
                  <div className="d-flex gap-4 my-3">
                    <div><strong className="fs-4">{d.taxaAcerto30d ?? "--"}{d.taxaAcerto30d !== null && "%"}</strong><br /><small className="text-suave">acerto em 30 dias</small></div>
                    <div><strong className="fs-4">{d.questoesSugeridasSemana}</strong><br /><small className="text-suave">questões sugeridas</small></div>
                  </div>
                  {d.conteudosNaoConcluidos.length > 0 && (
                    <div className="mt-auto">
                      <small className="fw-semibold">Para revisar:</small>
                      {d.conteudosNaoConcluidos.map((c) => <Link key={c.id} to={`/aluno/biblioteca/${c.id}`} className={styles.conteudo}><i className="fa-solid fa-book-open me-2"></i>{c.titulo}</Link>)}
                    </div>
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

export default PlanoEstudo;
