import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import Modal from "../../components/Modal/Modal";
import { useAuth } from "../../contexts/AuthContext";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarData, formatarDataHora, formatarMoeda } from "../../utils/formatar";
import styles from "./Acessos.module.css";

const PRODUTOS = {
  PRO_MENSAL: { nome: "Plano Pro - 30 dias", chave: "proMensal", icone: "fa-crown" },
  CREDITO_1: { nome: "1 crédito", chave: "credito", icone: "fa-coins" },
  CREDITO_5: { nome: "Pacote com 5 créditos", chave: "pacote5", icone: "fa-sack-dollar" },
};
const METODOS = [["PIX", "fa-brands fa-pix", "Pix"], ["CARTAO", "fa-solid fa-credit-card", "Cartão"], ["BOLETO", "fa-solid fa-barcode", "Boleto"]];

// RF10 / RF11 / UC039 - Plano Pro, créditos avulsos e checkout de demonstração
function Acessos() {
  const { usuario, atualizarUsuario } = useAuth();
  const { dados, carregando, erro, setDados } = useApi("/acessos");
  const [produto, setProduto] = useState(null);
  const [metodo, setMetodo] = useState("PIX");
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [falha, setFalha] = useState("");

  const pagar = async () => {
    setProcessando(true);
    setFalha("");
    try {
      const r = await api.post("/acessos/checkout", { produto, metodo });
      setDados(r.data.data.acessos);
      setMensagem(`${PRODUTOS[produto].nome} liberado! Código ${r.data.data.pagamento.codigoTransacao} (demonstração).`);
      if (produto === "PRO_MENSAL") atualizarUsuario({ ...usuario, pro: true });
      setProduto(null);
    } catch (e) {
      setFalha(mensagemErro(e));
    } finally {
      setProcessando(false);
    }
  };

  const cancelar = async () => {
    try {
      await api.post("/acessos/assinatura/cancelar-renovacao");
      setDados({ ...dados, assinatura: { ...dados.assinatura, renovacaoAutomatica: false } });
      setMensagem("Renovação automática cancelada. O acesso Pro continua até o fim do período.");
    } catch (e) {
      setFalha(mensagemErro(e));
    }
  };

  return (
    <Layout title="Plano e créditos" subtitulo="Acompanhe seus limites, créditos e pagamentos.">
      {carregando && <Carregando />}
      {(erro || falha) && <div className="alert alert-danger">{erro || falha}</div>}
      {mensagem && <div className="alert alert-success"><i className="fa-solid fa-circle-check me-2"></i>{mensagem}</div>}
      {dados && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-lg-5">
              <div className={`av-card h-100 ${dados.plano === "PRO" ? "av-card-gradiente" : ""}`}>
                <small className="fw-bold text-uppercase">Plano atual</small>
                <h2 className="display-6 fw-bold mb-1">{dados.plano === "PRO" ? "Pro" : "Gratuito"}</h2>
                {dados.plano === "PRO" ? (
                  <>
                    <p className="mb-2">Válido até {formatarData(dados.assinatura.fim)} {dados.assinatura.origem === "BOLSA" && "· bolsa por mérito"}</p>
                    {dados.assinatura.renovacaoAutomatica
                      ? <button className="btn btn-sm btn-light" onClick={cancelar}>Cancelar renovação automática</button>
                      : <small>Renovação automática desativada.</small>}
                  </>
                ) : (
                  <button className="btn btn-gradiente mt-2" onClick={() => setProduto("PRO_MENSAL")}><i className="fa-solid fa-crown me-2"></i>Assinar Pro por {formatarMoeda(dados.precos.proMensal)}/mês</button>
                )}
              </div>
            </div>
            <div className="col-lg-7">
              <div className="av-card h-100">
                <div className="av-titulo-secao"><i className="fa-solid fa-gauge text-primary"></i> Uso dos limites (RN02)</div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between small fw-semibold"><span>Questões da banca hoje</span><span>{dados.limites.questoesHoje}/{dados.limites.questoesDia}</span></div>
                  <div className="av-progresso mt-1"><span style={{ width: `${Math.min(100, (dados.limites.questoesHoje * 100) / dados.limites.questoesDia)}%` }}></span></div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between small fw-semibold"><span>Correções por IA neste mês</span><span>{dados.limites.correcoesIaUsadas}/{dados.limites.correcoesIaMes}</span></div>
                  <div className="av-progresso mt-1"><span style={{ width: `${Math.min(100, (dados.limites.correcoesIaUsadas * 100) / dados.limites.correcoesIaMes)}%` }}></span></div>
                </div>
                <div className={styles.creditos}>
                  <div><i className="fa-solid fa-coins"></i><strong>{dados.creditos}</strong><span>crédito(s) disponíveis</span></div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-sm btn-suave" onClick={() => setProduto("CREDITO_1")}>+1 por {formatarMoeda(dados.precos.credito)}</button>
                    <button className="btn btn-sm btn-primary" onClick={() => setProduto("CREDITO_5")}>+5 por {formatarMoeda(dados.precos.pacote5)}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <div className="av-card h-100">
                <div className="av-titulo-secao"><i className="fa-solid fa-receipt text-primary"></i> Pagamentos</div>
                {dados.pagamentos.length ? dados.pagamentos.map((p) => (
                  <div key={p.id} className={styles.item}>
                    <span><strong>{p.descricao}</strong><small>{formatarDataHora(p.criadoEm)} · {p.metodo} · {p.codigoTransacao}</small></span>
                    <span className="fw-bold">{formatarMoeda(p.valor)}</span>
                  </div>
                )) : <p className="text-suave mb-0">Nenhum pagamento registrado.</p>}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="av-card h-100">
                <div className="av-titulo-secao"><i className="fa-solid fa-list text-primary"></i> Extrato de créditos</div>
                {dados.extrato.length ? dados.extrato.map((m) => (
                  <div key={m.id} className={styles.item}>
                    <span><strong>{m.motivo}</strong><small>{formatarDataHora(m.criadoEm)}</small></span>
                    <span className={`fw-bold ${m.quantidade > 0 ? "text-success" : "text-danger"}`}>{m.quantidade > 0 ? "+" : ""}{m.quantidade}</span>
                  </div>
                )) : <p className="text-suave mb-0">Sem movimentações.</p>}
                {dados.bolsas.length > 0 && (
                  <div className="alert alert-warning mt-3 mb-0"><i className="fa-solid fa-award me-2"></i>Você já recebeu {dados.bolsas.length} bolsa(s) por mérito!</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <Modal isOpen={!!produto} onClose={() => setProduto(null)} onConfirm={pagar} carregando={processando}
        titulo="Checkout" textoConfirmar={produto && dados ? `Pagar ${formatarMoeda(dados.precos[PRODUTOS[produto].chave])}` : "Pagar"}>
        {produto && dados && (
          <>
            <div className={styles.resumo}>
              <i className={`fa-solid ${PRODUTOS[produto].icone}`}></i>
              <div><strong>{PRODUTOS[produto].nome}</strong><small>{produto === "PRO_MENSAL" ? "Renovação automática mensal; cancele quando quiser." : "Créditos não expiram."}</small></div>
              <strong className="ms-auto">{formatarMoeda(dados.precos[PRODUTOS[produto].chave])}</strong>
            </div>
            <label className="form-label mt-3">Forma de pagamento</label>
            <div className="d-flex gap-2">
              {METODOS.map(([k, ic, n]) => (
                <button key={k} type="button" className={`btn flex-fill ${metodo === k ? "btn-primary" : "btn-suave"}`} onClick={() => setMetodo(k)}>
                  <i className={`${ic} me-1`}></i>{n}
                </button>
              ))}
            </div>
            <div className="alert alert-info small mt-3 mb-0">
              <i className="fa-solid fa-flask me-1"></i><strong>Ambiente de demonstração:</strong> nenhum dado de pagamento é solicitado e nenhuma cobrança é realizada.
              O pagamento é registrado como aprovado para fins acadêmicos.
            </div>
          </>
        )}
      </Modal>
    </Layout>
  );
}

export default Acessos;
