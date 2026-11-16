import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import QuestaoForm from "../../components/QuestaoForm/QuestaoForm";
import api, { mensagemErro } from "../../services/api";

// UC030 - Cadastrar item
function NovaQuestao() {
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();

  const enviarQuestao = async (questao) => {
    setErro("");
    setSalvando(true);
    try {
      const response = await api.post("/admin/questoes", questao);
      alert(`Questão #${response.data.data.id} cadastrada com sucesso!`);
      navigate("/admin/questoes");
    } catch (e) {
      setErro(mensagemErro(e));
      setSalvando(false);
    }
  };

  return (
    <Layout title="Nova questão" acoes={<Link to="/admin/questoes" className="btn btn-suave"><i className="fa-solid fa-arrow-left me-2"></i>Banco de questões</Link>}>
      {erro && <div className="alert alert-danger">{erro}</div>}
      <QuestaoForm onSalvar={enviarQuestao} salvando={salvando} />
    </Layout>
  );
}

export default NovaQuestao;
