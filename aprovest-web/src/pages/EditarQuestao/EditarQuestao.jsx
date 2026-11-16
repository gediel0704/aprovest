import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import QuestaoForm from "../../components/QuestaoForm/QuestaoForm";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";

// UC041 - Editar item
function EditarQuestao() {
  const { id } = useParams();
  const { dados, carregando, erro } = useApi(`/admin/questoes/${id}`, [id]);
  const [falha, setFalha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();

  const inicial = useMemo(() => dados && ({
    enunciado: dados.enunciado, introducaoAlternativas: dados.introducaoAlternativas || "", gabarito: dados.gabarito, explicacao: dados.explicacao || "",
    nivel: dados.nivel, ano: dados.ano || "", numero: dados.numero || "", origem: dados.origem, fonteDescricao: dados.fonte, fonteUrl: dados.fonteUrl || "",
    vestibularId: dados.vestibularId, disciplinaId: dados.disciplinaId, topicoIds: dados.topicoIds, alternativas: dados.alternativas,
  }), [dados]);

  const atualizarQuestao = async (questao) => {
    setFalha("");
    setSalvando(true);
    try {
      await api.put(`/admin/questoes/${id}`, questao);
      alert(`Questão #${id} atualizada com sucesso`);
      navigate("/admin/questoes");
    } catch (e) {
      setFalha(mensagemErro(e));
      setSalvando(false);
    }
  };

  return (
    <Layout title={`Editar questão #${id}`} subtitulo={dados ? `${dados.totalRespostas} respostas · taxa de acerto ${dados.taxaAcerto ?? "-"}% · dificuldade calibrada ${dados.dificuldade}` : ""}
      acoes={<Link to="/admin/questoes" className="btn btn-suave"><i className="fa-solid fa-arrow-left me-2"></i>Banco de questões</Link>}>
      {carregando && <Carregando />}
      {(erro || falha) && <div className="alert alert-danger">{erro || falha}</div>}
      {inicial && <QuestaoForm inicial={inicial} onSalvar={atualizarQuestao} salvando={salvando} />}
    </Layout>
  );
}

export default EditarQuestao;
