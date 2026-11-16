import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import Modal from "../../components/Modal/Modal";
import RedacaoForm from "../../components/RedacaoForm/RedacaoForm";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarNumero, STATUS_AVALIACAO } from "../../utils/formatar";

// UC022 - Visualizar e editar redação + UC024 / UC025 - solicitar correção
function EditarRedacao() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { dados, carregando, erro, recarregar } = useApi(`/redacoes/${id}`, [id]);
  const acessos = useApi("/acessos");
  const [mensagem, setMensagem] = useState(location.state?.mensagem || "");
  const [falha, setFalha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmar, setConfirmar] = useState(null);

  const inicial = useMemo(() => dados && {
    titulo: dados.redacao.titulo, tema: dados.redacao.tema, texto: dados.redacao.texto, status: dados.redacao.status,
    vestibularId: dados.redacao.vestibular.id, temaRedacaoId: dados.redacao.temaRedacao?.id || "",
  }, [dados]);

  useEffect(() => { if (location.state?.mensagem) window.history.replaceState({}, ""); }, [location.state]);

  const salvar = async (form) => {
    setFalha(""); setMensagem(""); setSalvando(true);
    try {
      await api.put(`/redacoes/${id}`, form);
      setMensagem("Alterações salvas.");
      recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  };

  const solicitar = async () => {
    setFalha(""); setSalvando(true);
    try {
      const tipo = confirmar;
      const r = await api.post(`/redacoes/${id}/${tipo === "IA" ? "correcao-ia" : "correcao-humana"}`);
      setConfirmar(null);
      navigate(`/aluno/avaliacoes/${r.data.data.id}`);
    } catch (e) {
      setFalha(mensagemErro(e));
      setConfirmar(null);
    } finally {
      setSalvando(false);
    }
  };

  const limites = acessos.dados?.limites;

  return (
    <Layout title={dados ? dados.redacao.titulo : "Redação"} subtitulo="Edite o texto e solicite a correção pela banca escolhida."
      acoes={<Link to="/aluno/redacoes" className="btn btn-suave"><i className="fa-solid fa-arrow-left me-2"></i>Caderno de redações</Link>}>
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {mensagem && <div className="alert alert-success"><i className="fa-solid fa-circle-check me-2"></i>{mensagem}</div>}
      {falha && <div className="alert alert-danger">{falha}</div>}
      {dados && (
        <>
          <div className="av-card mb-4">
            <div className="row g-3 align-items-center">
              <div className="col-lg-6">
                <div className="av-titulo-secao mb-1"><i className="fa-solid fa-robot text-primary"></i> Solicitar correção · {dados.redacao.vestibular.sigla}</div>
                <small className="text-suave">Grade oficial: {dados.grade.escala}</small>
              </div>
              <div className="col-lg-6 d-flex gap-2 flex-wrap justify-content-lg-end">
                <button className="btn btn-gradiente" onClick={() => setConfirmar("IA")}>
                  <i className="fa-solid fa-wand-magic-sparkles me-2"></i>Corrigir com IA
                  {limites && <small className="ms-2 opacity-75">({limites.correcoesIaUsadas}/{limites.correcoesIaMes} no mês)</small>}
                </button>
                <button className="btn btn-suave" onClick={() => setConfirmar("HUMANA")}>
                  <i className="fa-solid fa-user-check me-2"></i>Correção humana (1 crédito)
                </button>
              </div>
            </div>
            {dados.avaliacoes.length > 0 && (
              <div className="table-responsive mt-3">
                <table className="table table-sm align-middle mb-0">
                  <thead><tr><th>Data</th><th>Tipo</th><th>Situação</th><th>Nota</th><th></th></tr></thead>
                  <tbody>
                    {dados.avaliacoes.map((a) => (
                      <tr key={a.id}>
                        <td>{formatarDataHora(a.solicitadaEm)}</td>
                        <td>{a.tipo === "IA" ? "IA" : "Humana"}</td>
                        <td><span className={`av-selo ${STATUS_AVALIACAO[a.status].classe}`}><i className={`fa-solid ${STATUS_AVALIACAO[a.status].icone}`}></i>{STATUS_AVALIACAO[a.status].texto}</span></td>
                        <td>{a.notaTotal !== null ? `${formatarNumero(a.notaTotal)}/${formatarNumero(a.notaMaxima)}` : "-"}</td>
                        <td className="text-end"><Link to={`/aluno/avaliacoes/${a.id}`} className="btn btn-sm btn-suave">Abrir</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <RedacaoForm inicial={inicial} onSalvar={salvar} salvando={salvando} />
        </>
      )}

      <Modal isOpen={!!confirmar} onClose={() => setConfirmar(null)} onConfirm={solicitar} carregando={salvando}
        titulo={confirmar === "IA" ? "Corrigir com IA?" : "Solicitar correção humana?"} textoConfirmar="Solicitar"
        mensagem={confirmar === "IA"
          ? `A IA corrige uma cópia do texto atual nos critérios oficiais. Uso no mês: ${limites?.correcoesIaUsadas ?? "-"} de ${limites?.correcoesIaMes ?? "-"} correções do seu plano.`
          : `Um professor credenciado fará a devolutiva em até 72 horas. Será consumido 1 crédito (saldo atual: ${acessos.dados?.creditos ?? "-"}).`} />
    </Layout>
  );
}

export default EditarRedacao;
