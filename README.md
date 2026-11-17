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
├── scripts/           iniciar.mjs: usado pelo "npm run dev" para subir banco, API e site juntos
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

### Jeito rápido (recomendado)

Na pasta do projeto (ou dentro de `aprovest-web`), rode:

```
npm install
npm run dev
```

O `npm run dev` faz tudo sozinho:

1. localiza o Java 21, mesmo que o terminal tenha sido aberto antes da instalação;
2. confere se o SQL Server está respondendo na porta 1433;
3. na primeira vez, pede a senha do usuário `sa` e grava em `aprovest-api/src/main/resources/application-local.properties` (arquivo fora do Git);
4. sobe a API; se o banco `aprovestdb` não existir, a API o cria com os scripts da pasta `database`;
5. sobe o site e abre `http://localhost:5173` no navegador quando tudo estiver pronto.

A primeira execução demora alguns minutos, porque baixa as dependências do Java e cria o banco. Para encerrar, pressione **Ctrl+C**.

Contas de teste criadas automaticamente: `aluno@aprovest.com.br`, `corretor@aprovest.com.br`, `admin@aprovest.com.br` e a aluna de demonstração `mariana.souza@demo.aprovest.com.br`. A senha padrão está em `app.seed.senha-padrao` (no `application.properties`).

**Opcionais:** defina `ANTHROPIC_API_KEY` para a correção por IA com o Claude (sem chave, o sistema usa o corretor offline, sempre identificado como tal) e `APROVEST_GOOGLE_CLIENT_ID` para o login com Google.

**Problemas comuns**

- **Java 21 não encontrado:** instale com `winget install Microsoft.OpenJDK.21`.
- **SQL Server não respondeu na porta 1433:** inicie o serviço do SQL Server e habilite o TCP/IP e a autenticação SQL (o script `database/configurar-sqlserver.ps1`, executado como administrador, faz isso).
- **Login failed for user sa:** a senha está errada. Apague o arquivo `application-local.properties` e rode `npm run dev` de novo para digitá-la outra vez.
- **Porta 8080 ou 5173 ocupada:** feche o outro programa que está usando a porta (ou o outro terminal com o projeto rodando).

### Jeito manual (cada parte separada)

1. **Banco:** execute no SQL Server Management Studio, em ordem, `database/01_aprovest_banco.sql`, `02_taxonomia_e_questoes_oficiais.sql` e `03_temas_e_materiais.sql` (`04_backup_diario.sql` é opcional). Esse passo é dispensável, porque a API cria o banco sozinha.
2. **API:** copie `application-local.properties.example` para `application-local.properties` e coloque a senha do SQL Server. Depois, no PowerShell: `cd aprovest-api` e `.\mvnw.cmd spring-boot:run` (no cmd: `mvnw.cmd spring-boot:run`; no Git Bash: `./mvnw spring-boot:run`). Ela sobe em `http://localhost:8080/api/v1`.
3. **Site:** `cd aprovest-web` e `npm run dev:web`. Ele sobe em `http://localhost:5173`.

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
