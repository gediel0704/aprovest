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

(`npm run dev:all` faz exatamente o mesmo.)

O `npm run dev` prepara tudo sozinho, em qualquer computador com Windows:

1. **Java:** localiza o Java 21, mesmo que o terminal tenha sido aberto antes da instalação.
2. **SQL Server:** descobre as instâncias instaladas (padrão `MSSQLSERVER` ou nomeadas, como `SQLEXPRESS`), confere se o serviço está rodando e qual porta TCP cada uma usa.
3. **Login no banco, sem configurar nada:**
   - primeiro tenta a **autenticação do Windows** (o usuário logado), sem senha;
   - se ela não tiver acesso, tenta a senha do `sa` já salva;
   - só então pede a senha do `sa`, testando cada tentativa antes de subir a API.
   A escolha fica salva em `C:Users<usuário>.aprovestanco.json` e vale para qualquer cópia do projeto nesse computador, sem perguntar de novo.
4. **Banco:** se o `aprovestdb` não existir, a API o cria com os scripts da pasta `database`.
5. **Site:** sobe o site e abre `http://localhost:5173` quando a API já está lendo o banco.

A primeira execução demora alguns minutos, porque baixa as dependências do Java e cria o banco. Depois que o site abre, a API ainda cria em segundo plano 12 alunos de demonstração (para o ranking e o percentil); se o `npm run dev` for fechado antes, a criação continua de onde parou na próxima vez. Para encerrar, pressione **Ctrl+C**.

Contas de teste criadas automaticamente: `aluno@aprovest.com.br`, `corretor@aprovest.com.br` e `admin@aprovest.com.br` (senha padrão em `app.seed.senha-padrao`, no `application.properties`).

**Opcionais:** `ANTHROPIC_API_KEY` para a correção por IA com o Claude (sem chave, o sistema usa o corretor offline, sempre identificado como tal) e `APROVEST_GOOGLE_CLIENT_ID` para o login com Google.

**Se o `npm run dev` parar com uma mensagem**

| Mensagem | O que fazer |
|---|---|
| Java 21 não encontrado | Instale com `winget install Microsoft.OpenJDK.21`. |
| Nenhum SQL Server foi encontrado | Instale o SQL Server 2019 ou superior (Developer ou Express). |
| O serviço está parado | Inicie o serviço do SQL Server (Serviços do Windows ou SQL Server Configuration Manager). |
| TCP/IP desligado | A API Java só conecta por TCP. Como administrador: `powershell -ExecutionPolicy Bypass -File database\configurar-sqlserver.ps1 -Instancia NOME` (o nome aparece na mensagem). Esse script também ativa o login misto e, se você quiser, o `sa`. |
| Não foi possível entrar no SQL Server | O usuário do Windows não tem acesso e a senha do `sa` não foi aceita. Use a senha do `sa` desse computador ou peça a quem administra o SQL Server para liberar o seu usuário. |
| O banco não existe e o login não pode criá-lo | Execute no SSMS os scripts `database/01`, `02` e `03`, nessa ordem, com um login administrador. |
| Porta 8080 ou 5173 ocupada | Feche o outro programa ou o outro terminal com o projeto rodando. |
| Tudo muito lento | Não deixe o projeto dentro do OneDrive (ou de outra pasta sincronizada): o `npm install` e o Maven criam milhares de arquivos que o OneDrive tenta enviar para a nuvem, sobrecarregando o computador. Prefira uma pasta como `C:\Projetos\aprovest`. |

Para refazer a detecção do banco do zero, apague o arquivo `C:Users<usuário>.aprovestanco.json`.

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
