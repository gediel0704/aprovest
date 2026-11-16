-- =====================================================================
-- AproVest - Script de criação do banco de dados (Microsoft SQL Server)
-- Projeto de TCC - Técnico em Informática (INF2CM) - FIEB / ITB Brasílio Flores de Azevedo
-- Execute este arquivo inteiro no SQL Server Management Studio (SSMS)
-- ou pelo terminal:  sqlcmd -S localhost -E -C -i 01_aprovest_banco.sql
-- Depois execute 02_dados_base.sql e 03_questoes_oficiais.sql.
-- =====================================================================

USE master;
GO

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'aprovestdb')
BEGIN
    ALTER DATABASE aprovestdb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE aprovestdb;
END
GO

CREATE DATABASE aprovestdb COLLATE Latin1_General_100_CI_AI_SC_UTF8;
GO

USE aprovestdb;
GO

-- ---------------------------------------------------------------------
-- 1. USUÁRIOS, AUTENTICAÇÃO E PERFIL  (RF01, RF09, RF14, RNF02, RNF07)
-- Herança em tabela única (SINGLE_TABLE), como no modelo da pizzaria:
-- a coluna tipo_usuario diferencia ALUNO, CORRETOR e ADMIN.
-- ---------------------------------------------------------------------
CREATE TABLE Usuario (
    id                    BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    nome                  VARCHAR(100)  NOT NULL,
    email                 VARCHAR(120)  NOT NULL,
    password              VARCHAR(250)  NOT NULL,              -- hash BCrypt (RNF02)
    tipo_usuario          VARCHAR(30)   NOT NULL,              -- ALUNO | CORRETOR | ADMIN
    data_nascimento       DATE          NULL,
    curso_alvo            VARCHAR(120)  NULL,
    universidade_alvo     VARCHAR(120)  NULL,
    vestibulares_alvo     VARCHAR(60)   NULL,                  -- ex.: "ENEM,FUVEST"
    google_id             VARCHAR(100)  NULL,
    tema                  VARCHAR(10)   NOT NULL DEFAULT 'claro',   -- RF16 / RNF14
    tamanho_fonte         VARCHAR(10)   NOT NULL DEFAULT 'normal',  -- RNF14
    notif_banca           BIT           NOT NULL DEFAULT 1,     -- RF13 / RF14
    notif_redacao         BIT           NOT NULL DEFAULT 1,
    notif_simulado        BIT           NOT NULL DEFAULT 1,
    notif_novidades       BIT           NOT NULL DEFAULT 1,
    ranking_publico       BIT           NOT NULL DEFAULT 1,     -- consentimento para o ranking (RF12/LGPD)
    onboarding_concluido  BIT           NOT NULL DEFAULT 0,
    tentativas_falhas     INT           NOT NULL DEFAULT 0,     -- RNF07 bloqueio temporário
    bloqueado_ate         DATETIME2     NULL,
    formacao              VARCHAR(150)  NULL,                   -- somente CORRETOR
    nivel_acesso          VARCHAR(20)   NULL,                   -- somente ADMIN
    criado_em             DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    cod_status            BIT           NOT NULL DEFAULT 1,
    CONSTRAINT uk_usuario_email UNIQUE (email),
    CONSTRAINT ck_usuario_tipo CHECK (tipo_usuario IN ('ALUNO','CORRETOR','ADMIN'))
);

-- Tokens JWT emitidos (mesmo padrão do projeto modelo)
CREATE TABLE tokens (
    id          BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    token       VARCHAR(600)  NOT NULL,
    token_type  VARCHAR(20)   NOT NULL DEFAULT 'BEARER',
    revoked     BIT           NOT NULL DEFAULT 0,
    expired     BIT           NOT NULL DEFAULT 0,
    usuario_id  BIGINT        NULL,
    CONSTRAINT fk_tokens_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE
);
CREATE INDEX ix_tokens_token ON tokens (token);

