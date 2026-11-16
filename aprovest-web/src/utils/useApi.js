import { useCallback, useEffect, useState } from "react";
import api, { mensagemErro } from "../services/api";

/**
 * Hook personalizado que busca dados na API back-end ao carregar a página.
 * Usa os hooks useState (estado) e useEffect (efeito ao carregar), como no projeto modelo.
 * Retorna { dados, carregando, erro, recarregar, setDados }.
 */
export default function useApi(url, dependencias = []) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const recarregar = useCallback(async (silencioso = false) => {
    if (!url) return;
    if (!silencioso) setCarregando(true);
    setErro("");
    try {
      const response = await api.get(url);
      setDados(response.data.data);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...dependencias]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { dados, carregando, erro, recarregar, setDados };
}
