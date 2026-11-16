import { ListaMenu } from "../MenuAluno/MenuAluno";

// Menu do Professor / Corretor credenciado
export const LINKS_CORRETOR = [
  { grupo: "Área docente" },
  { para: "/corretor", icone: "fa-inbox", texto: "Fila de correções", fim: true },
  { para: "/corretor/conteudos", icone: "fa-list-check", texto: "Avaliar conteúdos" },
  { para: "/corretor/ganhos", icone: "fa-sack-dollar", texto: "Meus ganhos" },
];

const MenuCorretor = ({ aoNavegar }) => <ListaMenu links={LINKS_CORRETOR} aoNavegar={aoNavegar} />;

export default MenuCorretor;
