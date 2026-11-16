import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import Modal from "../../components/Modal/Modal";
import Questao from "../../components/Questao/Questao";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarNumero } from "../../utils/formatar";

const VEREDITOS = { APROVADO: ["Aprovado", "av-selo-sucesso"], AJUSTAR: ["Precisa de ajuste", "av-selo-alerta"], REPROVADO: ["Reprovado", "av-selo-perigo"] };

// UC029 - Avaliar conteúdo: o parecer não publica nem altera a questão automaticamente
function AvaliarConteudo() {
  const [pagina, setPagina] = useState(0);
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const itens = useApi(`/corretor/conteudos?pagina=${pagina}&busca=${encodeURIComponent(termo)}`, [pagina, termo]);
  const pareceres = useApi("/corretor/pareceres");
  const [selecionada, setSelecionada] = useState(null);
  const [veredito, setVeredito] = useState("APROVADO");
  const [comentario, setComentario] = useState("");
  const [falha, setFalha] = useState("");
  const [ok, setOk] = useState("");

  const enviar = async () => {
    setFalha("");
    try {
      await api.post(`/corretor/conteudos/${selecionada.id}/parecer`, { veredito, comentario });
      setOk(`Parecer registrado para a questão #${selecionada.id}.`);
      setSelecionada(null);
      setComentario("");
      pareceres.recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    }
  };

  return (
    <Layout title="Avaliar conteúdos" subtitulo="Revise a qualidade pedagógica das questões. O parecer é encaminhado à administração.">
      {ok && <div className="alert alert-success">{ok}</div>}
      <form className="av-card mb-4 d-flex gap-2" onSubmit={(e) => { e.preventDefault(); setPagina(0); setTermo(busca); }}>
        <input className="form-control" placeholder="Buscar por enunciado ou fonte (ex.: FUVEST 2025)" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <button className="btn btn-primary"><i className="fa-solid fa-magnifying-glass"></i></button>
      </form>
      <div className="row g-4">
        <div className="col-lg-8">
          {itens.carregando ? <Carregando /> : itens.erro ? <div className="alert alert-danger">{itens.erro}</div> : itens.dados.map((q) => (
            <div className="av-card mb-3" key={q.id}>
              <div className="d-flex justify-content-between flex-wrap gap-2 mb-2">
                <span className="av-selo av-selo-primario">#{q.id} · {q.vestibular}</span>
                <span className="small text-suave">{q.totalRespostas} respostas · acerto {q.taxaAcerto ?? "-"}% · dificuldade {formatarNumero(q.dificuldade)}</span>
              </div>
              <Questao questao={q} gabarito={q.gabarito} bloqueada />
              <button className="btn btn-sm btn-primary mt-3" onClick={() => { setSelecionada(q); setFalha(""); }}><i className="fa-solid fa-stamp me-2"></i>Emitir parecer</button>
            </div>
          ))}
          <div className="d-flex justify-content-between">
            <button className="btn btn-suave" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
            <button className="btn btn-suave" disabled={!itens.dados || itens.dados.length < 15} onClick={() => setPagina(pagina + 1)}>Próxima</button>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="av-card">
            <div className="av-titulo-secao"><i className="fa-solid fa-stamp text-primary"></i> Meus pareceres</div>
            {pareceres.dados?.length ? pareceres.dados.map((p) => (
              <div key={p.id} className="border-bottom py-2">
                <div className="d-flex justify-content-between"><strong>Questão #{p.questaoId}</strong><span className={`av-selo ${VEREDITOS[p.veredito][1]}`}>{VEREDITOS[p.veredito][0]}</span></div>
                <small className="text-suave">{formatarDataHora(p.criadoEm)}</small>
                <p className="small mb-0">{p.comentario}</p>
              </div>
            )) : <p className="text-suave mb-0">Nenhum parecer emitido.</p>}
          </div>
        </div>
      </div>
      <Modal isOpen={!!selecionada} onClose={() => setSelecionada(null)} onConfirm={enviar} titulo={`Parecer · questão #${selecionada?.id}`} textoConfirmar="Registrar parecer">
        <label className="form-label">Veredito</label>
        <select className="form-select mb-3" value={veredito} onChange={(e) => setVeredito(e.target.value)}>
          {Object.entries(VEREDITOS).map(([k, [n]]) => <option key={k} value={k}>{n}</option>)}
        </select>
        <label className="form-label">Comentário (mínimo de 20 caracteres)</label>
        <textarea className="form-control" rows="4" value={comentario} onChange={(e) => setComentario(e.target.value)}></textarea>
        {falha && <div className="alert alert-danger mt-3 mb-0">{falha}</div>}
      </Modal>
    </Layout>
  );
}

export default AvaliarConteudo;
