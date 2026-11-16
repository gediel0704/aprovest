import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Layout from "../../components/Layout/Layout";
import Carregando from "../../components/Carregando/Carregando";
import SeletorVestibular from "../../components/SeletorVestibular/SeletorVestibular";
import { useAuth } from "../../contexts/AuthContext";
import useApi from "../../utils/useApi";
import { formatarData, formatarDataHora, formatarNumero, vestibularPadrao } from "../../utils/formatar";

// RF19 - Exportação de relatório consolidado de desempenho em PDF
function Relatorio() {
  const { usuario } = useAuth();
  const [vestibular, setVestibular] = useState(vestibularPadrao(usuario));
  const { dados: d, carregando, erro } = useApi(`/painel/relatorio?vestibular=${vestibular}`, [vestibular]);

  const gerarPdf = () => {
    const doc = new jsPDF();
    const roxo = [79, 70, 229];
    doc.setFillColor(...roxo);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("AproVest - Relatório de desempenho", 14, 15);
    doc.setFontSize(10);
    doc.text(`${d.aluno.nome} · ${d.vestibular.nome} · gerado em ${formatarDataHora(d.geradoEm)}`, 14, 24);
    doc.setTextColor(30, 30, 50);
    doc.setFontSize(12);
    let y = 44;
    const linha = (rotulo, valor) => { doc.setFont(undefined, "bold"); doc.text(rotulo, 14, y); doc.setFont(undefined, "normal"); doc.text(String(valor), 75, y); y += 7; };
    linha("Meta:", `${d.meta.curso || "-"} · ${d.meta.universidade || "-"}`);
    linha("Projeção atual:", d.projecaoNota ? formatarNumero(d.projecaoNota, 1) : "sem avaliações");
    linha("Escala:", d.escala.slice(0, 80));
    linha("Último percentil:", d.ultimoPercentil != null ? `${formatarNumero(d.ultimoPercentil)}º` : "-");
    linha("Questões respondidas:", `${d.totalRespondidas} (${d.totalAcertos} acertos)`);
    linha("Sequência de estudo:", `${d.sequenciaDias} dia(s)`);

    autoTable(doc, { startY: y + 4, head: [["Disciplina", "Acertos", "Total", "%"]], headStyles: { fillColor: roxo },
      body: d.desempenhoDisciplinas.map((x) => [x.disciplina, x.acertos, x.total, `${x.percentual}%`]) });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [["Avaliação", "Data", "Acertos", "Nota", "Percentil"]], headStyles: { fillColor: roxo },
      body: d.evolucao.map((e) => [e.modo === "SIMULADO" ? `Simulado ${e.tipo?.toLowerCase() || ""}` : "Diagnóstico", formatarData(e.data), `${e.acertos}/${e.total}`, formatarNumero(e.nota, 1), e.percentil != null ? `${formatarNumero(e.percentil)}º` : "-"]) });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [["Tópicos a reforçar", "Disciplina", "Acertos", "Nível"]], headStyles: { fillColor: roxo },
      body: d.proficienciaTopicos.slice(0, 8).map((t) => [t.topico, t.disciplina, `${t.acertos}/${t.tentativas}`, t.nivel]) });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [["Plano da semana", "Prioridade", "Acerto 30d", "Questões"]], headStyles: { fillColor: roxo },
      body: d.plano.disciplinas.map((p) => [p.disciplina, p.prioridade, p.taxaAcerto30d !== null ? `${p.taxaAcerto30d}%` : "-", p.questoesSugeridasSemana]) });
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 130);
    doc.text("Projeções e percentis são estimativas internas do AproVest, não notas oficiais nem probabilidade de aprovação.", 14, 288);
    doc.save(`relatorio-aprovest-${vestibular.toLowerCase()}.pdf`);
  };

  return (
    <Layout title="Relatório de desempenho" subtitulo="Exporte um PDF consolidado para uso pessoal ou para compartilhar com sua escola ou cursinho.">
      <div className="d-flex flex-wrap gap-3 justify-content-between mb-4">
        <SeletorVestibular valor={vestibular} onChange={setVestibular} opcoes={usuario?.vestibularesAlvo} />
        <button className="btn btn-gradiente" disabled={!d} onClick={gerarPdf}><i className="fa-solid fa-file-pdf me-2"></i>Baixar PDF</button>
      </div>
      {carregando && <Carregando />}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {d && (
        <div className="av-card">
          <h2 className="h5">{d.aluno.nome}</h2>
          <p className="text-suave">{d.vestibular.nome} · Meta: {d.meta.curso || "-"} / {d.meta.universidade || "-"}</p>
          <div className="row g-3 mb-3">
            {[["Projeção", d.projecaoNota ? formatarNumero(d.projecaoNota, 1) : "-"], ["Percentil", d.ultimoPercentil != null ? `${formatarNumero(d.ultimoPercentil)}º` : "-"],
              ["Respondidas", d.totalRespondidas], ["Acertos", d.totalAcertos]].map(([r, v]) => (
              <div className="col-6 col-md-3" key={r}><div className="p-3 rounded-4" style={{ background: "var(--av-superficie-2)" }}><small className="text-suave">{r}</small><div className="fs-4 fw-bold">{v}</div></div></div>
            ))}
          </div>
          <h3 className="h6 mt-4">Desempenho por disciplina</h3>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead><tr><th>Disciplina</th><th>Acertos</th><th>Total</th><th>%</th></tr></thead>
              <tbody>{d.desempenhoDisciplinas.map((x) => <tr key={x.disciplina}><td>{x.disciplina}</td><td>{x.acertos}</td><td>{x.total}</td><td>{x.percentual}%</td></tr>)}</tbody>
            </table>
          </div>
          <p className="small text-suave mb-0">O PDF inclui também a evolução nas avaliações, os tópicos a reforçar e o plano da semana.</p>
        </div>
      )}
    </Layout>
  );
}

export default Relatorio;
