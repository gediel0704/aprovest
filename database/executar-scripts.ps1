# =====================================================================
# AproVest - Executa os scripts do banco em ordem (alternativa ao SSMS/sqlcmd)
# Usa a autenticação do Windows. Uso:
#   powershell -ExecutionPolicy Bypass -File database\executar-scripts.ps1
# =====================================================================
param([string]$Servidor = "localhost", [switch]$ComBackup)
$ErrorActionPreference = "Stop"
$pasta = Split-Path -Parent $MyInvocation.MyCommand.Path
$scripts = @("01_aprovest_banco.sql", "02_taxonomia_e_questoes_oficiais.sql", "03_temas_e_materiais.sql")
if ($ComBackup) { $scripts += "04_backup_diario.sql" }

foreach ($arquivo in $scripts) {
    Write-Host "Executando $arquivo ..." -ForegroundColor Cyan
    $texto = [IO.File]::ReadAllText((Join-Path $pasta $arquivo), [Text.Encoding]::UTF8)
    $lotes = [regex]::Split($texto, "(?im)^\s*GO\s*$") | Where-Object { $_.Trim() -ne "" }
    $conexao = New-Object System.Data.SqlClient.SqlConnection "Server=$Servidor;Database=master;Integrated Security=True;"
    $conexao.Open()
    $n = 0
    foreach ($lote in $lotes) {
        $cmd = $conexao.CreateCommand()
        $cmd.CommandTimeout = 600
        $cmd.CommandText = $lote
        try { $cmd.ExecuteNonQuery() | Out-Null; $n++ }
        catch { Write-Host "Erro no lote $($n + 1) de ${arquivo}: $($_.Exception.InnerException.Message)" -ForegroundColor Red; throw }
    }
    $conexao.Close()
    Write-Host "  $n lotes executados" -ForegroundColor Green
}
Write-Host "Banco aprovestdb pronto." -ForegroundColor Green