-- Recuperação de senha (UC004)
CREATE TABLE TokenRecuperacao (
    id          BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    token       VARCHAR(80)   NOT NULL,
    expira_em   DATETIME2     NOT NULL,
    usado       BIT           NOT NULL DEFAULT 0,
    usuario_id  BIGINT        NOT NULL,
    CONSTRAINT fk_tokenrec_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 2. CATÁLOGO: VESTIBULARES, DISCIPLINAS E TÓPICOS  (RN04)
-- ---------------------------------------------------------------------
CREATE TABLE Vestibular (
    id            BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    sigla         VARCHAR(20)   NOT NULL,
    nome          VARCHAR(150)  NOT NULL,
    organizadora  VARCHAR(150)  NOT NULL,
    site_oficial  VARCHAR(255)  NOT NULL,
    descricao     VARCHAR(600)  NULL,
    cod_status    BIT           NOT NULL DEFAULT 1,
    CONSTRAINT uk_vestibular_sigla UNIQUE (sigla)
);

CREATE TABLE Disciplina (
    id          BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    nome        VARCHAR(80)   NOT NULL,
    area        VARCHAR(80)   NOT NULL,     -- área do conhecimento (ENEM)
    cod_status  BIT           NOT NULL DEFAULT 1,
    CONSTRAINT uk_disciplina_nome UNIQUE (nome)
);

CREATE TABLE Topico (
    id             BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    nome           VARCHAR(120)  NOT NULL,
    disciplina_id  BIGINT        NOT NULL,
    cod_status     BIT           NOT NULL DEFAULT 1,
    CONSTRAINT fk_topico_disciplina_id FOREIGN KEY (disciplina_id) REFERENCES Disciplina (id),
    CONSTRAINT uk_topico UNIQUE (disciplina_id, nome)
);

-- ---------------------------------------------------------------------
-- 3. BANCO DE QUESTÕES  (RF08, RN03, RN04, UC030, UC031, UC032, UC041)
-- ---------------------------------------------------------------------
CREATE TABLE Questao (
    id                        BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    enunciado                 NVARCHAR(MAX)  NOT NULL,
    introducao_alternativas   NVARCHAR(MAX)  NULL,
    gabarito                  CHAR(1)        NOT NULL,
    explicacao                NVARCHAR(MAX)  NULL,
    dificuldade               DECIMAL(7,2)   NOT NULL DEFAULT 1000,   -- rating Elo do item (calibrado pelo uso)
    nivel                     VARCHAR(10)    NOT NULL DEFAULT 'MEDIO', -- FACIL | MEDIO | DIFICIL
    ano                       INT            NULL,
    numero                    INT            NULL,                      -- número da questão na prova oficial
    origem                    VARCHAR(20)    NOT NULL DEFAULT 'OFICIAL', -- OFICIAL | AUTORAL
    fonte_descricao           VARCHAR(255)   NOT NULL,
    fonte_url                 VARCHAR(400)   NULL,
    total_respostas           INT            NOT NULL DEFAULT 0,
    total_acertos             INT            NOT NULL DEFAULT 0,
    vestibular_id             BIGINT         NOT NULL,
    disciplina_id             BIGINT         NOT NULL,
    criado_em                 DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    cod_status                BIT            NOT NULL DEFAULT 1,       -- 1 = publicada, 0 = arquivada (UC032)
    CONSTRAINT fk_questao_vestibular_id FOREIGN KEY (vestibular_id) REFERENCES Vestibular (id),
    CONSTRAINT fk_questao_disciplina_id FOREIGN KEY (disciplina_id) REFERENCES Disciplina (id),
    CONSTRAINT ck_questao_gabarito CHECK (gabarito IN ('A','B','C','D','E'))
);
CREATE INDEX ix_questao_vest_disc ON Questao (vestibular_id, disciplina_id, cod_status);

CREATE TABLE Alternativa (
    id          BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    letra       CHAR(1)        NOT NULL,
    texto       NVARCHAR(MAX)  NOT NULL,
    questao_id  BIGINT         NOT NULL,
    CONSTRAINT fk_alternativa_questao_id FOREIGN KEY (questao_id) REFERENCES Questao (id) ON DELETE CASCADE,
    CONSTRAINT uk_alternativa UNIQUE (questao_id, letra)
);

-- RN04: toda questão pertence a no mínimo um tópico
CREATE TABLE QuestaoTopico (
    questao_id  BIGINT  NOT NULL,
    topico_id   BIGINT  NOT NULL,
    CONSTRAINT pk_questaotopico PRIMARY KEY (questao_id, topico_id),
    CONSTRAINT fk_qt_questao_id FOREIGN KEY (questao_id) REFERENCES Questao (id) ON DELETE CASCADE,
    CONSTRAINT fk_qt_topico_id  FOREIGN KEY (topico_id)  REFERENCES Topico (id)
);

-- ---------------------------------------------------------------------
-- 4. SESSÕES DE ESTUDO: DIAGNÓSTICO, BANCA DIÁRIA E SIMULADO
--    (RF02, RF03, RF06, RF15, RF17, UC011, UC012, UC013)
-- ---------------------------------------------------------------------
CREATE TABLE SessaoEstudo (
    id               BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    modo             VARCHAR(20)   NOT NULL,     -- DIAGNOSTICO | BANCA | SIMULADO
    tipo_simulado    VARCHAR(20)   NULL,         -- SEMANAL | MENSAL
    status           VARCHAR(20)   NOT NULL DEFAULT 'EM_ANDAMENTO', -- EM_ANDAMENTO | CONCLUIDA | EXPIRADA
    total_questoes   INT           NOT NULL,
    acertos          INT           NOT NULL DEFAULT 0,
    nota_estimada    DECIMAL(7,2)  NULL,         -- projeção na escala do vestibular
    percentil        DECIMAL(5,2)  NULL,
    comparaveis      INT           NULL,         -- nº de alunos usados no percentil
    iniciada_em      DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    expira_em        DATETIME2     NULL,
    concluida_em     DATETIME2     NULL,
    usuario_id       BIGINT        NOT NULL,
    vestibular_id    BIGINT        NOT NULL,
    CONSTRAINT fk_sessao_usuario_id    FOREIGN KEY (usuario_id)    REFERENCES Usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_sessao_vestibular_id FOREIGN KEY (vestibular_id) REFERENCES Vestibular (id),
    CONSTRAINT ck_sessao_modo CHECK (modo IN ('DIAGNOSTICO','BANCA','SIMULADO'))
);
CREATE INDEX ix_sessao_usuario ON SessaoEstudo (usuario_id, modo, iniciada_em);

CREATE TABLE SessaoQuestao (
    id          BIGINT  NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ordem       INT     NOT NULL,
    sessao_id   BIGINT  NOT NULL,
    questao_id  BIGINT  NOT NULL,
    CONSTRAINT fk_sq_sessao_id  FOREIGN KEY (sessao_id)  REFERENCES SessaoEstudo (id) ON DELETE CASCADE,
    CONSTRAINT fk_sq_questao_id FOREIGN KEY (questao_id) REFERENCES Questao (id),
    CONSTRAINT uk_sessaoquestao UNIQUE (sessao_id, questao_id)
);

CREATE TABLE Resposta (
    id                   BIGINT     NOT NULL IDENTITY(1,1) PRIMARY KEY,
    alternativa_marcada  CHAR(1)    NOT NULL,
    correta              BIT        NOT NULL,
    tempo_segundos       INT        NULL,
    respondida_em        DATETIME2  NOT NULL DEFAULT SYSDATETIME(),
    sessao_id            BIGINT     NOT NULL,
    questao_id           BIGINT     NOT NULL,
    usuario_id           BIGINT     NOT NULL,
    CONSTRAINT fk_resposta_sessao_id  FOREIGN KEY (sessao_id)  REFERENCES SessaoEstudo (id) ON DELETE CASCADE,
    CONSTRAINT fk_resposta_questao_id FOREIGN KEY (questao_id) REFERENCES Questao (id),
    CONSTRAINT fk_resposta_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id),
    CONSTRAINT uk_resposta UNIQUE (sessao_id, questao_id)
);
CREATE INDEX ix_resposta_usuario ON Resposta (usuario_id, respondida_em);

