import { useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import CartaoEstatistica from "../../components/CartaoEstatistica/CartaoEstatistica";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import SeletorVestibular from "../../components/SeletorVestibular/SeletorVestibular";
import { useAuth } from "../../contexts/AuthContext";
import useApi from "../../utils/useApi";
import { formatarData, formatarNumero, vestibularPadrao } from "../../utils/formatar";
import styles from "./HomeAluno.module.css";

const ICONES_REC = { DIAGNOSTICO: "fa-stethoscope", REVISAO: "fa-rotate", TOPICO: "fa-crosshairs", BANCA: "fa-bolt" };

// RF07 / UC010 - Painel da Meta por vestibular
function HomeAluno() {
  const { usuario } = useAuth();
  const [vestibular, setVestibular] = useState(vestibularPadrao(usuario));
  const { dados, carregando, erro } = useApi(`/painel?vestibular=${vestibular}`, [vestibular]);

  const status = dados?.status;
  const maxEscala = vestibular === "FUVEST" ? 90 : vestibular === "UNICAMP" ? 72 : 900;
  const evolucao = (dados?.evolucao || []).map((e) => ({ ...e, rotulo: formatarData(e.data).slice(0, 5), nota: Number(e.nota) }));

  return (
    <Layout title={`Olá, ${usuario?.nome?.split(" ")[0]}!`} subtitulo="Seu Painel da Meta: acompanhe a evolução rumo à aprovação.">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <SeletorVestibular valor={vestibular} onChange={setVestibular} opcoes={usuario?.vestibularesAlvo} />
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/aluno/banca" className="btn btn-gradiente"><i className="fa-solid fa-bolt me-2"></i>Banca de hoje</Link>
          <Link to="/aluno/redacoes/nova" className="btn btn-suave"><i className="fa-solid fa-pen-nib me-2"></i>Nova redação</Link>
        </div>
      </div>

      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {dados && !carregando && (
        <>
          <div className={`av-card av-card-gradiente mb-4 ${styles.meta}`}>
            <div>
              <small>Minha meta</small>
              <h2>{dados.meta.curso || "Defina seu curso"} {dados.meta.universidade ? `· ${dados.meta.universidade}` : ""}</h2>
              <p className="mb-0">{dados.vestibular.nome} · {dados.vestibular.organizadora}</p>
            </div>
            <div className={styles.projecao}>
              <small>Projeção atual</small>
              <strong>{dados.projecaoNota ? formatarNumero(dados.projecaoNota, 1) : "--"}</strong>
              <span>{dados.escala}</span>
            </div>
            <Link to="/aluno/meta" className="btn btn-light btn-sm align-self-start"><i className="fa-solid fa-pen me-1"></i>Editar meta</Link>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-6 col-xl-3">
              <CartaoEstatistica icone="fa-ranking-star" rotulo="Último percentil" cor="sucesso"
                valor={dados.ultimoPercentil != null ? `${formatarNumero(dados.ultimoPercentil, 0)}º` : "--"} detalhe="entre alunos comparáveis" />
            </div>
            <div className="col-6 col-xl-3">
              <CartaoEstatistica icone="fa-bolt" rotulo="Questões hoje" cor="destaque"
                valor={`${status.questoesHoje}/${status.limiteQuestoesDia}`} detalhe={status.pro ? "Plano Pro" : "Plano gratuito"} />
            </div>
            <div className="col-6 col-xl-3">
              <CartaoEstatistica icone="fa-fire" rotulo="Sequência de estudo" cor="perigo" valor={`${dados.sequenciaDias} dia(s)`} detalhe="dias seguidos com questões" />
            </div>
            <div className="col-6 col-xl-3">
              <CartaoEstatistica icone="fa-bullseye" rotulo="Aproveitamento geral" cor="info"
                valor={dados.totalRespondidas ? `${Math.round((dados.totalAcertos * 100) / dados.totalRespondidas)}%` : "--"}
                detalhe={`${dados.totalAcertos} acertos em ${dados.totalRespondidas}`} />
            </div>
          </div>

          <div className="row g-4">
            <div className="col-xl-8">
              <div className="av-card mb-4">
                <div className="av-titulo-secao"><i className="fa-solid fa-chart-line text-primary"></i> Evolução nas avaliações</div>
                {evolucao.length ? (
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={evolucao} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--av-borda)" />
                        <XAxis dataKey="rotulo" stroke="var(--av-texto-suave)" fontSize={12} />
                        <YAxis domain={[0, maxEscala]} stroke="var(--av-texto-suave)" fontSize={12} />
                        <Tooltip contentStyle={{ borderRadius: 12, background: "var(--av-superficie)", border: "1px solid var(--av-borda)" }}
                          formatter={(v) => [formatarNumero(v, 1), "Nota estimada"]} />
                        <Line type="monotone" dataKey="nota" stroke="#6d28d9" strokeWidth={3} dot={{ r: 5, fill: "#6d28d9" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EstadoVazio icone="fa-chart-line" titulo="Ainda sem avaliações" texto="Faça o diagnóstico ou um simulado para acompanhar sua evolução.">
                    <Link to="/aluno/diagnostico" className="btn btn-primary btn-sm">Fazer diagnóstico</Link>
                  </EstadoVazio>
                )}
                <small className="text-suave d-block mt-2"><i className="fa-solid fa-circle-info me-1"></i>{dados.aviso}</small>
              </div>

              <div className="av-card mb-4">
                <div className="av-titulo-secao"><i className="fa-solid fa-chart-column text-primary"></i> Desempenho por disciplina</div>
                {dados.desempenhoDisciplinas.length ? (
                  <div style={{ height: Math.max(220, dados.desempenhoDisciplinas.length * 38) }}>
                    <ResponsiveContainer>
                      <BarChart data={dados.desempenhoDisciplinas} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--av-borda)" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} unit="%" stroke="var(--av-texto-suave)" fontSize={12} />
                        <YAxis type="category" dataKey="disciplina" width={120} stroke="var(--av-texto-suave)" fontSize={12} />
                        <Tooltip formatter={(v, n, p) => [`${v}% (${p.payload.acertos}/${p.payload.total})`, "Acertos"]}
                          contentStyle={{ borderRadius: 12, background: "var(--av-superficie)", border: "1px solid var(--av-borda)" }} />
                        <Bar dataKey="percentual" fill="#4f46e5" radius={[0, 8, 8, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-suave mb-0">Responda questões de {vestibular} para ver seu desempenho por disciplina.</p>}
              </div>

              <div className="av-card">
                <div className="av-titulo-secao"><i className="fa-solid fa-layer-group text-primary"></i> Proficiência por tópico</div>
                {dados.proficienciaTopicos.length ? (
                  <div className={styles.topicos}>
                    {dados.proficienciaTopicos.slice(0, 10).map((t) => {
                      const pct = Math.min(100, Math.max(5, ((t.rating - 600) / 800) * 100));
                      return (
                        <div key={t.topico + t.disciplina} className={styles.topico}>
                          <div className="d-flex justify-content-between gap-2">
                            <span><strong>{t.topico}</strong> <small className="text-suave">· {t.disciplina}</small></span>
                            <span className="av-selo">{t.nivel}</span>
                          </div>
                          <div className="av-progresso mt-2"><span style={{ width: `${pct}%` }}></span></div>
                          <small className="text-suave">{t.acertos}/{t.tentativas} acertos · rating {formatarNumero(t.rating, 0)}</small>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-suave mb-0">Sua proficiência por tópico aparece após as primeiras respostas.</p>}
              </div>
            </div>

            <div className="col-xl-4">
              <div className="av-card mb-4">
                <div className="av-titulo-secao"><i className="fa-solid fa-lightbulb text-warning"></i> Recomendações</div>
                <div className="d-flex flex-column gap-2">
                  {dados.recomendacoes.map((r, i) => (
                    <Link key={i} to={r.link} className={styles.recomendacao}>
                      <span className="av-icone-circulo"><i className={`fa-solid ${ICONES_REC[r.tipo] || "fa-star"}`}></i></span>
                      <span><strong>{r.titulo}</strong><small>{r.descricao}</small></span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="av-card mb-4">
                <div className="av-titulo-secao"><i className="fa-solid fa-calendar-days text-primary"></i> Últimos 14 dias</div>
                <div className={styles.atividade}>
                  {dados.atividade.map((a) => (
                    <div key={a.data} title={`${formatarData(a.data)}: ${a.questoes} questões`}>
                      <span style={{ height: `${Math.min(100, a.questoes * 6) + 4}%`, opacity: a.questoes ? 1 : 0.25 }}></span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="av-card">
                <div className="av-titulo-secao"><i className="fa-solid fa-pen-nib text-primary"></i> Redações corrigidas</div>
                {dados.redacoes.length ? dados.redacoes.map((r) => (
                  <Link key={r.id} to={`/aluno/avaliacoes/${r.id}`} className={styles.redacao}>
                    <span><strong>{r.titulo}</strong><small>{r.vestibular} · {r.tipo === "IA" ? "IA" : "Humana"} · {formatarData(r.data)}</small></span>
                    <span className={styles.nota}>{formatarNumero(r.nota, 0)}<small>/{formatarNumero(r.maxima, 0)}</small></span>
                  </Link>
                )) : <p className="text-suave mb-0">Nenhuma redação corrigida ainda.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

export default HomeAluno;
