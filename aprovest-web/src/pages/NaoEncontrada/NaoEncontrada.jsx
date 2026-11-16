import { Link } from "react-router-dom";
import MenuPublico from "../../components/MenuPublico/MenuPublico";
import EstadoVazio from "../../components/EstadoVazio/EstadoVazio";

function NaoEncontrada() {
  return (
    <>
      <MenuPublico />
      <div className="container py-5">
        <div className="av-card">
          <EstadoVazio icone="fa-compass" titulo="Página não encontrada" texto="O endereço acessado não existe ou foi movido.">
            <Link to="/" className="btn btn-gradiente">Voltar ao início</Link>
          </EstadoVazio>
        </div>
      </div>
    </>
  );
}

export default NaoEncontrada;