-- Proficiência do aluno por tópico (algoritmo Elo / TRI simplificado)
CREATE TABLE Proficiencia (
    id             BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    rating         DECIMAL(7,2)  NOT NULL DEFAULT 1000,
    acertos        INT           NOT NULL DEFAULT 0,
    tentativas     INT           NOT NULL DEFAULT 0,
    atualizado_em  DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    usuario_id     BIGINT        NOT NULL,
    topico_id      BIGINT        NOT NULL,
    CONSTRAINT fk_prof_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_prof_topico_id  FOREIGN KEY (topico_id)  REFERENCES Topico (id),
    CONSTRAINT uk_proficiencia UNIQUE (usuario_id, topico_id)
);

-- Repetição espaçada (RF17) - algoritmo SM-2 simplificado
CREATE TABLE Revisao (
    id               BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    intervalo_dias   INT           NOT NULL DEFAULT 1,
    repeticoes       INT           NOT NULL DEFAULT 0,
    facilidade       DECIMAL(4,2)  NOT NULL DEFAULT 2.50,
    proxima_revisao  DATE          NOT NULL,
    usuario_id       BIGINT        NOT NULL,
    questao_id       BIGINT        NOT NULL,
    CONSTRAINT fk_revisao_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_revisao_questao_id FOREIGN KEY (questao_id) REFERENCES Questao (id),
    CONSTRAINT uk_revisao UNIQUE (usuario_id, questao_id)
);

