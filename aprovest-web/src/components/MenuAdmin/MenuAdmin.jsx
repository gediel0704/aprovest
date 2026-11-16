import { ListaMenu } from "../MenuAluno/MenuAluno";
import { LINKS_ALUNO } from "../MenuAluno/MenuAluno";

// Menu do Administrador (inclui o acesso às telas do aluno, conforme os casos de uso)
export const LINKS_ADMIN = [
  { grupo: "Administração" },
  { para: "/admin", icone: "fa-chart-pie", texto: "Relatórios", fim: true },
  { para: "/admin/questoes", icone: "fa-database", texto: "Banco de questões" },
  { para: "/admin/materiais", icone: "fa-book", texto: "Materiais" },
  { para: "/admin/temas", icone: "fa-lightbulb", texto: "Temas de redação" },
  { para: "/admin/usuarios", icone: "fa-users-gear", texto: "Usuários e papéis" },
  { para: "/admin/correcoes", icone: "fa-user-check", texto: "Correção humana" },
  { para: "/admin/bolsas", icone: "fa-award", texto: "Bolsas por mérito" },
  { para: "/admin/ia", icone: "fa-robot", texto: "Serviço de IA" },
  { para: "/admin/lgpd", icone: "fa-shield-halved", texto: "Solicitações LGPD" },
  { para: "/admin/comunicados", icone: "fa-bullhorn", texto: "Comunicados" },
  { para: "/admin/contatos", icone: "fa-envelope", texto: "Fale Conosco" },
  { grupo: "Docência" },
  { para: "/corretor", icone: "fa-inbox", texto: "Fila docente" },
  ...LINKS_ALUNO.filter((l) => !l.grupo || l.grupo === "Estudo").map((l) => (l.grupo ? { grupo: "Visão do aluno" } : l)),
];

const MenuAdmin = ({ aoNavegar }) => <ListaMenu links={LINKS_ADMIN} aoNavegar={aoNavegar} />;

export default MenuAdmin;
