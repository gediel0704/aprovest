import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

function lerUsuarioSalvo() {
  try {
    return JSON.parse(localStorage.getItem("aprovest_usuario") || "null");
  } catch {
    return null;
  }
}

/** Aplica tema (claro/escuro) e tamanho de fonte no <html> (RF16 / RNF14). */
function aplicarPreferencias(usuario) {
  const tema = usuario?.tema || localStorage.getItem("aprovest_tema") || "claro";
  const fonte = usuario?.tamanhoFonte || localStorage.getItem("aprovest_fonte") || "normal";
  document.documentElement.setAttribute("data-tema", tema);
  document.documentElement.setAttribute("data-bs-theme", tema === "escuro" ? "dark" : "light");
  document.documentElement.setAttribute("data-fonte", fonte);
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(lerUsuarioSalvo);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    aplicarPreferencias(usuario);
  }, [usuario]);

  const salvarUsuario = useCallback((u) => {
    setUsuario(u);
    if (u) {
      localStorage.setItem("aprovest_usuario", JSON.stringify(u));
      localStorage.setItem("aprovest_tema", u.tema);
      localStorage.setItem("aprovest_fonte", u.tamanhoFonte);
    } else {
      localStorage.removeItem("aprovest_usuario");
    }
  }, []);

  // Recarrega os dados do usuário ao abrir a aplicação (mantém plano e preferências atualizados)
  useEffect(() => {
    if (!localStorage.getItem("aprovest_token")) return;
    api.get("/usuarios/me")
      .then((r) => salvarUsuario(r.data.data))
      .catch(() => {});
  }, [salvarUsuario]);

  const registrarSessao = useCallback((dados) => {
    localStorage.setItem("aprovest_token", dados.accessToken);
    salvarUsuario(dados.usuario);
    return dados.usuario;
  }, [salvarUsuario]);

  const login = useCallback(async (email, password) => {
    setCarregando(true);
    try {
      const r = await api.post("/auth/authenticate", { email, password });
      return registrarSessao(r.data.data);
    } finally {
      setCarregando(false);
    }
  }, [registrarSessao]);

  const cadastrar = useCallback(async (dados) => {
    setCarregando(true);
    try {
      const r = await api.post("/auth/register", dados);
      return registrarSessao(r.data.data);
    } finally {
      setCarregando(false);
    }
  }, [registrarSessao]);

  const loginGoogle = useCallback(async (credential) => {
    const r = await api.post("/auth/google", { credential });
    return registrarSessao(r.data.data);
  }, [registrarSessao]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* encerra localmente mesmo sem resposta da API */
    }
    localStorage.removeItem("aprovest_token");
    salvarUsuario(null);
  }, [salvarUsuario]);

  const alternarTemaLocal = useCallback((tema) => {
    localStorage.setItem("aprovest_tema", tema);
    if (usuario) salvarUsuario({ ...usuario, tema });
    else aplicarPreferencias({ tema });
  }, [usuario, salvarUsuario]);

  const valor = useMemo(() => ({
    usuario, carregando, login, cadastrar, loginGoogle, logout,
    atualizarUsuario: salvarUsuario, alternarTemaLocal,
    autenticado: !!usuario,
    papel: usuario?.tipo,
  }), [usuario, carregando, login, cadastrar, loginGoogle, logout, salvarUsuario, alternarTemaLocal]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Página inicial de cada papel após o login. */
export function rotaInicial(usuario) {
  if (!usuario) return "/login";
  if (usuario.tipo === "ADMIN") return "/admin";
  if (usuario.tipo === "CORRETOR") return "/corretor";
  return usuario.onboardingConcluido ? "/aluno" : "/aluno/meta";
}
