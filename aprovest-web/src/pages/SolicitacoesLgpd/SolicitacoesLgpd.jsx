import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";
import Modal from "../../components/Modal/Modal";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarDataHora } from "../../utils/formatar";

// RN05 / RNF03 - Processar solicitações de exclusão de dados (anonimização)
function SolicitacoesLgpd() {
  const { dados, carregando, erro, recarregar } = useApi("/admin/lgpd");
  const [alvo, setAlvo] = useState(null);
  const [falha, setFalha] = useState("");

  const processar = async () => {
    setFalha("");
    try {
      await api.post(`/admin/lgpd/${alvo.id}/processar`);
      recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    }
    setAlvo(null);
  };

  return (
    <Layout title="Solicitações LGPD" subtitulo="Pedidos de exclusão de dados feitos pelos titulares (Lei nº 13.709/2018).">
      {carregando && <Carregando />}
      {(erro || falha) && <div className="alert alert-danger">{erro || falha}</div>}
      {dados && (dados.length ? (
        <div className="av-card">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr><th>Data</th><th>Titular</th><th>Tipo</th><th>Situação</th><th>Observação</th><th></th></tr></thead>
              <tbody>
                {dados.map((s) => (
                  <tr key={s.id}>
                    <td>{formatarDataHora(s.criadoEm)}</td>
                    <td>{s.usuarioEmail || "-"}</td>
                    <td>{s.tipo === "EXCLUSAO" ? "Exclusão" : "Exportação"}</td>
                    <td><span className={`av-selo ${s.status === "PENDENTE" ? "av-selo-alerta" : "av-selo-sucesso"}`}>{s.status}</span></td>
                    <td><small>{s.observacao || "-"}</small></td>
                    <td className="text-end">{s.status === "PENDENTE" && <button className="btn btn-sm btn-danger" onClick={() => setAlvo(s)}>Processar</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : <div className="av-card"><EstadoVazio icone="fa-shield-halved" titulo="Nenhuma solicitação" /></div>)}
      <Modal isOpen={!!alvo} onClose={() => setAlvo(null)} onConfirm={processar} perigo textoConfirmar="Anonimizar conta" titulo="Processar exclusão?"
        mensagem="Nome, e-mail, data de nascimento, metas, redações e notificações serão removidos; o acesso é bloqueado e as respostas permanecem apenas de forma anônima. A operação é irreversível." />
    </Layout>
  );
}

export default SolicitacoesLgpd;
