import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import Modal from "../../components/Modal/Modal";
import { useAuth } from "../../contexts/AuthContext";
import api, { mensagemErro } from "../../services/api";
import useApi from "../../utils/useApi";
import { formatarData } from "../../utils/formatar";

const PAPEIS = { ALUNO: "Aluno", CORRETOR: "Corretor(a)", ADMIN: "Administrador(a)" };

// RF09 / UC033 - Gerenciar usuários e papéis
function ListarUsuario() {
  const { usuario: eu } = useAuth();
  const [tipo, setTipo] = useState("");
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [pagina, setPagina] = useState(0);
  const qs = new URLSearchParams({ tipo, busca: termo, pagina }).toString();
  const { dados, carregando, erro, recarregar } = useApi(`/admin/usuarios?${qs}`, [qs]);
  const [papelModal, setPapelModal] = useState(null);
  const [novo, setNovo] = useState(null);
  const [falha, setFalha] = useState("");

  const alterarPapel = async () => {
    setFalha("");
    try {
      await api.put(`/admin/usuarios/${papelModal.id}/papel`, { tipo: papelModal.novoTipo });
      setPapelModal(null);
      recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    }
  };

  const alternarStatus = async (u) => {
    try {
      await api.put(`/admin/usuarios/${u.id}/status?ativo=${!u.ativo}`);
      recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    }
  };

  const criar = async () => {
    setFalha("");
    try {
      await api.post("/admin/usuarios", novo);
      setNovo(null);
      recarregar(true);
    } catch (e) {
      setFalha(mensagemErro(e));
    }
  };

  return (
    <Layout title="Usuários e papéis" subtitulo="Atribua os papéis Aluno, Corretor e Administrador. O Plano Pro é controlado pela assinatura."
      acoes={<button className="btn btn-gradiente" onClick={() => { setFalha(""); setNovo({ nome: "", email: "", password: "", tipo: "CORRETOR", formacao: "" }); }}><i className="fa-solid fa-user-plus me-2"></i>Novo usuário</button>}>
      <form className="av-card mb-4 row g-2 mx-0" onSubmit={(e) => { e.preventDefault(); setPagina(0); setTermo(busca); }}>
        <div className="col-md-7"><input className="form-control" placeholder="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
        <div className="col-md-4"><select className="form-select" value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(0); }} aria-label="Papel"><option value="">Todos os papéis</option>{Object.entries(PAPEIS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></div>
        <div className="col-md-1 d-grid"><button className="btn btn-primary" aria-label="Buscar"><i className="fa-solid fa-magnifying-glass"></i></button></div>
      </form>
      {(erro || (falha && !papelModal && !novo)) && <div className="alert alert-danger">{erro || falha}</div>}
      {carregando ? <Carregando /> : dados && (
        <div className="av-card">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Plano</th><th>Desde</th><th>Situação</th><th></th></tr></thead>
              <tbody>
                {dados.content.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.nome}</strong></td>
                    <td>{u.email}</td>
                    <td><span className="av-selo av-selo-primario">{PAPEIS[u.tipo]}</span></td>
                    <td>{u.tipo === "ALUNO" ? (u.pro ? <span className="av-selo av-selo-alerta"><i className="fa-solid fa-crown"></i>Pro</span> : "Gratuito") : "-"}</td>
                    <td>{formatarData(u.criadoEm)}</td>
                    <td><span className={`av-selo ${u.ativo ? "av-selo-sucesso" : "av-selo-perigo"}`}>{u.ativo ? "Ativo" : "Inativo"}</span></td>
                    <td className="text-end text-nowrap">
                      {u.id !== eu.id && <>
                        <button className="btn btn-sm btn-suave me-1" onClick={() => { setFalha(""); setPapelModal({ ...u, novoTipo: u.tipo }); }} aria-label="Alterar papel"><i className="fa-solid fa-user-shield"></i></button>
                        <button className={`btn btn-sm ${u.ativo ? "btn-outline-danger" : "btn-outline-success"}`} onClick={() => alternarStatus(u)} aria-label="Ativar ou desativar"><i className={`fa-solid ${u.ativo ? "fa-ban" : "fa-check"}`}></i></button>
                      </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-sm btn-suave" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
            <small className="text-suave">{dados.totalElements} usuários</small>
            <button className="btn btn-sm btn-suave" disabled={pagina + 1 >= dados.totalPages} onClick={() => setPagina(pagina + 1)}>Próxima</button>
          </div>
        </div>
      )}
      <Modal isOpen={!!papelModal} onClose={() => setPapelModal(null)} onConfirm={alterarPapel} titulo={`Papel de ${papelModal?.nome}`} textoConfirmar="Confirmar alteração">
        {papelModal && <>
          <select className="form-select" value={papelModal.novoTipo} onChange={(e) => setPapelModal({ ...papelModal, novoTipo: e.target.value })}>
            {Object.entries(PAPEIS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
          <small className="text-suave d-block mt-2">O usuário será desconectado e precisará entrar novamente.</small>
          {falha && <div className="alert alert-danger mt-2 mb-0">{falha}</div>}
        </>}
      </Modal>
      <Modal isOpen={!!novo} onClose={() => setNovo(null)} onConfirm={criar} titulo="Novo usuário" textoConfirmar="Criar">
        {novo && <>
          <input className="form-control mb-2" placeholder="Nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          <input className="form-control mb-2" placeholder="E-mail" type="email" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
          <input className="form-control mb-2" placeholder="Senha inicial (mín. 8, letras e números)" type="password" value={novo.password} onChange={(e) => setNovo({ ...novo, password: e.target.value })} autoComplete="new-password" />
          <select className="form-select mb-2" value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}>{Object.entries(PAPEIS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
          {novo.tipo === "CORRETOR" && <input className="form-control" placeholder="Formação (ex.: Licenciatura em Letras)" value={novo.formacao} onChange={(e) => setNovo({ ...novo, formacao: e.target.value })} />}
          {falha && <div className="alert alert-danger mt-2 mb-0">{falha}</div>}
        </>}
      </Modal>
    </Layout>
  );
}

export default ListarUsuario;
