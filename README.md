# AproVest - Sua aprovação guiada por dados

Plataforma web de preparação para **ENEM, FUVEST e Unicamp** com banca adaptativa, correção de redação por IA nas competências oficiais de cada banca, correção humana, simulados com percentil real e Painel da Meta.

Projeto de TCC do Curso Técnico em Informática (turma INF2CM), FIEB / ITB Brasílio Flores de Azevedo, Barueri, 2026.

| Equipe | Função |
|---|---|
| Gediel França Terlesqui | Fundador, Fullstack e Supervisor |
| Isabella de Oliveira Celestino Almeida | Fundadora, CMO e Front-End |
| Livia Ivanira da Silveira Ponte | Fundadora e DBA |
| Nicole de Oliveira Justo | Fundadora e ADM |
| Vinicius Nunes Mendonça Gonçalves | Fundador e Fullstack |

## Estrutura do repositório

```
AproVest/
├── aprovest-api/      Back-end: Java 21 + Spring Boot 4 + Spring Security (JWT) + JPA + SQL Server
├── aprovest-web/      Front-end: React + Vite + JavaScript + Bootstrap + CSS Modules
├── database/          Scripts do Microsoft SQL Server e importadores das questões oficiais
```

A estrutura segue o modelo do professor: no front, as páginas ficam em `pages/NomeDaPagina/NomeDaPagina.jsx` + `.module.css`, com `components/`, `routes/AppRoutes.jsx` e `services/api.js` (axios); no back, os pacotes são `auth`, `config`, `controller`, `dto`, `exceptions`, `model/entity`, `model/enums`, `model/repository`, `model/services` e `security`.

## Conteúdo pedagógico: somente fontes oficiais

| Item | Origem |
|---|---|
| 755 questões do ENEM 2017-2023 | INEP (itens obtidos pela API pública enem.dev) |
| 37 questões da FUVEST 2025 (1ª fase) | Caderno V1 e gabarito oficial publicados em fuvest.br |
| 37 questões da Unicamp 2025/2026 (1ª fase) | Cadernos Q e gabaritos oficiais da Comvest |
| 15 temas de redação | INEP (ENEM 2017-2024), FUVEST 2025/2026 e Unicamp 2024/2025, com a **abordagem esperada** publicada pelas bancas |
| Grades de correção | ENEM: 5 competências (Cartilha do Participante/INEP) · FUVEST: 4 quesitos de 1 a 4 com pesos 3-2-3-2 · Unicamp: Pt 0-2, G 0-3, Lt 0-3, CeC 1-4 (Diretrizes de Avaliação/Comvest) |
| 18 referências oficiais | Provas, gabaritos, matrizes, manuais e critérios (links para INEP, FUVEST e Comvest) |

Só entram no banco as questões 100% textuais: itens que dependem de figura, gráfico ou charge são descartados para não ficarem incompletos. As questões com figura podem ser praticadas no **Acervo ENEM**, que consulta a API externa. Os resumos da biblioteca são conteúdo interno, elaborado a partir das matrizes e programas oficiais e identificado separadamente das fontes oficiais.

## Como executar

### Pré-requisitos

- Microsoft SQL Server 2019 ou superior, com **TCP/IP habilitado** (porta 1433) e **autenticação SQL** (usuário `sa`)
- Java 21 (JDK)
- Node.js 20 ou superior

### 1. Banco de dados

No SQL Server Management Studio, abra e execute **em ordem**:

1. `database/01_aprovest_banco.sql` - cria o banco `aprovestdb` e as 31 tabelas
2. `database/02_taxonomia_e_questoes_oficiais.sql` - vestibulares, disciplinas, tópicos e 829 questões oficiais
3. `database/03_temas_e_materiais.sql` - temas de redação, fontes oficiais e resumos
4. `database/04_backup_diario.sql` - (opcional) job de backup diário com retenção de 30 dias

### 2. Back-end (API)

Copie `aprovest-api/src/main/resources/application-local.properties.example` para `application-local.properties` (esse arquivo não vai para o Git) e coloque nele a senha do seu SQL Server. Também é possível usar as variáveis `APROVEST_DB_USER` e `APROVEST_DB_PASSWORD`. Depois, no terminal:

```
cd aprovest-api
mvnw.cmd spring-boot:run
```

A API sobe em `http://localhost:8080/api/v1` (teste em `http://localhost:8080/api/v1/index`).

Na primeira execução são criadas as contas de teste `admin@aprovest.com.br`, `corretor@aprovest.com.br` e `aluno@aprovest.com.br`. A senha está em `app.seed.senha-padrao`. Também são criados 12 alunos de demonstração (`@demo.aprovest.com.br`) com simulados respondidos, para que o percentil e o ranking tenham com quem comparar.

**Correção por IA (opcional):** defina a variável de ambiente `ANTHROPIC_API_KEY` com sua chave da Anthropic antes de iniciar a API. Sem chave, o sistema usa o corretor automático offline (estimativa por regras), sempre identificado como tal.

**Login com Google (opcional):** defina `APROVEST_GOOGLE_CLIENT_ID` com um OAuth Client ID do tipo Web.

### 3. Front-end

```
cd aprovest-web
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Principais funcionalidades

- **Aluno:** meta (curso, universidade e até 3 vestibulares), diagnóstico de 30 questões, banca adaptativa diária (Elo/TRI) com repetição espaçada, simulados semanal e mensal cronometrados com nota projetada e percentil, caderno de redações com correção por IA e humana, biblioteca, fontes oficiais, acervo ENEM 2009-2023, plano de estudo, histórico, ranking com bolsa por mérito, relatório em PDF, plano Pro e créditos (checkout de demonstração), notificações, tema escuro, tamanho de fonte e LGPD (exportar e excluir dados).
- **Professor/Corretor:** fila de correções atribuídas, devolutiva pela grade oficial, parecer sobre questões e consulta de ganhos.
- **Administrador:** relatórios pedagógicos e financeiros (CSV), banco de questões (CRUD, importação em lote e arquivamento), materiais, temas, usuários e papéis, atribuição de correções, bolsas, controle e sugestões da IA, solicitações LGPD e comunicados.

## Segurança e LGPD

- Senhas com hash BCrypt; autenticação stateless com JWT revogável no logout.
- Rate limiting nos endpoints de autenticação e bloqueio de 15 minutos após 5 tentativas.
- Controle de acesso por papel no servidor (`/admin/**`, `/corretor/**`).
- O gabarito nunca é enviado ao navegador antes da resposta.
- Exportação de dados em JSON e anonimização da conta ao processar a exclusão.

## Aviso

Notas, projeções e percentis são estimativas internas para treino. Não são notas oficiais nem probabilidade de aprovação. Os pagamentos são simulados: nenhuma cobrança real é feita.
