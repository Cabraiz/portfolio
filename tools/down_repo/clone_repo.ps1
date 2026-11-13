param(
    # Não deixe nome de empresa hardcoded aqui.
    # Se vier vazio, o script pergunta em tempo de execução.
    [string]$Organization = "",
    [string]$Project      = "",

    # Destino neutro.
    [string]$DestRoot     = "$env:USERPROFILE\Documents\GitHub\AzureRepos",

    # Retomada manual a partir de um repo específico.
    [string]$StartFromName = "",

    # Só clona o que falta; não atualiza repositórios já existentes.
    [switch]$CloneOnlyMissing,

    # Ignora clone-state.json nesta execução.
    [switch]$NoResume,

    # Apaga estado anterior e começa do começo.
    [switch]$ResetState,

    # Timeout por comando Git.
    [int]$GitTimeoutSeconds = 300,

    # Tentativas extras para erro transitório.
    [int]$MaxRetries = 2
)

$ErrorActionPreference = "Stop"

# Mata prompts interativos do Git/Git Credential Manager.
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "Never"
$env:GIT_ASKPASS = "echo"

# Funcoes em arquivos irmaos.
. "$PSScriptRoot\clone_repo.helpers.ps1"
. "$PSScriptRoot\clone_repo.git.ps1"

# Entrada sem nome de empresa no arquivo.
if ([string]::IsNullOrWhiteSpace($Organization)) {
    $Organization = Read-Host "Cole o nome da Organization do Azure DevOps"
}

if ([string]::IsNullOrWhiteSpace($Project)) {
    $Project = Read-Host "Cole o nome do Project do Azure DevOps"
}

if ([string]::IsNullOrWhiteSpace($Organization) -or [string]::IsNullOrWhiteSpace($Project)) {
    Write-Bad "Organization e Project são obrigatórios."
    exit 1
}

# Checa Git.
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Bad "Git não encontrado no PATH."
    Write-Host "Instale o Git primeiro ou abra um terminal onde o comando git funcione."
    exit 1
}

# Checa/cria destino.
try {
    New-Item -ItemType Directory -Force -Path $DestRoot | Out-Null

    $testFile = Join-Path $DestRoot ".write-test-$([Guid]::NewGuid().ToString('N')).tmp"
    "ok" | Set-Content -Path $testFile -Encoding UTF8
    Remove-Item $testFile -Force
}
catch {
    Write-Bad "Não consegui gravar em: $DestRoot"
    Write-Host ""
    Write-Host "Isso parece bloqueio/permissão local, não necessariamente problema do Azure DevOps."
    Write-Host "Erro:"
    Write-Host $_.Exception.Message
    exit 1
}

$logDir = Join-Path $DestRoot "_clone_logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$stateFile = Join-Path $logDir "clone-state.json"
$contextHash = Get-ContextHash -Organization $Organization -Project $Project -DestRoot $DestRoot