-- ---------------------------------------------------------------------
-- 5. REDAÇÃO E CORREÇÃO (IA + HUMANA)  (RF04, RF05, UC020-UC028, UC034)
-- ---------------------------------------------------------------------
CREATE TABLE TemaRedacao (
    id               BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    titulo           VARCHAR(200)   NOT NULL,
    proposta         NVARCHAR(MAX)  NOT NULL,
    textos_apoio     NVARCHAR(MAX)  NULL,
    expectativa_banca NVARCHAR(MAX) NULL,                     -- abordagem esperada publicada pela banca oficial
    genero           VARCHAR(80)    NOT NULL DEFAULT 'Dissertativo-argumentativo',
    ano              INT            NULL,
    origem           VARCHAR(20)    NOT NULL DEFAULT 'OFICIAL',  -- OFICIAL | AUTORAL | SUGERIDO_IA
    fonte_descricao  VARCHAR(255)   NULL,
    fonte_url        VARCHAR(400)   NULL,
    vestibular_id    BIGINT         NOT NULL,
    cod_status       BIT            NOT NULL DEFAULT 1,
    CONSTRAINT fk_tema_vestibular_id FOREIGN KEY (vestibular_id) REFERENCES Vestibular (id)
);

CREATE TABLE Redacao (
    id               BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    titulo           VARCHAR(120)   NOT NULL,
    tema             VARCHAR(180)   NOT NULL,
    texto            NVARCHAR(MAX)  NOT NULL,
    status           VARCHAR(20)    NOT NULL DEFAULT 'RASCUNHO',  -- RASCUNHO | FINALIZADA
    criado_em        DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    atualizado_em    DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    usuario_id       BIGINT         NOT NULL,
    vestibular_id    BIGINT         NOT NULL,
    tema_redacao_id  BIGINT         NULL,
    CONSTRAINT fk_redacao_usuario_id    FOREIGN KEY (usuario_id)      REFERENCES Usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_redacao_vestibular_id FOREIGN KEY (vestibular_id)   REFERENCES Vestibular (id),
    CONSTRAINT fk_redacao_tema_id       FOREIGN KEY (tema_redacao_id) REFERENCES TemaRedacao (id)
);

