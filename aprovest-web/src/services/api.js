import axios from "axios";

// Endereço da API back-end (Spring Boot). Pode ser alterado no arquivo .env (VITE_API_URL).
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Envia o token JWT em todas as requisições autenticadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aprovest_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sessão expirada: limpa os dados e volta para o login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.includes("/auth/")) {
      localStorage.removeItem("aprovest_token");
      localStorage.removeItem("aprovest_usuario");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?sessao=expirada";
      }
    }
    return Promise.reject(error);
  }
);

/** Extrai uma mensagem amigável do erro retornado pela API. */
export function mensagemErro(error) {
  const dados = error?.response?.data;
  if (dados?.messages?.length) return dados.messages.join(" ");
  if (dados?.message) return dados.message;
  if (error?.code === "ERR_NETWORK") return "Não foi possível conectar ao servidor. Verifique se a API está em execução.";
  return "Ocorreu um erro inesperado. Tente novamente.";
}

export default api;
