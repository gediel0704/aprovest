import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Carregando from "../components/Carregando/Carregando";
import RotaProtegida from "./RotaProtegida";

// Páginas públicas
const Home = lazy(() => import("../pages/Home/Home"));
const Sobre = lazy(() => import("../pages/Sobre/Sobre"));
const Planos = lazy(() => import("../pages/Planos/Planos"));
const Login = lazy(() => import("../pages/Login/Login"));
const Cadastro = lazy(() => import("../pages/Cadastro/Cadastro"));
const EsqueciSenha = lazy(() => import("../pages/EsqueciSenha/EsqueciSenha"));
const RedefinirSenha = lazy(() => import("../pages/RedefinirSenha/RedefinirSenha"));
const NaoEncontrada = lazy(() => import("../pages/NaoEncontrada/NaoEncontrada"));

// Aluno
const HomeAluno = lazy(() => import("../pages/HomeAluno/HomeAluno"));
const Meta = lazy(() => import("../pages/Meta/Meta"));
const Diagnostico = lazy(() => import("../pages/Diagnostico/Diagnostico"));
const Banca = lazy(() => import("../pages/Banca/Banca"));
const Simulados = lazy(() => import("../pages/Simulados/Simulados"));
const Sessao = lazy(() => import("../pages/Sessao/Sessao"));
const ResultadoSessao = lazy(() => import("../pages/ResultadoSessao/ResultadoSessao"));
const ListarRedacao = lazy(() => import("../pages/ListarRedacao/ListarRedacao"));
const NovaRedacao = lazy(() => import("../pages/NovaRedacao/NovaRedacao"));
const EditarRedacao = lazy(() => import("../pages/EditarRedacao/EditarRedacao"));
const ListarAvaliacao = lazy(() => import("../pages/ListarAvaliacao/ListarAvaliacao"));
const DetalheAvaliacao = lazy(() => import("../pages/DetalheAvaliacao/DetalheAvaliacao"));
const Biblioteca = lazy(() => import("../pages/Biblioteca/Biblioteca"));
const Material = lazy(() => import("../pages/Material/Material"));
const FontesOficiais = lazy(() => import("../pages/FontesOficiais/FontesOficiais"));
const QuestoesEnem = lazy(() => import("../pages/QuestoesEnem/QuestoesEnem"));
const PlanoEstudo = lazy(() => import("../pages/PlanoEstudo/PlanoEstudo"));
const Historico = lazy(() => import("../pages/Historico/Historico"));
const Ranking = lazy(() => import("../pages/Ranking/Ranking"));
const Relatorio = lazy(() => import("../pages/Relatorio/Relatorio"));
const Acessos = lazy(() => import("../pages/Acessos/Acessos"));

// Comuns a todos os papéis
const Notificacoes = lazy(() => import("../pages/Notificacoes/Notificacoes"));
const Configuracoes = lazy(() => import("../pages/Configuracoes/Configuracoes"));

// Corretor
const HomeCorretor = lazy(() => import("../pages/HomeCorretor/HomeCorretor"));
const CorrigirRedacao = lazy(() => import("../pages/CorrigirRedacao/CorrigirRedacao"));
const AvaliarConteudo = lazy(() => import("../pages/AvaliarConteudo/AvaliarConteudo"));
const MeusGanhos = lazy(() => import("../pages/MeusGanhos/MeusGanhos"));

// Administrador
const HomeAdmin = lazy(() => import("../pages/HomeAdmin/HomeAdmin"));
const ListarQuestao = lazy(() => import("../pages/ListarQuestao/ListarQuestao"));
const NovaQuestao = lazy(() => import("../pages/NovaQuestao/NovaQuestao"));
const EditarQuestao = lazy(() => import("../pages/EditarQuestao/EditarQuestao"));
const ImportarQuestoes = lazy(() => import("../pages/ImportarQuestoes/ImportarQuestoes"));
const ListarMaterial = lazy(() => import("../pages/ListarMaterial/ListarMaterial"));
const ListarTema = lazy(() => import("../pages/ListarTema/ListarTema"));
const ListarUsuario = lazy(() => import("../pages/ListarUsuario/ListarUsuario"));
const CorrecoesHumanas = lazy(() => import("../pages/CorrecoesHumanas/CorrecoesHumanas"));
const Bolsas = lazy(() => import("../pages/Bolsas/Bolsas"));
const ServicoIA = lazy(() => import("../pages/ServicoIA/ServicoIA"));
const SolicitacoesLgpd = lazy(() => import("../pages/SolicitacoesLgpd/SolicitacoesLgpd"));
const Comunicados = lazy(() => import("../pages/Comunicados/Comunicados"));

