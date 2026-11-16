import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import CartaoEstatistica from "../../components/CartaoEstatistica/CartaoEstatistica";
import Questao from "../../components/Questao/Questao";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarNumero } from "../../utils/formatar";
import styles from "./ResultadoSessao.module.css";

const NOMES = { DIAGNOSTICO: "Diagnóstico", BANCA: "Banca diária", SIMULADO: "Simulado" };

// Resultado de diagnóstico, banca ou simulado (nota projetada, percentil e correção questão a questão)
function ResultadoSessao() {
  const { id } = useParams();
  const { dados: r, carregando, erro } = useApi(`/estudo/sessoes/${id}/resultado`, [id]);
  const [aberta, setAberta] = useState(null);

  if (carregando) return <Layout title="Resultado"><Carregando /></Layout>;
  if (erro) return <Layout title="Resultado"><div className="alert alert-danger">{erro}</div></Layout>;

  const pct = Math.round((r.acertos * 100) / r.totalQuestoes);
  return (
    <Layout title={`Resultado · ${NOMES[r.modo]} ${r.vestibular}`} subtitulo={`Concluído em ${formatarDataHora(r.concluidaEm)}${r.status === "EXPIRADA" ? " (encerrado pelo prazo)" : ""}`}
      acoes={<>
        <Link to="/aluno" className="btn btn-suave"><i className="fa-solid fa-gauge-high me-2"></i>Painel da Meta</Link>
        <Link to={r.modo === "SIMULADO" ? "/aluno/simulados" : "/aluno/banca"} className="btn btn-primary">Continuar estudando</Link>
      </>}>
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><CartaoEstatistica icone="fa-bullseye" rotulo="Acertos" valor={`${r.acertos}/${r.totalQuestoes}`} detalhe={`${pct}% de aproveitamento`} /></div>
        {r.modo !== "BANCA" && (
          <div className="col-6 col-lg-3"><CartaoEstatistica icone="fa-chart-line" rotulo="Nota projetada" cor="sucesso" valor={formatarNumero(r.notaEstimada, 1)} detalhe={r.escala} /></div>
        )}
        {r.modo === "SIMULADO" && (
          <div className="col-6 col-lg-3"><CartaoEstatistica icone="fa-ranking-star" rotulo="Percentil" cor="destaque"
            valor={r.percentil != null ? `${formatarNumero(r.percentil, 0)}º` : "--"} detalhe={r.percentil != null ? `${r.comparaveis} alunos comparáveis` : "comparáveis insuficientes"} /></div>
        )}
        <div className="col-6 col-lg-3"><CartaoEstatistica icone="fa-list-check" rotulo="Respondidas" cor="info" valor={r.respondidas} detalhe={`de ${r.totalQuestoes} questões`} /></div>
      </div>

      {r.grupoComparacao && <div className="alert alert-info"><i className="fa-solid fa-users me-2"></i>Percentil {r.grupoComparacao}.</div>}
      {r.avisoPercentil && <div className="alert alert-warning"><i className="fa-solid fa-circle-info me-2"></i>{r.avisoPercentil}</div>}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="av-card h-100">
            <div className="av-titulo-secao"><i className="fa-solid fa-chart-column text-primary"></i> Desempenho por disciplina</div>
            <div style={{ height: Math.max(220, r.porDisciplina.length * 40) }}>
              <ResponsiveContainer>
                <BarChart data={r.porDisciplina} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--av-borda)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" fontSize={12} stroke="var(--av-texto-suave)" />
                  <YAxis type="category" dataKey="disciplina" width={115} fontSize={12} stroke="var(--av-texto-suave)" />
                  <Tooltip formatter={(v, n, p) => [`${v}% (${p.payload.acertos}/${p.payload.total})`, "Acertos"]} />
                  <Bar dataKey="percentual" fill="#7c3aed" radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="av-card h-100">
            <div className="av-titulo-secao"><i className="fa-solid fa-list-ol text-primary"></i> Correção questão a questão</div>
            <div className={styles.lista}>
              {r.questoes.map((q) => (
                <div key={q.id}>
                  <button className={styles.linha} onClick={() => setAberta(aberta === q.id ? null : q.id)} aria-expanded={aberta === q.id}>
                    <span className={`${styles.marca} ${q.correta ? styles.ok : styles.falha}`}>
                      <i className={`fa-solid ${q.correta ? "fa-check" : q.respondida ? "fa-xmark" : "fa-minus"}`}></i>
                    </span>
                    <span className={styles.descricao}><strong>Questão {q.ordem}</strong> · {q.disciplina}<small>{q.fonte}</small></span>
                    <span className={styles.respostas}>{q.alternativaMarcada || "-"} / <strong>{q.gabarito}</strong></span>
                    <i className={`fa-solid fa-chevron-${aberta === q.id ? "up" : "down"} text-suave`}></i>
                  </button>
                  {aberta === q.id && (
                    <div className={styles.detalhe}><Questao questao={q} selecionada={q.alternativaMarcada} gabarito={q.gabarito} bloqueada /></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ResultadoSessao;
