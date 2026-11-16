import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import Modal from "../../components/Modal/Modal";
import TextoFormatado from "../../components/TextoFormatado/TextoFormatado";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import styles from "./CorrigirRedacao.module.css";

// UC028 - Enviar devolutiva humana usando a grade oficial da banca
function CorrigirRedacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dados, carregando, erro } = useApi(`/corretor/fila/${id}`, [id]);
  const [notas, setNotas] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [feedback, setFeedback] = useState("");
  const [falha, setFalha] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!dados) return;
    const iniciais = {};
    dados.grade.criterios.forEach((c) => { iniciais[c.codigo] = c.minimo; });
    setNotas(iniciais);
  }, [dados]);

  if (carregando) return <Layout title="Correção"><Carregando /></Layout>;
  if (erro) return <Layout title="Correção"><div className="alert alert-danger">{erro}</div></Layout>;

  const { avaliacao: a, grade, tema } = dados;
  const total = grade.criterios.reduce((s, c) => s + (notas[c.codigo] ?? c.minimo) * c.peso, 0);
  const concluida = a.status === "CONCLUIDA";

  const enviar = async () => {
    setEnviando(true);
    setFalha("");
    try {
      await api.post(`/corretor/fila/${id}/devolutiva`, {
        feedbackGeral: feedback,
        notas: grade.criterios.map((c) => ({ codigo: c.codigo, nota: notas[c.codigo], comentario: comentarios[c.codigo] || "" })),
      });
      navigate("/corretor");
    } catch (e) {
      setFalha(mensagemErro(e));
      setConfirmar(false);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Layout title={a.tituloSnapshot} subtitulo={`${grade.banca} · ${grade.escala}`}
      acoes={<Link to="/corretor" className="btn btn-suave"><i className="fa-solid fa-arrow-left me-2"></i>Fila</Link>}>
      {concluida && <div className="alert alert-success">Esta correção já foi concluída.</div>}
      {falha && <div className="alert alert-danger">{falha}</div>}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="av-card mb-3">
            <div className="av-titulo-secao"><i className="fa-solid fa-file-lines text-primary"></i> Texto do aluno</div>
            <p className="small text-suave">Tema: {a.temaSnapshot}</p>
            <div className={styles.texto}>{a.textoSnapshot}</div>
          </div>
          {tema && (
            <div className="av-card">
              <div className="av-titulo-secao"><i className="fa-solid fa-scroll text-primary"></i> Proposta oficial · {tema.genero}</div>
              <TextoFormatado texto={tema.proposta} className="small" />
              {tema.expectativaBanca && (
                <details className="mt-2"><summary className="fw-semibold">Abordagem esperada pela banca</summary><TextoFormatado texto={tema.expectativaBanca} className="small mt-2" /></details>
              )}
            </div>
          )}
        </div>
        <div className="col-lg-6">
          <div className="av-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="av-titulo-secao mb-0"><i className="fa-solid fa-list-check text-primary"></i> Grade oficial</div>
              <span className={styles.total}>{total}<small>/{grade.notaMaxima}</small></span>
            </div>
            {grade.criterios.map((c) => (
              <div key={c.codigo} className={styles.criterio}>
                <label className="form-label mb-1">{c.codigo} · {c.nome}</label>
                <p className="small text-suave mb-2">{c.descricao}</p>
                <div className="d-flex flex-wrap gap-1 mb-2">
                  {Array.from({ length: (c.maximo - c.minimo) / c.passo + 1 }, (_, i) => c.minimo + i * c.passo).map((v) => (
                    <button key={v} type="button" disabled={concluida} className={`btn btn-sm ${notas[c.codigo] === v ? "btn-primary" : "btn-suave"}`}
                      onClick={() => setNotas({ ...notas, [c.codigo]: v })} title={c.niveis[(v - c.minimo) / c.passo]}>{v}</button>
                  ))}
                </div>
                <small className="d-block text-suave mb-2">{c.niveis[((notas[c.codigo] ?? c.minimo) - c.minimo) / c.passo]}</small>
                <textarea className="form-control form-control-sm" rows="2" placeholder="Comentário sobre este critério" disabled={concluida}
                  value={comentarios[c.codigo] || ""} onChange={(e) => setComentarios({ ...comentarios, [c.codigo]: e.target.value })}></textarea>
              </div>
            ))}
            <label className="form-label mt-3" htmlFor="feedback">Devolutiva geral (mínimo de 20 caracteres)</label>
            <textarea id="feedback" className="form-control mb-3" rows="5" value={feedback} disabled={concluida} onChange={(e) => setFeedback(e.target.value)}></textarea>
            {!concluida && (
              <button className="btn btn-gradiente w-100" disabled={feedback.trim().length < 20} onClick={() => setConfirmar(true)}>
                <i className="fa-solid fa-paper-plane me-2"></i>Enviar devolutiva
              </button>
            )}
          </div>
        </div>
      </div>
      <Modal isOpen={confirmar} onClose={() => setConfirmar(false)} onConfirm={enviar} carregando={enviando} textoConfirmar="Enviar"
        titulo="Enviar devolutiva?" mensagem={`Nota final: ${total} de ${grade.notaMaxima}. Após o envio, a correção é concluída e o aluno é notificado.`} />
    </Layout>
  );
}

export default CorrigirRedacao;
