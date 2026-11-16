import { Link } from "react-router-dom";
import PaginaInstitucional from "../../components/PaginaInstitucional/PaginaInstitucional";

const SECOES = [
  ["Quem somos", "O AproVest é um projeto acadêmico de TCC do Curso Técnico em Informática da FIEB - ITB Brasílio Flores de Azevedo (Barueri - SP). Este documento explica como os dados pessoais são tratados, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)."],
  ["Dados coletados", "Cadastro: nome, e-mail, senha (guardada apenas como hash BCrypt) e, opcionalmente, data de nascimento. Meta de estudo: vestibulares, curso e universidade desejados. Uso da plataforma: respostas às questões, sessões de estudo, redações, avaliações, leituras, créditos e notificações. Fale Conosco: nome, e-mail e mensagem."],
  ["Finalidade", "Os dados são usados para autenticar o acesso, personalizar a banca de questões e o plano de estudo, calcular projeções e percentis, corrigir redações, gerar relatórios de desempenho e responder às mensagens de contato. Não há venda nem uso publicitário dos dados."],
  ["Base legal", "Execução do serviço solicitado pelo titular e consentimento registrado no cadastro e no formulário de contato (art. 7º, incisos I e V, da LGPD)."],
  ["Compartilhamento", "O texto da redação enviado para correção por IA é processado pelo serviço de inteligência artificial contratado (Anthropic), sem o nome ou o e-mail do aluno. O percentil compara desempenhos de forma agregada, sem identificar outros alunos."],
  ["Segurança", "Senhas com hash BCrypt, autenticação por token JWT revogável no logout, bloqueio temporário após tentativas de login falhas, limite de requisições e backup diário do banco de dados com retenção de 30 dias."],
  ["Direitos do titular", "Em Configurações, o aluno pode consultar e corrigir seus dados, exportá-los em arquivo e solicitar a exclusão da conta. A exclusão anonimiza o cadastro e remove redações e notificações; as respostas permanecem apenas de forma anônima para estatísticas."],
  ["Contato do encarregado", "Pedidos sobre dados pessoais podem ser feitos pelo Fale Conosco, escolhendo o assunto \"Privacidade e dados pessoais (LGPD)\"."],
];

// Política de Privacidade (página pública)
function Privacidade() {
  return (
    <PaginaInstitucional selo="LGPD · Lei nº 13.709/2018" titulo="Política de Privacidade" subtitulo="Atualizada em novembro de 2026.">
      <div className="av-card">
        {SECOES.map(([titulo, texto], i) => (
          <section key={titulo} className={i ? "mt-4" : ""}>
            <h2 className="h5">{i + 1}. {titulo}</h2>
            <p className="text-suave mb-0" style={{ lineHeight: 1.75 }}>{texto}</p>
          </section>
        ))}
        <p className="mt-4 mb-0"><Link to="/contato" className="btn btn-primary"><i className="fa-solid fa-envelope me-2"></i>Falar sobre meus dados</Link></p>
      </div>
    </PaginaInstitucional>
  );
}

export default Privacidade;
