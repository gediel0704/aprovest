import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import Modal from "../../components/Modal/Modal";
import { useAuth } from "../../contexts/AuthContext";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarDataHora } from "../../utils/formatar";

// Interruptor (switch) de preferência
const Interruptor = ({ campo, rotulo, descricao, ligado, onChange }) => (
  <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0 py-2 border-bottom">
    <label className="form-check-label" htmlFor={campo}><strong>{rotulo}</strong><br /><small className="text-suave">{descricao}</small></label>
    <input className="form-check-input ms-3" type="checkbox" role="switch" id={campo} checked={ligado} onChange={(e) => onChange(e.target.checked)} />
  </div>
);

// RF14 / RF16 / RNF14 / UC006 / UC008 / UC009 / UC038 - Configurações da conta
function Configuracoes() {
  const { usuario, atualizarUsuario, logout } = useAuth();
  const [aba, setAba] = useState("preferencias");
  const [msg, setMsg] = useState({ tipo: "", texto: "" });
  const [senha, setSenha] = useState({ senhaAtual: "", novaSenha: "", confirmar: "" });
  const [email, setEmail] = useState({ novoEmail: "", senhaAtual: "" });
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const solicitacoes = useApi(aba === "privacidade" ? "/usuarios/me/solicitacoes" : null, [aba]);
  const navigate = useNavigate();

  const avisar = (tipo, texto) => setMsg({ tipo, texto });

  const salvarPreferencia = async (campo, valor) => {
    try {
      const r = await api.put("/usuarios/me/preferencias", { [campo]: valor });
      atualizarUsuario(r.data.data);
      avisar("success", "Preferência salva.");
    } catch (e) {
      avisar("danger", mensagemErro(e));
    }
  };

  const alterarSenha = async (e) => {
    e.preventDefault();
    if (senha.novaSenha !== senha.confirmar) return avisar("danger", "As senhas não conferem.");
    try {
      await api.put("/usuarios/me/senha", { senhaAtual: senha.senhaAtual, novaSenha: senha.novaSenha });
      setSenha({ senhaAtual: "", novaSenha: "", confirmar: "" });
      avisar("success", "Senha alterada com sucesso.");
    } catch (er) {
      avisar("danger", mensagemErro(er));
    }
  };

  const alterarEmail = async (e) => {
    e.preventDefault();
    try {
      await api.put("/usuarios/me/email", email);
      avisar("success", "E-mail alterado. Faça login novamente.");
      setTimeout(async () => { await logout(); navigate("/login"); }, 1800);
    } catch (er) {
      avisar("danger", mensagemErro(er));
    }
  };

  const exportar = async () => {
    try {
      const r = await api.get("/usuarios/me/exportar");
      const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "meus-dados-aprovest.json";
      link.click();
      URL.revokeObjectURL(link.href);
      avisar("success", "Arquivo gerado com seus dados.");
    } catch (e) {
      avisar("danger", mensagemErro(e));
    }
  };

  const solicitarExclusao = async () => {
    try {
      const r = await api.post("/usuarios/me/exclusao");
      avisar("success", r.data.message);
      solicitacoes.recarregar();
    } catch (e) {
      avisar("danger", mensagemErro(e));
    }
    setConfirmarExclusao(false);
  };

  const interruptor = (campo, rotulo, descricao) => (
    <Interruptor campo={campo} rotulo={rotulo} descricao={descricao} ligado={!!usuario?.[campo]} onChange={(v) => salvarPreferencia(campo, v)} />
  );

  return (
    <Layout title="Configurações" subtitulo="Preferências, segurança e privacidade da sua conta.">
      <ul className="nav nav-pills mb-4 flex-wrap">
        {[["preferencias", "Preferências"], ["seguranca", "Segurança"], ["privacidade", "Privacidade (LGPD)"]].map(([k, n]) => (
          <li className="nav-item" key={k}><button className={`nav-link ${aba === k ? "active" : ""}`} onClick={() => { setAba(k); setMsg({}); }}>{n}</button></li>
        ))}
      </ul>
      {msg.texto && <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>}

      {aba === "preferencias" && (
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="av-card h-100">
              <div className="av-titulo-secao"><i className="fa-solid fa-palette text-primary"></i> Aparência</div>
              <label className="form-label">Tema</label>
              <div className="d-flex gap-2 mb-4">
                {[["claro", "fa-sun", "Claro"], ["escuro", "fa-moon", "Escuro"]].map(([v, ic, n]) => (
                  <button key={v} className={`btn flex-fill ${usuario?.tema === v ? "btn-primary" : "btn-suave"}`} onClick={() => salvarPreferencia("tema", v)}>
                    <i className={`fa-solid ${ic} me-2`}></i>{n}
                  </button>
                ))}
              </div>
              <label className="form-label">Tamanho da fonte de leitura</label>
              <div className="d-flex gap-2">
                {[["pequena", "A-"], ["normal", "A"], ["grande", "A+"], ["extra", "A++"]].map(([v, n]) => (
                  <button key={v} className={`btn flex-fill ${usuario?.tamanhoFonte === v ? "btn-primary" : "btn-suave"}`} onClick={() => salvarPreferencia("tamanhoFonte", v)} aria-label={`Fonte ${v}`}>{n}</button>
                ))}
              </div>
              {usuario?.tipo === "ALUNO" && <Link to="/aluno/meta" className="btn btn-suave w-100 mt-4"><i className="fa-solid fa-bullseye me-2"></i>Editar perfil e metas</Link>}
            </div>
          </div>
          <div className="col-lg-6">
            <div className="av-card h-100">
              <div className="av-titulo-secao"><i className="fa-solid fa-bell text-primary"></i> Notificações e ranking</div>
              {interruptor("notifBanca", "Banca diária", "Aviso quando a banca do dia estiver pronta.")}
              {interruptor("notifRedacao", "Correções de redação", "Status das correções por IA e humanas.")}
              {interruptor("notifSimulado", "Simulados", "Abertura de simulados e resultados.")}
              {interruptor("notifNovidades", "Novidades", "Comunicados da equipe AproVest.")}
              {interruptor("rankingPublico", "Participar do ranking", "Exibe seu nome abreviado no ranking e permite concorrer à bolsa.")}
            </div>
          </div>
        </div>
      )}

      {aba === "seguranca" && (
        <div className="row g-4">
          <div className="col-lg-6">
            <form className="av-card h-100" onSubmit={alterarSenha}>
              <div className="av-titulo-secao"><i className="fa-solid fa-key text-primary"></i> Alterar senha</div>
              <input type="password" className="form-control mb-2" placeholder="Senha atual" value={senha.senhaAtual} onChange={(e) => setSenha({ ...senha, senhaAtual: e.target.value })} required autoComplete="current-password" />
              <input type="password" className="form-control mb-2" placeholder="Nova senha (mín. 8, letras e números)" value={senha.novaSenha} onChange={(e) => setSenha({ ...senha, novaSenha: e.target.value })} required autoComplete="new-password" />
              <input type="password" className="form-control mb-3" placeholder="Confirmar nova senha" value={senha.confirmar} onChange={(e) => setSenha({ ...senha, confirmar: e.target.value })} required autoComplete="new-password" />
              <button className="btn btn-primary">Salvar nova senha</button>
            </form>
          </div>
          <div className="col-lg-6">
            <form className="av-card h-100" onSubmit={alterarEmail}>
              <div className="av-titulo-secao"><i className="fa-solid fa-envelope text-primary"></i> Alterar e-mail</div>
              <p className="small text-suave">E-mail atual: <strong>{usuario?.email}</strong></p>
              <input type="email" className="form-control mb-2" placeholder="Novo e-mail" value={email.novoEmail} onChange={(e) => setEmail({ ...email, novoEmail: e.target.value })} required />
              <input type="password" className="form-control mb-3" placeholder="Confirme com sua senha atual" value={email.senhaAtual} onChange={(e) => setEmail({ ...email, senhaAtual: e.target.value })} required />
              <button className="btn btn-primary">Alterar e-mail</button>
              <small className="d-block text-suave mt-2">Por segurança, todas as sessões serão encerradas.</small>
            </form>
          </div>
        </div>
      )}

      {aba === "privacidade" && (
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="av-card h-100">
              <div className="av-titulo-secao"><i className="fa-solid fa-file-export text-primary"></i> Exportar meus dados</div>
              <p className="text-suave">Baixe um arquivo JSON com seu perfil, respostas, redações, avaliações, notificações e pagamentos (não é um backup integral do banco).</p>
              <button className="btn btn-primary" onClick={exportar}><i className="fa-solid fa-download me-2"></i>Exportar meus dados</button>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="av-card h-100">
              <div className="av-titulo-secao"><i className="fa-solid fa-user-xmark text-danger"></i> Solicitar exclusão</div>
              <p className="text-suave">O pedido é registrado e processado pela equipe: seus dados pessoais e redações são removidos e as respostas ficam anônimas (RN05).</p>
              <button className="btn btn-outline-danger" onClick={() => setConfirmarExclusao(true)}>Solicitar exclusão dos meus dados</button>
              {solicitacoes.dados?.length > 0 && (
                <ul className="small mt-3 mb-0">
                  {solicitacoes.dados.map((s) => <li key={s.id}>{s.tipo === "EXCLUSAO" ? "Exclusão" : "Exportação"} · {s.status} · {formatarDataHora(s.criadoEm)}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={confirmarExclusao} onClose={() => setConfirmarExclusao(false)} onConfirm={solicitarExclusao} perigo textoConfirmar="Confirmar solicitação"
        titulo="Solicitar exclusão de dados?" mensagem="Após o processamento, sua conta será anonimizada e não poderá ser recuperada." />
    </Layout>
  );
}

export default Configuracoes;
