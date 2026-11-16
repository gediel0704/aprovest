-- =====================================================================
-- AproVest - RNF08: backup diário automatizado com retenção de 30 dias
-- Requer o serviço SQL Server Agent em execução (edições Developer/Standard).
-- Ajuste @pasta para um diretório existente no servidor.
-- =====================================================================
USE msdb;
GO

DECLARE @pasta NVARCHAR(260) = N'C:\Backups\AproVest\';

IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'AproVest - Backup diario')
    EXEC msdb.dbo.sp_delete_job @job_name = N'AproVest - Backup diario';

EXEC msdb.dbo.sp_add_job @job_name = N'AproVest - Backup diario', @enabled = 1,
     @description = N'Backup completo diário do aprovestdb com retenção de 30 dias (RNF08).';

DECLARE @comando NVARCHAR(MAX) = N'
DECLARE @arquivo NVARCHAR(400) = N''' + @pasta + N'aprovestdb_'' + FORMAT(GETDATE(), ''yyyyMMdd_HHmm'') + N''.bak'';
BACKUP DATABASE aprovestdb TO DISK = @arquivo WITH INIT, COMPRESSION, CHECKSUM;
-- remove arquivos .bak com mais de 30 dias
DECLARE @limite DATETIME = DATEADD(DAY, -30, GETDATE());
EXEC master.dbo.xp_delete_file 0, N''' + @pasta + N''', N''bak'', @limite, 0;';

EXEC msdb.dbo.sp_add_jobstep @job_name = N'AproVest - Backup diario', @step_name = N'Backup completo',
     @subsystem = N'TSQL', @database_name = N'master', @command = @comando;

EXEC msdb.dbo.sp_add_schedule @schedule_name = N'AproVest - todo dia 02h', @freq_type = 4, @freq_interval = 1,
     @active_start_time = 020000;
EXEC msdb.dbo.sp_attach_schedule @job_name = N'AproVest - Backup diario', @schedule_name = N'AproVest - todo dia 02h';
EXEC msdb.dbo.sp_add_jobserver @job_name = N'AproVest - Backup diario';
GO

PRINT 'Job de backup diário criado (02h, retenção de 30 dias).';
GO
