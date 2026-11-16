import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import RedacaoForm from "../../components/RedacaoForm/RedacaoForm";
import api, { mensagemErro } from "../../services/api";

// UC021 - Criar redação
function NovaRedacao() {
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();

  const salvar = async (dados) => {
    setErro("");
    setSalvando(true);
    try {
      const r = await api.post("/redacoes", dados);
      navigate(`/aluno/redacoes/${r.data.data.id}`, { state: { mensagem: "Redação salva! Agora você pode solicitar a correção." } });
    } catch (error) {
      setErro(mensagemErro(error));
      setSalvando(false);
    }
  };

  return (
    <Layout title="Nova redação" subtitulo="Escolha um tema oficial ou livre e escreva seu texto.">
      {erro && <div className="alert alert-danger">{erro}</div>}
      <RedacaoForm onSalvar={salvar} salvando={salvando} />
    </Layout>
  );
}

export default NovaRedacao;
