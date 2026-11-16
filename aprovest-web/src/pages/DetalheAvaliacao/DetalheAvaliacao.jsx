import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import TextoFormatado from "../../components/TextoFormatado/TextoFormatado";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarNumero, STATUS_AVALIACAO } from "../../utils/formatar";
import styles from "./DetalheAvaliacao.module.css";

// UC026 - Detalhe de uma avaliação: nota por competência/quesito oficial e devolutiva
function DetalheAvaliacao() {
  const { id } = useParams();
  const { dados, carregando, erro, recarregar } = useApi(`/redacoes/avaliacoes/${id}`, [id]);
  const a = dados?.avaliacao;

  // Enquanto a IA corrige, consulta o andamento a cada 3 segundos (UC024 - apresentar progresso)
  useEffect(() => {
    if (a?.status !== "PROCESSANDO") return;
    const t = setInterval(() => recarregar(true), 3000);
    return () => clearInterval(t);
  }, [a?.status, recarregar]);

  if (carregando) return <Layout title="Avaliação"><Carregando /></Layout>;
  if (erro) return <Layout title="Avaliação"><div className="alert alert-danger">{erro}</div></Layout>;

  const st = STATUS_AVALIACAO[a.status];
  const pct = a.notaTotal !== null ? (Number(a.notaTotal) * 100) / Number(a.notaMaxima) : 0;

  return (
    <Layout title={a.tituloSnapshot} subtitulo={`${a.vestibular.sigla} · correção ${a.tipo === "IA" ? "por IA" : "humana"} · solicitada em ${formatarDataHora(a.solicitadaEm)}`}
      acoes={<Link to="/aluno/avaliacoes" className="btn btn-suave"><i className="fa-solid fa-arrow-left me-2"></i>Avaliações</Link>}>
      {a.status === "PROCESSANDO" && (
        <div className={`av-card mb-4 ${styles.processando}`}>
          <div className="spinner-border text-primary"></div>
          <div><strong>A IA está corrigindo sua redação...</strong><p className="mb-0 text-suave">Avaliando cada critério da grade oficial de {dados.grade.banca}. Isso pode levar até um minuto.</p></div>
        </div>
      )}
      {(a.status === "PENDENTE" || a.status === "ATRIBUIDA") && (
        <div className="alert alert-info"><i className="fa-solid fa-hourglass-half me-2"></i>
          {a.status === "PENDENTE" ? "Aguardando atribuição a um corretor." : `Em correção por ${a.corretorNome}.`} Prazo registrado: {formatarDataHora(a.prazo)}.
        </div>
      )}
      {a.status === "ERRO" && <div className="alert alert-danger">{a.feedbackGeral}</div>}

      {a.status === "CONCLUIDA" && (
        <div className="row g-4 mb-4">
          <div className="col-lg-4">
            <div className={`av-card av-card-gradiente h-100 ${styles.nota}`}>
              <small>Nota {a.vestibular.sigla}</small>
              <strong>{formatarNumero(a.notaTotal)}<span>/{formatarNumero(a.notaMaxima)}</span></strong>
              <div className={styles.anel} style={{ "--pct": `${pct}%` }}></div>
              <small className="mt-2">{dados.grade.escala}</small>
              <span className="av-selo mt-3" style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}>
                <i className={`fa-solid ${a.tipo === "IA" ? "fa-robot" : "fa-user-check"}`}></i>
                {a.tipo === "IA" ? a.modeloIa : `Corretor(a): ${a.corretorNome || "-"}`}
              </span>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="av-card h-100">
              <div className="av-titulo-secao"><i className="fa-solid fa-list-check text-primary"></i> Critérios oficiais</div>
              {a.notas.map((n) => {
                const p = (Number(n.nota) * 100) / Number(n.notaMaxima);
                return (
                  <div key={n.codigo} className={styles.criterio}>
                    <div className="d-flex justify-content-between gap-2">
                      <strong>{n.codigo} · {n.nome}</strong>
                      <span className={styles.valor}>{formatarNumero(n.nota)}<small>/{formatarNumero(n.notaMaxima)}{Number(n.peso) > 1 ? ` (peso ${formatarNumero(n.peso)})` : ""}</small></span>
                    </div>
                    <div className="av-progresso my-2"><span style={{ width: `${p}%` }}></span></div>
                    {n.comentario && <p className="small text-suave mb-0">{n.comentario}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        {a.status === "CONCLUIDA" && (
          <div className="col-lg-6">
            <div className="av-card h-100">
              <div className="av-titulo-secao"><i className="fa-solid fa-comment-dots text-primary"></i> Devolutiva</div>
              <TextoFormatado texto={a.feedbackGeral} />
              <small className="text-suave"><i className="fa-solid fa-circle-info me-1"></i>Correção para treino, baseada nos critérios oficiais. Não é nota oficial.</small>
            </div>
          </div>
        )}
        <div className={a.status === "CONCLUIDA" ? "col-lg-6" : "col-12"}>
          <div className="av-card h-100">
            <div className="av-titulo-secao"><i className="fa-solid fa-file-lines text-primary"></i> Texto enviado <small className="text-suave fw-normal">(cópia preservada)</small></div>
            <p className="small text-suave mb-2">Tema: {a.temaSnapshot}</p>
            <div className={styles.texto}>{a.textoSnapshot}</div>
          </div>
        </div>
      </div>
      {st && null}
    </Layout>
  );
}

export default DetalheAvaliacao;