if ($ResetState -and (Test-Path $stateFile)) {
    Remove-Item $stateFile -Force
    Write-Warn2 "Estado anterior apagado."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $logDir "clone-log-$stamp.txt"
$failCsv = Join-Path $logDir "clone-failures-$stamp.csv"
$catalogCsv = Join-Path $logDir "repos-catalog-$stamp.csv"
$accessibleCsv = Join-Path $logDir "repos-accessible-$stamp.csv"
$disabledCsv = Join-Path $logDir "repos-disabled-$stamp.csv"

"repo,status,kind,target,message" | Set-Content -Path $failCsv -Encoding UTF8

Write-Info "Destino: $DestRoot"
Write-Info "Logs: $logDir"
Write-Info "Estado: $stateFile"
Write-Host ""

$state = $null

if ((-not $NoResume) -and (Test-Path $stateFile)) {
    try {
        $state = Get-Content $stateFile -Raw | ConvertFrom-Json
        $state = Repair-StateObject -State $state -ContextHash $contextHash

        if ($state.ContextHash -ne $contextHash) {
            Write-Warn2 "Estado existe, mas é de outro contexto. Criando estado novo."
            $state = New-StateObject -ContextHash $contextHash
        }
        else {
            Write-Warn2 "Retomada automática ativa."
            Write-Host "Último concluído: $($state.LastCompletedRepoName)"
            Write-Host "Último com sucesso: $($state.LastSuccessfulRepoName)"
            Write-Host ""
        }
    }
    catch {
        Write-Warn2 "Não consegui ler/reparar o clone-state.json. Criando estado novo."
        $state = New-StateObject -ContextHash $contextHash
    }
}
else {
    $state = New-StateObject -ContextHash $contextHash
}

$state = Repair-StateObject -State $state -ContextHash $contextHash
Save-State -StateFile $stateFile -State $state -ContextHash $contextHash

$patSecure = Read-Host "Cole seu PAT do Azure DevOps" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($patSecure)

try {
    $pat = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

if ([string]::IsNullOrWhiteSpace($pat)) {
    Write-Bad "PAT vazio. Encerrando."
    exit 1
}

$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
$headers = @{
    Authorization = "Basic $auth"
}

$apiUrl = "https://dev.azure.com/$Organization/$Project/_apis/git/repositories?api-version=7.1"

Write-Info "Buscando lista de repositórios no Azure DevOps..."
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get
}
catch {
    $raw = $_.Exception.Message
    $kind = Get-ErrorKind $raw

    Write-Bad "Não consegui listar os repositórios."
    Write-Host "Tipo: $kind"
    Write-Host "Diagnóstico: $(Explain-ErrorKind $kind)"
    Write-Host ""
    Write-Host "Erro bruto:"
    Write-Host $raw

    Add-Failure -CsvFile $failCsv -Repo "__API_LIST__" -Status "FAILED" -Kind $kind -Target "__AZURE_DEVOPS_API__" -Message $raw
    exit 1
}

$visibleRepos = @($response.value | Sort-Object name)

if (-not $visibleRepos -or $visibleRepos.Count -eq 0) {
    Write-Warn2 "Nenhum repositório encontrado."
    Write-Host ""
    Write-Host "Possíveis causas:"
    Write-Host "- PAT sem permissão;"
    Write-Host "- Organization ou Project incorreto;"
    Write-Host "- usuário sem visibilidade nos repositórios;"
    Write-Host "- API respondeu, mas sua conta não enxerga nenhum repo."
    exit 0
}

# Catalogação antes de qualquer clone/fetch.
$catalogRows = @(
    foreach ($repo in $visibleRepos) {
        $status = Get-RepoStatus $repo

        [PSCustomObject]@{
            Status        = $status
            Name          = Get-SafeValue $repo "name"
            Id            = Get-SafeValue $repo "id"
            IsDisabled    = if ($status -eq "DISABLED") { "true" } else { "false" }
            DefaultBranch = Get-SafeValue $repo "defaultBranch"
            Size          = Get-SafeValue $repo "size"
        }
    }
)

$disabledRepos = @($visibleRepos | Where-Object { Test-RepoDisabled $_ } | Sort-Object name)
$accessibleRepos = @($visibleRepos | Where-Object { -not (Test-RepoDisabled $_) } | Sort-Object name)

$catalogRows | Export-Csv -Path $catalogCsv -NoTypeInformation -Encoding UTF8
@($catalogRows | Where-Object { $_.Status -eq "ACCESSIBLE" }) | Export-Csv -Path $accessibleCsv -NoTypeInformation -Encoding UTF8
@($catalogRows | Where-Object { $_.Status -eq "DISABLED" }) | Export-Csv -Path $disabledCsv -NoTypeInformation -Encoding UTF8

$state = Repair-StateObject -State $state -ContextHash $contextHash
$state.TotalVisibleRepos = $visibleRepos.Count
$state.TotalAccessibleRepos = $accessibleRepos.Count
$state.TotalDisabledRepos = $disabledRepos.Count
Save-State -StateFile $stateFile -State $state -ContextHash $contextHash

Write-Host "========================================"
Write-Host "Catálogo de repositórios"
Write-Host "========================================"
Write-Host "Visíveis pela API:       $($visibleRepos.Count)"
Write-Host "Acessíveis/ativos:       $($accessibleRepos.Count)"
Write-Host "Disabled/desabilitados:  $($disabledRepos.Count)"
Write-Host ""
Write-Host "Catálogo completo:"
Write-Host $catalogCsv
Write-Host ""
Write-Host "Somente acessíveis:"
Write-Host $accessibleCsv
Write-Host ""
Write-Host "Somente disabled:"
Write-Host $disabledCsv
Write-Host ""

if ($disabledRepos.Count -gt 0) {
    Write-Warn2 "Repos disabled foram catalogados e serão pulados antes de qualquer fetch/clone."
    Write-Host ""
    Write-Host "Primeiros disabled encontrados:"
    $disabledRepos |
        Select-Object -First 10 |
        ForEach-Object { Write-Host " - $($_.name)" }
    Write-Host ""
}

if ($accessibleRepos.Count -eq 0) {
    Write-Warn2 "Nenhum repositório acessível/ativo para processar."
    exit 0
}

$resumePoint = ""

if (-not [string]::IsNullOrWhiteSpace($StartFromName)) {
    $resumePoint = $StartFromName
    Write-Warn2 "StartFromName informado. Começando a partir de: $StartFromName"
}
elseif ((-not $NoResume) -and (-not [string]::IsNullOrWhiteSpace($state.LastCompletedRepoName))) {
    $resumePoint = $state.LastCompletedRepoName
    Write-Warn2 "Retomando automaticamente depois de: $resumePoint"
}

$repos = $accessibleRepos

if (-not [string]::IsNullOrWhiteSpace($resumePoint)) {
    if (-not [string]::IsNullOrWhiteSpace($StartFromName)) {
        # StartFromName é inclusivo.
        $repos = @($accessibleRepos | Where-Object {
            [string]::Compare($_.name, $resumePoint, $true) -ge 0
        })
    }
    else {
        # Retomada automática é depois do último concluído.
        $repos = @($accessibleRepos | Where-Object {
            [string]::Compare($_.name, $resumePoint, $true) -gt 0
        })
    }
}

if ($repos.Count -eq 0) {
    Write-Ok "Nada pendente pelo estado atual."
    Write-Host ""
    Write-Host "Último concluído: $($state.LastCompletedRepoName)"
    Write-Host "Último com sucesso: $($state.LastSuccessfulRepoName)"
    Write-Host ""
    Write-Host "Para forçar varredura do começo:"
    Write-Host "powershell -ExecutionPolicy Bypass -File .\clone-azure-repos.ps1 -ResetState"
    exit 0
}

Write-Info "Total acessível/ativo: $($accessibleRepos.Count)"
Write-Info "Pendentes nesta execução: $($repos.Count)"
Write-Host ""

$okCount = 0
$skipCount = 0
$failCount = 0
$disabledSkipCount = $disabledRepos.Count

$accessibleRepoNames = @($accessibleRepos | ForEach-Object { $_.name })

# Laco principal (mesmo escopo deste script).
. "$PSScriptRoot\clone_repo.loop.ps1"


Write-Host ""
Write-Host "========================================"
Write-Host "Finalizado"
Write-Host "========================================"
Write-Host "Visíveis pela API:        $($visibleRepos.Count)"
Write-Host "Acessíveis/ativos:        $($accessibleRepos.Count)"
Write-Host "Disabled/desabilitados:   $($disabledRepos.Count)"
Write-Host ""
Write-Host "OK:                       $okCount"
Write-Host "Pulados existentes/locais: $skipCount"
Write-Host "Pulados disabled:         $disabledSkipCount"
Write-Host "Falhas:                   $failCount"
Write-Host ""
Write-Host "Último concluído:"
Write-Host $state.LastCompletedRepoName
Write-Host ""
Write-Host "Último com sucesso:"
Write-Host $state.LastSuccessfulRepoName
Write-Host ""
Write-Host "Catálogo completo:"
Write-Host $catalogCsv
Write-Host ""
Write-Host "Repos acessíveis:"
Write-Host $accessibleCsv
Write-Host ""
Write-Host "Repos disabled:"
Write-Host $disabledCsv
Write-Host ""
Write-Host "Estado:"
Write-Host $stateFile
Write-Host ""
Write-Host "Log completo:"
Write-Host $logFile
Write-Host ""
Write-Host "CSV de falhas:"
Write-Host $failCsv
Write-Host ""

if ($failCount -gt 0) {
    Write-Warn2 "Houve falhas, mas o script não parou. Na próxima execução, ele continua depois do último repo acessível concluído."
}
else {
    Write-Ok "Nenhuma falha registrada nos repos acessíveis processados."
}
