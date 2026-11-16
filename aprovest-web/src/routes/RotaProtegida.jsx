import { Navigate, useLocation } from "react-router-dom";
import { useAuth, rotaInicial } from "../contexts/AuthContext";

// RN01 - Autenticação obrigatória e controle de acesso por papel (RN03)
const RotaProtegida = ({ papeis, children }) => {
  const { usuario } = useAuth();
  const location = useLocation();
  if (!usuario || !localStorage.getItem("aprovest_token")) {
    return <Navigate to={`/login?voltar=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (papeis && !papeis.includes(usuario.tipo)) {
    return <Navigate to={rotaInicial(usuario)} replace />;
  }
  return children;
};

export default RotaProtegida;
