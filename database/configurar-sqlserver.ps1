# =====================================================================
# AproVest - Configuração do SQL Server local (execute como ADMINISTRADOR)
# 1) Habilita o protocolo TCP/IP na porta 1433
# 2) Ativa a autenticação "SQL Server e Windows" (modo misto)
# 3) Reinicia o serviço SQL Server (MSSQLSERVER)
# 4) Habilita o login "sa" com a senha que você digitar
# =====================================================================
$ErrorActionPreference = "Stop"

$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {
    Write-Host "Abra o PowerShell como Administrador (botão direito > Executar como administrador) e rode o script novamente." -ForegroundColor Red
    exit 1
}

$instancia = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQLServer"
if (-not (Test-Path $instancia)) {
    $instancia = (Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server" | Where-Object { $_.PSChildName -like "MSSQL*.MSSQLSERVER" } | Select-Object -First 1).PSPath + "\MSSQLServer"
}
Write-Host "Instância encontrada: $instancia" -ForegroundColor Cyan

# 1) TCP/IP na porta 1433
$tcp = "$instancia\SuperSocketNetLib\Tcp"
Set-ItemProperty -Path $tcp -Name Enabled -Value 1
Set-ItemProperty -Path "$tcp\IPAll" -Name TcpPort -Value "1433"
Set-ItemProperty -Path "$tcp\IPAll" -Name TcpDynamicPorts -Value ""
Write-Host "[1/4] TCP/IP habilitado na porta 1433" -ForegroundColor Green

# 2) Modo de autenticação misto (2 = SQL Server e Windows)
Set-ItemProperty -Path $instancia -Name LoginMode -Value 2
Write-Host "[2/4] Autenticação SQL Server e Windows ativada" -ForegroundColor Green

# 3) Reinicia o serviço
Restart-Service -Name MSSQLSERVER -Force
Start-Sleep -Seconds 5
Write-Host "[3/4] Serviço SQL Server reiniciado" -ForegroundColor Green

# 4) Habilita o login sa
$senhaSegura = Read-Host "Digite a senha para o usuário sa (sugestão do projeto: Aprovest@2026)" -AsSecureString
$senha = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senhaSegura))
if ($senha.Length -lt 8) { Write-Host "A senha precisa ter pelo menos 8 caracteres, com letras, números e símbolo." -ForegroundColor Red; exit 1 }

$conexao = New-Object System.Data.SqlClient.SqlConnection "Server=localhost;Database=master;Integrated Security=True;"
$conexao.Open()
$cmd = $conexao.CreateCommand()
$senhaSql = $senha.Replace("'", "''")
$cmd.CommandText = "ALTER LOGIN sa WITH PASSWORD = N'$senhaSql', CHECK_POLICY = OFF; ALTER LOGIN sa ENABLE;"
$cmd.ExecuteNonQuery() | Out-Null
$conexao.Close()
Write-Host "[4/4] Login 'sa' habilitado" -ForegroundColor Green

# Teste final pela porta 1433 com o usuário sa
$teste = New-Object System.Data.SqlClient.SqlConnection "Server=localhost,1433;Database=master;User Id=sa;Password=$senha;"
$teste.Open()
Write-Host "`nTudo pronto! Conexão com sa pela porta 1433 funcionando." -ForegroundColor Green
$teste.Close()