-- Cada correção guarda uma CÓPIA (snapshot) do texto enviado (UC022/UC026)
CREATE TABLE AvaliacaoRedacao (
    id               BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    tipo             VARCHAR(10)    NOT NULL,                 -- IA | HUMANA
    status           VARCHAR(20)    NOT NULL,                 -- PROCESSANDO | PENDENTE | ATRIBUIDA | CONCLUIDA | ERRO
    titulo_snapshot  VARCHAR(120)   NOT NULL,
    tema_snapshot    VARCHAR(180)   NOT NULL,
    texto_snapshot   NVARCHAR(MAX)  NOT NULL,
    nota_total       DECIMAL(7,2)   NULL,
    nota_maxima      DECIMAL(7,2)   NULL,
    feedback_geral   NVARCHAR(MAX)  NULL,
    modelo_ia        VARCHAR(60)    NULL,                      -- modelo utilizado ou "corretor-offline"
    prazo            DATETIME2      NULL,                      -- 72h para correção humana (RF05)
    solicitada_em    DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    concluida_em     DATETIME2      NULL,
    redacao_id       BIGINT         NULL,                      -- vira NULL se o texto original for excluído
    usuario_id       BIGINT         NOT NULL,
    vestibular_id    BIGINT         NOT NULL,
    corretor_id      BIGINT         NULL,
    CONSTRAINT fk_aval_redacao_id    FOREIGN KEY (redacao_id)    REFERENCES Redacao (id) ON DELETE SET NULL,
    CONSTRAINT fk_aval_usuario_id    FOREIGN KEY (usuario_id)    REFERENCES Usuario (id),
    CONSTRAINT fk_aval_vestibular_id FOREIGN KEY (vestibular_id) REFERENCES Vestibular (id),
    CONSTRAINT fk_aval_corretor_id   FOREIGN KEY (corretor_id)   REFERENCES Usuario (id),
    CONSTRAINT ck_aval_tipo CHECK (tipo IN ('IA','HUMANA'))
);

