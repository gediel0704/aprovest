import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../contexts/AuthContext";
import api, { mensagemErro } from "../../services/api";
import styles from "./Meta.module.css";

const VESTIBULARES = [
  { sigla: "ENEM", nome: "ENEM", desc: "INEP · SiSU, ProUni, Fies e universidades federais", icone: "fa-building-columns" },
  { sigla: "FUVEST", nome: "FUVEST", desc: "Vestibular da Universidade de São Paulo (USP)", icone: "fa-landmark" },
  { sigla: "UNICAMP", nome: "Unicamp", desc: "Vestibular da Universidade Estadual de Campinas", icone: "fa-university" },
];
const CURSOS = ["Medicina", "Direito", "Engenharia", "Ciência da Computação", "Psicologia", "Arquitetura e Urbanismo", "Administração", "Enfermagem", "Odontologia", "Economia", "Relações Internacionais", "Jornalismo", "Biologia", "Farmácia", "Pedagogia", "Letras"];
const UNIVERSIDADES = ["USP", "Unicamp", "Unesp", "UFSCar", "Unifesp", "UFRJ", "UFMG", "UnB", "UFPR", "UFRGS", "UFSC", "UFPE", "UFBA", "UFC"];

// UC005 - Editar perfil e metas (também usado no primeiro acesso)
function Meta() {
  const { usuario, atualizarUsuario } = useAuth();
  const [form, setForm] = useState({
    nome: usuario?.nome || "",
    dataNascimento: usuario?.dataNascimento || "",
    cursoAlvo: usuario?.cursoAlvo || "",
    universidadeAlvo: usuario?.universidadeAlvo || "",
  });
  const [alvos, setAlvos] = useState(usuario?.vestibularesAlvo?.length ? usuario.vestibularesAlvo : ["ENEM"]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();
  const primeiroAcesso = !usuario?.onboardingConcluido;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const alternar = (sigla) => setAlvos(alvos.includes(sigla) ? alvos.filter((a) => a !== sigla) : [...alvos, sigla]);

  const salvar = async (e) => {
    e.preventDefault();
    setErro("");
    if (alvos.length < 1 || alvos.length > 3) return setErro("Escolha de 1 a 3 vestibulares.");
    setSalvando(true);
    try {
      const r = await api.put("/usuarios/me", { ...form, dataNascimento: form.dataNascimento || null, vestibularesAlvo: alvos });
      atualizarUsuario(r.data.data);
      navigate(primeiroAcesso ? "/aluno/diagnostico" : "/aluno");
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout title={primeiroAcesso ? "Vamos definir sua meta" : "Minha meta"}
      subtitulo="Seu curso, universidade e vestibulares-alvo personalizam a banca, os simulados e o percentil.">
      <form onSubmit={salvar} className="row g-4">
        <div className="col-lg-7">
          <div className="av-card">
            <div className="av-titulo-secao"><span className={styles.passo}>1</span> Escolha seus vestibulares (1 a 3)</div>
            <div className="row g-3">
              {VESTIBULARES.map((v) => (
                <div className="col-md-4" key={v.sigla}>
                  <button type="button" onClick={() => alternar(v.sigla)} aria-pressed={alvos.includes(v.sigla)}
                    className={`${styles.opcao} ${alvos.includes(v.sigla) ? styles.selecionada : ""}`}>
                    <i className={`fa-solid ${v.icone}`}></i>
                    <strong>{v.nome}</strong>
                    <small>{v.desc}</small>
                    <span className={styles.check}><i className="fa-solid fa-check"></i></span>
                  </button>
                </div>
              ))}
            </div>
            <div className="av-titulo-secao mt-4"><span className={styles.passo}>2</span> Curso e universidade desejados</div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="cursoAlvo">Curso</label>
                <input id="cursoAlvo" name="cursoAlvo" list="cursos" className="form-control" value={form.cursoAlvo} onChange={handleChange} placeholder="Ex.: Medicina" maxLength={120} />
                <datalist id="cursos">{CURSOS.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="universidadeAlvo">Universidade</label>
                <input id="universidadeAlvo" name="universidadeAlvo" list="universidades" className="form-control" value={form.universidadeAlvo} onChange={handleChange} placeholder="Ex.: USP" maxLength={120} />
                <datalist id="universidades">{UNIVERSIDADES.map((u) => <option key={u} value={u} />)}</datalist>
              </div>
            </div>
            <small className="text-suave d-block mt-2">O percentil dos simulados compara você com quem mira o mesmo curso e universidade (mínimo de 5 alunos).</small>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="av-card mb-4">
            <div className="av-titulo-secao"><span className={styles.passo}>3</span> Seus dados</div>
            <label className="form-label" htmlFor="nome">Nome</label>
            <input id="nome" name="nome" className="form-control mb-3" value={form.nome} onChange={handleChange} required minLength={3} />
            <label className="form-label" htmlFor="dataNascimento">Data de nascimento (opcional)</label>
            <input id="dataNascimento" name="dataNascimento" type="date" className="form-control" value={form.dataNascimento || ""} onChange={handleChange} />
          </div>
          {erro && <div className="alert alert-danger">{erro}</div>}
          <button type="submit" className="btn btn-gradiente w-100 py-2" disabled={salvando}>
            {salvando ? <span className="spinner-border spinner-border-sm"></span> : primeiroAcesso ? "Salvar e fazer o diagnóstico" : "Salvar meta"}
          </button>
        </div>
      </form>
    </Layout>
  );
}

export default Meta;