const ALUNO = ["ALUNO", "ADMIN"];
const CORRETOR = ["CORRETOR", "ADMIN"];
const ADMIN = ["ADMIN"];
const TODOS = ["ALUNO", "CORRETOR", "ADMIN"];

const p = (papeis, elemento) => <RotaProtegida papeis={papeis}>{elemento}</RotaProtegida>;

function AppRoutes() {
  return (
    <BrowserRouter>
      {/* As páginas são carregadas sob demanda (code splitting) para abrir mais rápido - RNF04 */}
      <Suspense fallback={<Carregando />}>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/planos" element={<Planos />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        {/* Aluno (o administrador também é autorizado) */}
        <Route path="/aluno" element={p(ALUNO, <HomeAluno />)} />
        <Route path="/aluno/meta" element={p(ALUNO, <Meta />)} />
        <Route path="/aluno/diagnostico" element={p(ALUNO, <Diagnostico />)} />
        <Route path="/aluno/banca" element={p(ALUNO, <Banca />)} />
        <Route path="/aluno/simulados" element={p(ALUNO, <Simulados />)} />
        <Route path="/aluno/sessao/:id" element={p(ALUNO, <Sessao />)} />
        <Route path="/aluno/sessao/:id/resultado" element={p(ALUNO, <ResultadoSessao />)} />
        <Route path="/aluno/redacoes" element={p(ALUNO, <ListarRedacao />)} />
        <Route path="/aluno/redacoes/nova" element={p(ALUNO, <NovaRedacao />)} />
        <Route path="/aluno/redacoes/:id" element={p(ALUNO, <EditarRedacao />)} />
        <Route path="/aluno/avaliacoes" element={p(ALUNO, <ListarAvaliacao />)} />
        <Route path="/aluno/avaliacoes/:id" element={p(TODOS, <DetalheAvaliacao />)} />
        <Route path="/aluno/biblioteca" element={p(TODOS, <Biblioteca />)} />
        <Route path="/aluno/biblioteca/:id" element={p(TODOS, <Material />)} />
        <Route path="/aluno/fontes-oficiais" element={p(TODOS, <FontesOficiais />)} />
        <Route path="/aluno/questoes-enem" element={p(ALUNO, <QuestoesEnem />)} />
        <Route path="/aluno/plano" element={p(ALUNO, <PlanoEstudo />)} />
        <Route path="/aluno/historico" element={p(ALUNO, <Historico />)} />
        <Route path="/aluno/ranking" element={p(ALUNO, <Ranking />)} />
        <Route path="/aluno/relatorio" element={p(ALUNO, <Relatorio />)} />
        <Route path="/aluno/acessos" element={p(ALUNO, <Acessos />)} />

        {/* Comuns */}
        <Route path="/notificacoes" element={p(TODOS, <Notificacoes />)} />
        <Route path="/configuracoes" element={p(TODOS, <Configuracoes />)} />

        {/* Corretor */}
        <Route path="/corretor" element={p(CORRETOR, <HomeCorretor />)} />
        <Route path="/corretor/correcao/:id" element={p(CORRETOR, <CorrigirRedacao />)} />
        <Route path="/corretor/conteudos" element={p(CORRETOR, <AvaliarConteudo />)} />
        <Route path="/corretor/ganhos" element={p(CORRETOR, <MeusGanhos />)} />

        {/* Administrador */}
        <Route path="/admin" element={p(ADMIN, <HomeAdmin />)} />
        <Route path="/admin/questoes" element={p(ADMIN, <ListarQuestao />)} />
        <Route path="/admin/questoes/nova" element={p(ADMIN, <NovaQuestao />)} />
        <Route path="/admin/questoes/importar" element={p(ADMIN, <ImportarQuestoes />)} />
        <Route path="/admin/questoes/:id" element={p(ADMIN, <EditarQuestao />)} />
        <Route path="/admin/materiais" element={p(ADMIN, <ListarMaterial />)} />
        <Route path="/admin/temas" element={p(ADMIN, <ListarTema />)} />
        <Route path="/admin/usuarios" element={p(ADMIN, <ListarUsuario />)} />
        <Route path="/admin/correcoes" element={p(ADMIN, <CorrecoesHumanas />)} />
        <Route path="/admin/bolsas" element={p(ADMIN, <Bolsas />)} />
        <Route path="/admin/ia" element={p(ADMIN, <ServicoIA />)} />
        <Route path="/admin/lgpd" element={p(ADMIN, <SolicitacoesLgpd />)} />
        <Route path="/admin/comunicados" element={p(ADMIN, <Comunicados />)} />

        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;