-- Nota por critério/competência oficial (ENEM C1..C5, FUVEST Q1..Q4, UNICAMP Pt/G/Lt/CeC)
CREATE TABLE NotaCriterio (
    id            BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    codigo        VARCHAR(10)    NOT NULL,
    nome          VARCHAR(200)   NOT NULL,
    nota          DECIMAL(7,2)   NOT NULL,
    nota_maxima   DECIMAL(7,2)   NOT NULL,
    peso          DECIMAL(4,2)   NOT NULL DEFAULT 1,
    comentario    NVARCHAR(MAX)  NULL,
    avaliacao_id  BIGINT         NOT NULL,
    CONSTRAINT fk_nota_avaliacao_id FOREIGN KEY (avaliacao_id) REFERENCES AvaliacaoRedacao (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 6. MONETIZAÇÃO: PLANO PRO, CRÉDITOS E PAGAMENTOS  (RF10, RF11, RN02)
-- ---------------------------------------------------------------------
CREATE TABLE Assinatura (
    id                     BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    plano                  VARCHAR(10)   NOT NULL DEFAULT 'FREE',     -- FREE | PRO
    status                 VARCHAR(20)   NOT NULL DEFAULT 'ATIVA',    -- ATIVA | CANCELADA | EXPIRADA
    origem                 VARCHAR(20)   NULL,                         -- PAGAMENTO | BOLSA | CORTESIA
    inicio                 DATETIME2     NULL,
    fim                    DATETIME2     NULL,
    renovacao_automatica   BIT           NOT NULL DEFAULT 0,
    usuario_id             BIGINT        NOT NULL,
    CONSTRAINT fk_assinatura_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE,
    CONSTRAINT uk_assinatura_usuario UNIQUE (usuario_id)
);

CREATE TABLE CarteiraCredito (
    id          BIGINT  NOT NULL IDENTITY(1,1) PRIMARY KEY,
    saldo       INT     NOT NULL DEFAULT 0,
    usuario_id  BIGINT  NOT NULL,
    CONSTRAINT fk_carteira_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE,
    CONSTRAINT uk_carteira_usuario UNIQUE (usuario_id),
    CONSTRAINT ck_carteira_saldo CHECK (saldo >= 0)
);

CREATE TABLE MovimentoCredito (
    id          BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    quantidade  INT           NOT NULL,          -- positivo = entrada, negativo = consumo
    motivo      VARCHAR(150)  NOT NULL,
    criado_em   DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    usuario_id  BIGINT        NOT NULL,
    CONSTRAINT fk_movcred_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE
);

-- Pagamentos do checkout de demonstração (nenhuma cobrança real é feita)
CREATE TABLE Pagamento (
    id                BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    tipo              VARCHAR(30)    NOT NULL,   -- ASSINATURA_PRO | PACOTE_CREDITOS
    descricao         VARCHAR(150)   NOT NULL,
    valor             DECIMAL(10,2)  NOT NULL,
    metodo            VARCHAR(20)    NOT NULL,   -- PIX | CARTAO | BOLETO
    status            VARCHAR(20)    NOT NULL,   -- APROVADO | RECUSADO
    codigo_transacao  VARCHAR(40)    NOT NULL,
    criado_em         DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    usuario_id        BIGINT         NOT NULL,
    CONSTRAINT fk_pagamento_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 7. NOTIFICAÇÕES  (RF13, UC007)
-- ---------------------------------------------------------------------
CREATE TABLE Notificacao (
    id          BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    titulo      VARCHAR(150)   NOT NULL,
    mensagem    NVARCHAR(600)  NOT NULL,
    tipo        VARCHAR(20)    NOT NULL,     -- BANCA | REDACAO | SIMULADO | NOVIDADE | SISTEMA
    link        VARCHAR(200)   NULL,
    lida        BIT            NOT NULL DEFAULT 0,
    criado_em   DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    usuario_id  BIGINT         NOT NULL,
    CONSTRAINT fk_notificacao_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE
);
CREATE INDEX ix_notificacao_usuario ON Notificacao (usuario_id, lida);

-- ---------------------------------------------------------------------
-- 8. BIBLIOTECA E FONTES OFICIAIS  (UC014, UC015, UC016)
-- ---------------------------------------------------------------------
CREATE TABLE Material (
    id               BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    titulo           VARCHAR(200)   NOT NULL,
    resumo           VARCHAR(600)   NOT NULL,
    conteudo         NVARCHAR(MAX)  NULL,          -- texto de estudo (conteúdo interno)
    tipo             VARCHAR(20)    NOT NULL,      -- RESUMO | PROVA | GABARITO | MATRIZ | EDITAL | GUIA_REDACAO | MATERIAL_OFICIAL
    oficial          BIT            NOT NULL,      -- 1 = documento de órgão oficial (link externo)
    fonte_orgao      VARCHAR(150)   NOT NULL,
    fonte_url        VARCHAR(400)   NULL,
    ano              INT            NULL,
    vestibular_id    BIGINT         NULL,
    disciplina_id    BIGINT         NULL,
    criado_em        DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    cod_status       BIT            NOT NULL DEFAULT 1,
    CONSTRAINT fk_material_vestibular_id FOREIGN KEY (vestibular_id) REFERENCES Vestibular (id),
    CONSTRAINT fk_material_disciplina_id FOREIGN KEY (disciplina_id) REFERENCES Disciplina (id)
);

CREATE TABLE LeituraMaterial (
    id             BIGINT     NOT NULL IDENTITY(1,1) PRIMARY KEY,
    concluido      BIT        NOT NULL DEFAULT 0,
    atualizado_em  DATETIME2  NOT NULL DEFAULT SYSDATETIME(),
    usuario_id     BIGINT     NOT NULL,
    material_id    BIGINT     NOT NULL,
    CONSTRAINT fk_leitura_usuario_id  FOREIGN KEY (usuario_id)  REFERENCES Usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_leitura_material_id FOREIGN KEY (material_id) REFERENCES Material (id) ON DELETE CASCADE,
    CONSTRAINT uk_leitura UNIQUE (usuario_id, material_id)
);

-- ---------------------------------------------------------------------
-- 9. RANKING E BOLSA POR MÉRITO  (RF12, UC036)
-- ---------------------------------------------------------------------
CREATE TABLE BolsaMerito (
    id              BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    mes_referencia  CHAR(7)       NOT NULL,       -- AAAA-MM
    posicao         INT           NOT NULL,
    pontuacao       DECIMAL(9,2)  NOT NULL,
    concedida_em    DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    usuario_id      BIGINT        NOT NULL,
    CONSTRAINT fk_bolsa_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE,
    CONSTRAINT uk_bolsa UNIQUE (usuario_id, mes_referencia)
);

-- ---------------------------------------------------------------------
-- 10. LGPD  (RN05, RNF03, UC008, UC009)
-- ---------------------------------------------------------------------
CREATE TABLE SolicitacaoLgpd (
    id            BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    tipo          VARCHAR(20)   NOT NULL,   -- EXPORTACAO | EXCLUSAO
    status        VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE',  -- PENDENTE | CONCLUIDA | CANCELADA
    observacao    VARCHAR(300)  NULL,
    criado_em     DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    concluido_em  DATETIME2     NULL,
    usuario_id    BIGINT        NULL,
    CONSTRAINT fk_lgpd_usuario_id FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- 11. ÁREA DOCENTE E OPERAÇÃO  (UC029, UC040, UC042, RF18)
-- ---------------------------------------------------------------------
CREATE TABLE ParecerConteudo (
    id                BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    veredito          VARCHAR(20)    NOT NULL,       -- APROVADO | AJUSTAR | REPROVADO
    comentario        NVARCHAR(1000) NOT NULL,
    questao_snapshot  NVARCHAR(MAX)  NOT NULL,
    criado_em         DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    questao_id        BIGINT         NOT NULL,
    corretor_id       BIGINT         NOT NULL,
    CONSTRAINT fk_parecer_questao_id  FOREIGN KEY (questao_id)  REFERENCES Questao (id) ON DELETE CASCADE,
    CONSTRAINT fk_parecer_corretor_id FOREIGN KEY (corretor_id) REFERENCES Usuario (id)
);

CREATE TABLE RemuneracaoCorretor (
    id            BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    valor         DECIMAL(10,2)  NOT NULL,
    status        VARCHAR(20)    NOT NULL DEFAULT 'REGISTRADO',  -- REGISTRADO | PAGO
    criado_em     DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    avaliacao_id  BIGINT         NOT NULL,
    corretor_id   BIGINT         NOT NULL,
    CONSTRAINT fk_remun_avaliacao_id FOREIGN KEY (avaliacao_id) REFERENCES AvaliacaoRedacao (id),
    CONSTRAINT fk_remun_corretor_id  FOREIGN KEY (corretor_id)  REFERENCES Usuario (id),
    CONSTRAINT uk_remun_avaliacao UNIQUE (avaliacao_id)
);

CREATE TABLE EstadoIA (
    id              BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    pausado         BIT           NOT NULL DEFAULT 0,
    motivo          VARCHAR(300)  NULL,
    atualizado_em   DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    atualizado_por  VARCHAR(120)  NULL
);
GO

PRINT 'Banco aprovestdb criado com sucesso. Execute agora 02_dados_base.sql';
GO
