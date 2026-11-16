import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import Modal from "../../components/Modal/Modal";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarDataHora } from "../../utils/formatar";
import { ASSUNTOS } from "../Contato/Contato";

export const STATUS_CONTATO = {
  NOVA: { texto: "Nova", classe: "av-selo-alerta" },
  EM_ATENDIMENTO: { texto: "Em atendimento", classe: "av-selo-primario" },
  RESPONDIDA: { texto: "Respondida", classe: "av-selo-sucesso" },
};

// UC049 - Gerenciar mensagens do Fale Conosco (consultar, alterar situação/observação e excluir)
function MensagensContato() {
  const [status, setStatus] = useState("");
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const url = `/admin/contatos?status=${status}&busca=${encodeURIComponent(termo)}`;
  const { dados, carregando, erro, recarregar } = useApi(url, [url]);
  const resumo = useApi("/admin/contatos/resumo", [dados]);
  const [aberta, setAberta] = useState(null);
  const [edicao, setEdicao] = useState({ status: "NOVA", observacao: "" });
  const [excluir, setExcluir] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [falha, setFalha] = useState("");

  const abrir = (m) => { setAberta(m); setEdicao({ status: m.status, observacao: m.observacao || "" }); setFalha(""); };

  const salvar = async () => {
    setSalvando(true);
    setFalha("");
    try {
      await api.put(`/admin/contatos/${aberta.id}`, edicao);
      setAviso("Mensagem atualizada.");
      setAberta(null);
      recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    try {
      await api.delete(`/admin/contatos/${excluir.id}`);
      setAviso("Mensagem excluída.");
      recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    }
    setExcluir(null);
  };

  const r = resumo.dados;
  return (
    <Layout title="Fale Conosco" subtitulo="Mensagens enviadas pela página pública de contato.">
      {r && (
        <div className="row g-3 mb-4">
          {[["Novas", r.novas, "fa-envelope", "text-warning"], ["Em atendimento", r.emAtendimento, "fa-headset", "text-primary"], ["Respondidas", r.respondidas, "fa-circle-check", "text-success"]].map(([t, v, ic, cor]) => (
            <div className="col-md-4" key={t}>
              <div className="av-card d-flex align-items-center gap-3">
                <i className={`fa-solid ${ic} fa-xl ${cor}`}></i>
                <div><div className="h4 mb-0">{v}</div><small className="text-suave">{t}</small></div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="av-card mb-3">
        <form className="row g-2 align-items-center" onSubmit={(e) => { e.preventDefault(); setTermo(busca); }}>
          <div className="col-md-6">
            <input type="search" className="form-control" placeholder="Buscar por nome, e-mail ou texto" aria-label="Buscar mensagens" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="col-md-4">
            <select className="form-select" aria-label="Situação" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todas as situações</option>
              {Object.entries(STATUS_CONTATO).map(([v, s]) => <option key={v} value={v}>{s.texto}</option>)}
            </select>
          </div>
          <div className="col-md-2 d-grid"><button className="btn btn-primary"><i className="fa-solid fa-magnifying-glass me-2"></i>Buscar</button></div>
        </form>
      </div>
      {aviso && <div className="alert alert-success"><i className="fa-solid fa-circle-check me-2"></i>{aviso}</div>}
      {(erro || falha) && !aberta && <div className="alert alert-danger">{erro || falha}</div>}
      {carregando && <Carregando />}
      {dados && (dados.content.length ? (
        <div className="av-card">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Recebida</th><th>Remetente</th><th>Assunto</th><th>Situação</th><th></th></tr></thead>
              <tbody>
                {dados.content.map((m) => (
                  <tr key={m.id}>
                    <td><small>{formatarDataHora(m.criadoEm)}</small><div className="small text-suave">AV-{String(m.id).padStart(6, "0")}</div></td>
                    <td><strong>{m.nome}</strong><div className="small text-suave">{m.email}</div></td>
                    <td><small>{ASSUNTOS[m.assunto] || m.assunto}</small></td>
                    <td><span className={`av-selo ${STATUS_CONTATO[m.status].classe}`}>{STATUS_CONTATO[m.status].texto}</span></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-primary me-1" onClick={() => abrir(m)}><i className="fa-solid fa-pen me-1"></i>Abrir</button>
                      <button className="btn btn-sm btn-suave text-danger" aria-label={`Excluir mensagem de ${m.nome}`} onClick={() => setExcluir(m)}><i className="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : <div className="av-card"><EstadoVazio icone="fa-envelope-open" titulo="Nenhuma mensagem encontrada" texto="As mensagens do Fale Conosco aparecem aqui." /></div>)}

      <Modal isOpen={!!aberta} onClose={() => setAberta(null)} onConfirm={salvar} carregando={salvando} largo
        titulo={aberta ? `Mensagem de ${aberta.nome}` : ""} textoConfirmar="Salvar alterações">
        {aberta && (
          <>
            <p className="small text-suave mb-1">{aberta.email} · {ASSUNTOS[aberta.assunto]} · {formatarDataHora(aberta.criadoEm)}</p>
            <div className="p-3 rounded mb-3" style={{ background: "var(--av-fundo)", whiteSpace: "pre-wrap" }}>{aberta.mensagem}</div>
            <label className="form-label" htmlFor="statusContato">Situação</label>
            <select id="statusContato" className="form-select mb-3" value={edicao.status} onChange={(e) => setEdicao({ ...edicao, status: e.target.value })}>
              {Object.entries(STATUS_CONTATO).map(([v, s]) => <option key={v} value={v}>{s.texto}</option>)}
            </select>
            <label className="form-label" htmlFor="observacao">Observação interna</label>
            <textarea id="observacao" className="form-control" rows="3" maxLength={500} value={edicao.observacao}
              onChange={(e) => setEdicao({ ...edicao, observacao: e.target.value })} placeholder="Ex.: respondido por e-mail em 17/11." />
            {falha && <div className="alert alert-danger mt-3 mb-0">{falha}</div>}
          </>
        )}
      </Modal>
      <Modal isOpen={!!excluir} onClose={() => setExcluir(null)} onConfirm={confirmarExclusao} perigo textoConfirmar="Excluir"
        titulo="Excluir mensagem?" mensagem={`A mensagem de ${excluir?.nome} será apagada definitivamente do banco de dados.`} />
    </Layout>
  );
}

export default MensagensContato;
