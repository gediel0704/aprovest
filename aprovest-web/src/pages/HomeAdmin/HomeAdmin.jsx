import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import CartaoEstatistica from "../../components/CartaoEstatistica/CartaoEstatistica";
import useApi from "../../utils/useApi";
import { formatarDataHora, formatarMoeda } from "../../utils/formatar";

const CORES = ["#4f46e5", "#9333ea", "#f59e0b"];

// UC035 - Relatórios administrativos (pedagógicos e financeiros)
function HomeAdmin() {
  const { dados: d, carregando, erro } = useApi("/admin/resumo");

  const exportarCsv = () => {
    const linhas = [["Indicador", "Valor"],
      ...Object.entries(d.usuarios).map(([k, v]) => [`usuarios.${k}`, v]),
      ...Object.entries(d.questoesPorVestibular).map(([k, v]) => [`questoes.${k}`, v]),
      ...Object.entries(d.engajamento).map(([k, v]) => [`engajamento.${k}`, v]),
      ...Object.entries(d.redacoes).map(([k, v]) => [`redacoes.${k}`, v]),
      ["financeiro.receitaTotal", d.financeiro.receitaTotal],
      ...Object.entries(d.financeiro.receitaPorMes).map(([k, v]) => [`receita.${k}`, v])];
    const csv = linhas.map((l) => l.join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    link.download = "relatorio-aprovest.csv";
    link.click();
  };

  if (carregando) return <Layout title="Relatórios"><Carregando /></Layout>;
  if (erro) return <Layout title="Relatórios"><div className="alert alert-danger">{erro}</div></Layout>;

  const questoes = Object.entries(d.questoesPorVestibular).map(([nome, valor]) => ({ nome, valor }));
  const receita = Object.entries(d.financeiro.receitaPorMes).map(([mes, valor]) => ({ mes, valor: Number(valor) }));

  return (
    <Layout title="Relatórios administrativos" subtitulo="Visão pedagógica, de engajamento e financeira da plataforma."
      acoes={<>
        <button className="btn btn-suave" onClick={exportarCsv}><i className="fa-solid fa-file-csv me-2"></i>Exportar CSV</button>
        <Link to="/admin/correcoes" className="btn btn-primary"><i className="fa-solid fa-user-check me-2"></i>Correções pendentes ({d.redacoes.humanasPendentes})</Link>
      </>}>
      {!d.ia.configurada && (
        <div className="alert alert-warning"><i className="fa-solid fa-robot me-2"></i>Nenhuma chave de IA configurada: as correções usam o corretor offline por regras. <Link to="/admin/ia">Ver serviço de IA</Link></div>
      )}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3"><CartaoEstatistica icone="fa-user-graduate" rotulo="Alunos" valor={d.usuarios.alunos} detalhe={`${d.usuarios.proAtivos} com Plano Pro`} /></div>
        <div className="col-6 col-xl-3"><CartaoEstatistica icone="fa-chalkboard-user" rotulo="Corretores" cor="info" valor={d.usuarios.corretores} /></div>
        <div className="col-6 col-xl-3"><CartaoEstatistica icone="fa-bolt" rotulo="Respostas (7 dias)" cor="destaque" valor={d.engajamento.respostas7d} detalhe={`${d.engajamento.respostas30d} em 30 dias`} /></div>
        <div className="col-6 col-xl-3"><CartaoEstatistica icone="fa-sack-dollar" rotulo="Receita (demonstração)" cor="sucesso" valor={formatarMoeda(d.financeiro.receitaTotal)} detalhe={`${d.financeiro.transacoes} transações`} /></div>
      </div>
      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <div className="av-card h-100">
            <div className="av-titulo-secao">Questões oficiais por vestibular</div>
            <div style={{ height: 230 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={questoes} dataKey="valor" nameKey="nome" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {questoes.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="d-flex justify-content-center gap-3 small">{questoes.map((q, i) => <span key={q.nome}><i className="fa-solid fa-circle me-1" style={{ color: CORES[i] }}></i>{q.nome}: {q.valor}</span>)}</div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="av-card h-100">
            <div className="av-titulo-secao">Engajamento pedagógico</div>
            {[["Diagnósticos concluídos", d.engajamento.diagnosticosConcluidos], ["Simulados concluídos", d.engajamento.simuladosConcluidos],
              ["Redações corrigidas por IA", d.redacoes.iaConcluidas], ["Correções humanas concluídas", d.redacoes.humanasConcluidas],
              ["Correções humanas em andamento", d.redacoes.humanasAtribuidas]].map(([r, v]) => (
              <div key={r} className="d-flex justify-content-between border-bottom py-2"><span>{r}</span><strong>{v}</strong></div>
            ))}
          </div>
        </div>
        <div className="col-lg-4">
          <div className="av-card h-100">
            <div className="av-titulo-secao">Receita por mês</div>
            {receita.length ? (
              <div style={{ height: 230 }}>
                <ResponsiveContainer>
                  <BarChart data={receita}><CartesianGrid strokeDasharray="3 3" stroke="var(--av-borda)" /><XAxis dataKey="mes" fontSize={11} /><YAxis fontSize={11} />
                    <Tooltip formatter={(v) => formatarMoeda(v)} /><Bar dataKey="valor" fill="#10b981" radius={[8, 8, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-suave">Sem transações.</p>}
            <small className="text-suave">{d.financeiro.aviso}</small>
          </div>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="av-card h-100">
            <div className="av-titulo-secao"><i className="fa-solid fa-triangle-exclamation text-warning"></i> Questões com menor taxa de acerto</div>
            {d.questoesMaisErradas.length ? d.questoesMaisErradas.map((q) => (
              <Link key={q.id} to={`/admin/questoes/${q.id}`} className="d-flex justify-content-between border-bottom py-2 text-decoration-none">
                <span><strong>#{q.id}</strong> <small className="text-suave">{q.disciplina} · {q.fonte}</small></span>
                <span className="av-selo av-selo-perigo">{q.taxaAcerto}% ({q.respostas})</span>
              </Link>
            )) : <p className="text-suave mb-0">Dados insuficientes.</p>}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="av-card h-100">
            <div className="av-titulo-secao"><i className="fa-solid fa-receipt text-primary"></i> Últimas transações</div>
            {d.ultimosPagamentos.length ? d.ultimosPagamentos.map((p, i) => (
              <div key={i} className="d-flex justify-content-between border-bottom py-2">
                <span>{p.descricao}<br /><small className="text-suave">{p.aluno} · {formatarDataHora(p.data)} · {p.metodo}</small></span>
                <strong>{formatarMoeda(p.valor)}</strong>
              </div>
            )) : <p className="text-suave mb-0">Nenhuma transação.</p>}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default HomeAdmin;
