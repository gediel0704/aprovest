import PaginaInstitucional from "../../components/PaginaInstitucional/PaginaInstitucional";

const SECOES = [
  ["Aceite", "Ao criar uma conta, o usuário declara ter lido e aceitado estes termos e a Política de Privacidade."],
  ["O serviço", "O AproVest oferece banca adaptativa de questões oficiais, diagnóstico, simulados com projeção de nota e percentil, correção de redação por IA e por professores, biblioteca de estudos e painel de desempenho para ENEM, FUVEST e Unicamp."],
  ["Natureza das notas", "Notas, projeções e percentis são estimativas internas para treino. Não constituem nota oficial, resultado de vestibular nem probabilidade de aprovação."],
  ["Planos e créditos", "O plano gratuito tem limites de uso (20 questões por dia e 1 correção por IA por mês). O Plano Pro e os créditos de correção humana são contratados na página de planos. Neste projeto acadêmico, o pagamento é simulado e nenhuma cobrança real é feita."],
  ["Conteúdo oficial", "Questões, gabaritos, temas e critérios de correção pertencem às respectivas bancas (INEP, FUVEST e Comvest/Unicamp) e são reproduzidos com a indicação da fonte, para fins educacionais."],
  ["Conduta", "É proibido compartilhar a conta, tentar acessar áreas sem autorização, enviar conteúdo ofensivo nas redações e no Fale Conosco ou automatizar o uso da plataforma."],
  ["Bolsas por mérito", "Todo mês, os 100 alunos mais bem colocados no ranking recebem um mês de Plano Pro, conforme as regras exibidas na página de ranking."],
  ["Encerramento", "O usuário pode solicitar a exclusão da conta a qualquer momento em Configurações. Contas que descumprirem estes termos podem ser bloqueadas pela administração."],
];

// Termos de Uso (página pública)
function Termos() {
  return (
    <PaginaInstitucional selo="Termos de Uso" titulo="Termos de Uso" subtitulo="Regras para usar o AproVest. Atualizado em novembro de 2026.">
      <div className="av-card">
        {SECOES.map(([titulo, texto], i) => (
          <section key={titulo} className={i ? "mt-4" : ""}>
            <h2 className="h5">{i + 1}. {titulo}</h2>
            <p className="text-suave mb-0" style={{ lineHeight: 1.75 }}>{texto}</p>
          </section>
        ))}
      </div>
    </PaginaInstitucional>
  );
}

export default Termos;
