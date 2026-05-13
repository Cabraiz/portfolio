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

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Write-Warn2 {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Bad {
    param([string]$Message)
    Write-Host "[ERRO] $Message" -ForegroundColor Red
}

function Get-Sha256Text {
    param([string]$Text)

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
        $hashBytes = $sha.ComputeHash($bytes)
        return ([BitConverter]::ToString($hashBytes)).Replace("-", "").ToLowerInvariant()
    }
    finally {
        $sha.Dispose()
    }
}

function Get-ContextHash {
    param(
        [string]$Organization,
        [string]$Project,
        [string]$DestRoot
    )

    $normalized = "$($Organization.Trim().ToLowerInvariant())|$($Project.Trim().ToLowerInvariant())|$($DestRoot.Trim().ToLowerInvariant())"
    return Get-Sha256Text $normalized
}

function Ensure-StateProperty {
    param(
        [object]$State,
        [string]$Name,
        [object]$DefaultValue
    )

    if ($null -eq $State.PSObject.Properties[$Name]) {
        $State | Add-Member -NotePropertyName $Name -NotePropertyValue $DefaultValue -Force
    }

    return $State
}

function Repair-StateObject {
    param(
        [object]$State,
        [string]$ContextHash
    )

    $State = Ensure-StateProperty -State $State -Name "ContextHash" -DefaultValue $ContextHash
    $State = Ensure-StateProperty -State $State -Name "CreatedAt" -DefaultValue (Get-Date).ToString("s")
    $State = Ensure-StateProperty -State $State -Name "UpdatedAt" -DefaultValue (Get-Date).ToString("s")

    $State = Ensure-StateProperty -State $State -Name "CurrentRepoName" -DefaultValue ""
    $State = Ensure-StateProperty -State $State -Name "CurrentRepoIndex" -DefaultValue 0

    $State = Ensure-StateProperty -State $State -Name "LastCompletedRepoName" -DefaultValue ""
    $State = Ensure-StateProperty -State $State -Name "LastCompletedRepoIndex" -DefaultValue 0
    $State = Ensure-StateProperty -State $State -Name "LastCompletedRepoStatus" -DefaultValue ""

    $State = Ensure-StateProperty -State $State -Name "LastSuccessfulRepoName" -DefaultValue ""
    $State = Ensure-StateProperty -State $State -Name "LastSuccessfulRepoIndex" -DefaultValue 0

    $State = Ensure-StateProperty -State $State -Name "TotalVisibleRepos" -DefaultValue 0
    $State = Ensure-StateProperty -State $State -Name "TotalAccessibleRepos" -DefaultValue 0
    $State = Ensure-StateProperty -State $State -Name "TotalDisabledRepos" -DefaultValue 0

    return $State
}

function New-StateObject {
    param(
        [string]$ContextHash
    )

    $state = [PSCustomObject]@{
        ContextHash              = $ContextHash
        CreatedAt                = (Get-Date).ToString("s")
        UpdatedAt                = (Get-Date).ToString("s")

        CurrentRepoName          = ""
        CurrentRepoIndex         = 0

        LastCompletedRepoName    = ""
        LastCompletedRepoIndex   = 0
        LastCompletedRepoStatus  = ""

        LastSuccessfulRepoName   = ""
        LastSuccessfulRepoIndex  = 0

        TotalVisibleRepos        = 0
        TotalAccessibleRepos     = 0
        TotalDisabledRepos       = 0
    }

    return $state
}

function Save-State {
    param(
        [string]$StateFile,
        [object]$State,
        [string]$ContextHash
    )

    $State = Repair-StateObject -State $State -ContextHash $ContextHash
    $State.UpdatedAt = (Get-Date).ToString("s")
    $State | ConvertTo-Json -Depth 8 | Set-Content -Path $StateFile -Encoding UTF8
}

function Test-RepoDisabled {
    param([object]$Repo)

    $prop = $Repo.PSObject.Properties["isDisabled"]

    if ($null -eq $prop) {
        return $false
    }

    if ($null -eq $prop.Value) {
        return $false
    }

    try {
        return [System.Convert]::ToBoolean($prop.Value)
    }
    catch {
        return $false
    }
}

function Get-RepoStatus {
    param([object]$Repo)

    if (Test-RepoDisabled $Repo) {
        return "DISABLED"
    }

    return "ACCESSIBLE"
}

function Get-SafeValue {
    param(
        [object]$Object,
        [string]$PropertyName
    )

    $prop = $Object.PSObject.Properties[$PropertyName]

    if ($null -eq $prop) {
        return ""
    }

    if ($null -eq $prop.Value) {
        return ""
    }

    return "$($prop.Value)"
}

function Get-ErrorKind {
    param([string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return "UNKNOWN_EMPTY_OUTPUT"
    }

    $t = $Text.ToLowerInvariant()

    if ($t -match "timed out|timeout|operation canceled|operation cancelled") {
        return "TIMEOUT"
    }

    if ($t -match "authentication failed|could not read username|terminal prompts disabled|cannot prompt|invalid credentials|unauthorized|401|vs30063|tf400813|personal access token|pat") {
        return "AUTH"
    }

    if ($t -match "access denied|forbidden|403|not authorized|tf401019|does not exist or you do not have permissions|you do not have permission") {
        return "PERMISSION_OR_NOT_FOUND"
    }

    if ($t -match "repository not found|not found|404") {
        return "NOT_FOUND"
    }

    if ($t -match "disabled|repository is disabled|repo is disabled|tf401019") {
        return "REPO_DISABLED"
    }

    if ($t -match "dubious ownership|safe.directory") {
        return "GIT_SAFE_DIRECTORY"
    }

    if ($t -match "permission denied|access is denied|unable to create file|could not create|filename too long|no space left|disk full|read-only file system|failed to write|unable to write|could not lock|index.lock|shallow.lock|packed-refs.lock|cannot lock ref") {
        return "LOCAL_WRITE_OR_LOCK"
    }

    if ($t -match "not a git repository|not a git repo|does not appear to be a git repository|bad object|corrupt|loose object|object file.*is empty|invalid object|unable to read") {
        return "LOCAL_REPO_CORRUPT"
    }

    if ($t -match "could not resolve host|failed to connect|connection timed out|tls|ssl|early eof|rpc failed|remote end hung up|connection was reset|connection reset|network is unreachable|proxy|schannel|recv failure|send failure|http 407|http 502|http 503|http 504") {
        return "NETWORK"
    }

    if ($t -match "your local changes|would be overwritten|divergent branches|need to specify how to reconcile|not possible to fast-forward|non-fast-forward|merge conflict|unmerged files|refusing to merge unrelated histories") {
        return "LOCAL_GIT_STATE"
    }

    if ($t -match "couldn't find remote ref|could not read from remote repository|no such remote|remote origin already exists|origin does not appear") {
        return "REMOTE_CONFIG"
    }

    return "UNKNOWN"
}

function Explain-ErrorKind {
    param([string]$Kind)

    switch ($Kind) {
        "AUTH" {
            return "Falha de autenticação. PAT inválido, expirado, sem escopo correto ou Git tentou pedir login e o script bloqueou prompt interativo."
        }
        "PERMISSION_OR_NOT_FOUND" {
            return "Sem permissão ou repositório invisível para seu usuário/PAT. O script pula para o próximo."
        }
        "NOT_FOUND" {
            return "Repositório não encontrado. Pode ter sido removido, renomeado ou estar invisível para sua conta."
        }
        "REPO_DISABLED" {
            return "Repositório desabilitado no Azure DevOps. O script cataloga e pula."
        }
        "GIT_SAFE_DIRECTORY" {
            return "O Git recusou mexer na pasta por segurança de ownership. Normal em pasta criada por outro usuário/admin/ambiente."
        }
        "LOCAL_WRITE_OR_LOCK" {
            return "Problema local de gravação ou lock. Pode ser arquivo travado, index.lock, antivírus/EDR, nome longo, disco cheio ou permissão."
        }
        "LOCAL_REPO_CORRUPT" {
            return "O repo local parece parcial/corrompido. Melhor renomear a pasta local e clonar de novo."
        }
        "REMOTE_CONFIG" {
            return "Configuração remota local quebrada ou divergente. O origin pode estar errado ou o repo remoto mudou."
        }
        "NETWORK" {
            return "Problema transitório de rede/VPN/proxy/TLS. O script tenta novamente antes de pular."
        }
        "TIMEOUT" {
            return "Comando Git demorou demais e foi encerrado pelo timeout. O script tenta novamente antes de pular."
        }
        "LOCAL_GIT_STATE" {
            return "Repo local tem estado que impede pull automático seguro. O script não sobrescreve mudanças locais."
        }
        "UNKNOWN_EMPTY_OUTPUT" {
            return "O Git falhou sem devolver mensagem útil. Pode ser bloqueio externo, processo morto, EDR/antivírus, ou problema na forma de execução."
        }
        default {
            return "Erro não classificado. Veja o log bruto."
        }
    }
}

function Test-RetryableKind {
    param([string]$Kind)

    return @("NETWORK", "TIMEOUT", "UNKNOWN", "UNKNOWN_EMPTY_OUTPUT") -contains $Kind
}

function Quote-Arg {
    param([string]$Arg)

    if ($null -eq $Arg) {
        return '""'
    }

    if ($Arg -eq "") {
        return '""'
    }

    if ($Arg -notmatch '[\s"]') {
        return $Arg
    }

    return '"' + ($Arg -replace '"', '\"') + '"'
}

function Invoke-GitOnce {
    param(
        [string[]]$ArgsForGit,
        [string]$Auth,
        [int]$TimeoutSeconds,
        [string]$WorkDir
    )

    $fullArgs = @(
        "-c", "http.extraHeader=Authorization: Basic $Auth",
        "-c", "credential.helper=",
        "-c", "core.askPass=",
        "-c", "advice.detachedHead=false"
    ) + $ArgsForGit

    $argLine = ($fullArgs | ForEach-Object { Quote-Arg $_ }) -join " "

    $tmpBase = Join-Path $env:TEMP ("git-run-" + [Guid]::NewGuid().ToString("N"))
    $stdoutFile = "$tmpBase.out.txt"
    $stderrFile = "$tmpBase.err.txt"

    try {
        $p = Start-Process `
            -FilePath "git" `
            -ArgumentList $argLine `
            -WorkingDirectory $WorkDir `
            -RedirectStandardOutput $stdoutFile `
            -RedirectStandardError $stderrFile `
            -WindowStyle Hidden `
            -PassThru

        $finished = $p.WaitForExit($TimeoutSeconds * 1000)

        if (-not $finished) {
            try {
                $p.Kill()
            }
            catch {}

            $out = ""
            $err = ""

            if (Test-Path $stdoutFile) {
                $out = Get-Content $stdoutFile -Raw -ErrorAction SilentlyContinue
            }

            if (Test-Path $stderrFile) {
                $err = Get-Content $stderrFile -Raw -ErrorAction SilentlyContinue
            }

            return [PSCustomObject]@{
                ExitCode = -999
                Kind     = "TIMEOUT"
                Output   = "TIMEOUT após $TimeoutSeconds segundos.`n$out`n$err"
            }
        }

        $stdout = ""
        $stderr = ""

        if (Test-Path $stdoutFile) {
            $stdout = Get-Content $stdoutFile -Raw -ErrorAction SilentlyContinue
        }

        if (Test-Path $stderrFile) {
            $stderr = Get-Content $stderrFile -Raw -ErrorAction SilentlyContinue
        }

        $combined = "$stdout`n$stderr"
        $kind = if ($p.ExitCode -eq 0) { "OK" } else { Get-ErrorKind $combined }

        return [PSCustomObject]@{
            ExitCode = $p.ExitCode
            Kind     = $kind
            Output   = $combined
        }
    }
    catch {
        $msg = $_.Exception.Message

        return [PSCustomObject]@{
            ExitCode = -998
            Kind     = Get-ErrorKind $msg
            Output   = $msg
        }
    }
    finally {
        Remove-Item $stdoutFile -Force -ErrorAction SilentlyContinue
        Remove-Item $stderrFile -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-GitWithRetry {
    param(
        [string[]]$ArgsForGit,
        [string]$Auth,
        [int]$TimeoutSeconds,
        [int]$MaxRetries,
        [string]$OperationName,
        [string]$RepoName,
        [string]$WorkDir
    )

    $attempt = 0
    $maxAttempts = 1 + [Math]::Max(0, $MaxRetries)

    while ($attempt -lt $maxAttempts) {
        $attempt++

        if ($attempt -gt 1) {
            Write-Warn2 "$OperationName em '$RepoName': tentativa $attempt/$maxAttempts"
        }

        $result = Invoke-GitOnce `
            -ArgsForGit $ArgsForGit `
            -Auth $Auth `
            -TimeoutSeconds $TimeoutSeconds `
            -WorkDir $WorkDir

        $result | Add-Member -NotePropertyName Attempts -NotePropertyValue $attempt -Force

        if ($result.ExitCode -eq 0) {
            return $result
        }

        if (-not (Test-RetryableKind $result.Kind)) {
            return $result
        }

        if ($attempt -ge $maxAttempts) {
            return $result
        }

        $sleepSeconds = [Math]::Min(20, 4 * $attempt)
        Write-Warn2 "$OperationName falhou com $($result.Kind). Nova tentativa em $sleepSeconds segundos."
        Start-Sleep -Seconds $sleepSeconds
    }

    return $result
}

function Test-IsGitRepo {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return $false
    }

    if (-not (Test-Path (Join-Path $Path ".git"))) {
        return $false
    }

    $result = & git -C $Path rev-parse --is-inside-work-tree 2>$null
    return ($LASTEXITCODE -eq 0 -and "$result".Trim() -eq "true")
}

function Add-Failure {
    param(
        [string]$CsvFile,
        [string]$Repo,
        [string]$Status,
        [string]$Kind,
        [string]$Target,
        [string]$Message
    )

    $safeMsg = "$Message".Replace('"', "'").Replace("`r", " ").Replace("`n", " ")
    $line = '"' + $Repo + '","' + $Status + '","' + $Kind + '","' + $Target + '","' + $safeMsg + '"'
    Add-Content -Path $CsvFile -Value $line -Encoding UTF8
}

function Add-Log {
    param(
        [string]$LogFile,
        [string]$Message
    )

    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

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

foreach ($repo in $repos) {
    # Segurança extra: se por algum motivo entrou disabled na lista, pula.
    if (Test-RepoDisabled $repo) {
        Write-Warn2 "Pulando disabled: $($repo.name)"
        $skipCount++
        continue
    }

    $globalIndex = [Array]::IndexOf($accessibleRepoNames, $repo.name) + 1

    $safeName = $repo.name -replace '[\\/:*?"<>|]', '_'
    $target = Join-Path $DestRoot $safeName

    Write-Host ""
    Write-Info "[$globalIndex/$($accessibleRepos.Count) acessíveis] $($repo.name)"

    $state = Repair-StateObject -State $state -ContextHash $contextHash
    $state.CurrentRepoName = $repo.name
    $state.CurrentRepoIndex = $globalIndex
    Save-State -StateFile $stateFile -State $state -ContextHash $contextHash

    Add-Log -LogFile $logFile -Message "START repo=$($repo.name) target=$target"

    $completedStatus = ""
    $completedOk = $false

    if (Test-IsGitRepo $target) {
        if ($CloneOnlyMissing) {
            Write-Warn2 "Já existe. CloneOnlyMissing ativo, pulando."
            Add-Log -LogFile $logFile -Message "SKIP existing repo=$($repo.name)"

            $completedStatus = "SKIPPED_EXISTING"
            $skipCount++
        }
        else {
            Write-Info "Já existe com .git. Atualizando sem reclonar."

            $fetch = Invoke-GitWithRetry `
                -Auth $auth `
                -ArgsForGit @("-C", $target, "fetch", "--all", "--prune") `
                -TimeoutSeconds $GitTimeoutSeconds `
                -MaxRetries $MaxRetries `
                -OperationName "fetch" `
                -RepoName $repo.name `
                -WorkDir $DestRoot

            if ($fetch.ExitCode -ne 0) {
                Write-Bad "Falhou no fetch. Pulando automaticamente."
                Write-Host "Tipo: $($fetch.Kind)"
                Write-Host "Tentativas: $($fetch.Attempts)"
                Write-Host "Diagnóstico: $(Explain-ErrorKind $fetch.Kind)"
                Write-Host "Erro:"
                Write-Host $fetch.Output

                Add-Failure -CsvFile $failCsv -Repo $repo.name -Status "FETCH_FAILED" -Kind $fetch.Kind -Target $target -Message $fetch.Output
                Add-Log -LogFile $logFile -Message "FAIL fetch repo=$($repo.name) kind=$($fetch.Kind) attempts=$($fetch.Attempts)"

                $completedStatus = "FETCH_FAILED_$($fetch.Kind)"
                $failCount++
            }
            else {
                $pull = Invoke-GitWithRetry `
                    -Auth $auth `
                    -ArgsForGit @("-C", $target, "pull", "--ff-only") `
                    -TimeoutSeconds $GitTimeoutSeconds `
                    -MaxRetries $MaxRetries `
                    -OperationName "pull" `
                    -RepoName $repo.name `
                    -WorkDir $DestRoot

                if ($pull.ExitCode -ne 0) {
                    Write-Bad "Falhou no pull. Pulando automaticamente."
                    Write-Host "Tipo: $($pull.Kind)"
                    Write-Host "Tentativas: $($pull.Attempts)"
                    Write-Host "Diagnóstico: $(Explain-ErrorKind $pull.Kind)"
                    Write-Host "Erro:"
                    Write-Host $pull.Output

                    Add-Failure -CsvFile $failCsv -Repo $repo.name -Status "PULL_FAILED" -Kind $pull.Kind -Target $target -Message $pull.Output
                    Add-Log -LogFile $logFile -Message "FAIL pull repo=$($repo.name) kind=$($pull.Kind) attempts=$($pull.Attempts)"

                    $completedStatus = "PULL_FAILED_$($pull.Kind)"
                    $failCount++
                }
                else {
                    Write-Ok "Atualizado."
                    Add-Log -LogFile $logFile -Message "OK updated repo=$($repo.name)"

                    $completedStatus = "UPDATED"
                    $completedOk = $true
                    $okCount++
                }
            }
        }
    }
    elseif ((Test-Path $target) -and (-not (Test-Path (Join-Path $target ".git")))) {
        Write-Warn2 "A pasta já existe, mas não tem .git. Pulando para não sobrescrever nada."
        Write-Host "Pasta problemática: $target"

        Add-Failure -CsvFile $failCsv -Repo $repo.name -Status "SKIPPED_FOLDER_EXISTS_NO_GIT" -Kind "LOCAL_FOLDER" -Target $target -Message "Folder exists but is not a Git repository."
        Add-Log -LogFile $logFile -Message "SKIP folder exists no git repo=$($repo.name)"

        $completedStatus = "SKIPPED_FOLDER_EXISTS_NO_GIT"
        $skipCount++
    }
    else {
        Write-Info "Clonando."

        $clone = Invoke-GitWithRetry `
            -Auth $auth `
            -ArgsForGit @("clone", "--progress", "--", $repo.remoteUrl, $target) `
            -TimeoutSeconds $GitTimeoutSeconds `
            -MaxRetries $MaxRetries `
            -OperationName "clone" `
            -RepoName $repo.name `
            -WorkDir $DestRoot

        if ($clone.ExitCode -ne 0) {
            Write-Bad "Falhou no clone. Pulando automaticamente."
            Write-Host "Tipo: $($clone.Kind)"
            Write-Host "Tentativas: $($clone.Attempts)"
            Write-Host "Diagnóstico: $(Explain-ErrorKind $clone.Kind)"
            Write-Host "Erro:"
            Write-Host $clone.Output

            Add-Failure -CsvFile $failCsv -Repo $repo.name -Status "CLONE_FAILED" -Kind $clone.Kind -Target $target -Message $clone.Output
            Add-Log -LogFile $logFile -Message "FAIL clone repo=$($repo.name) kind=$($clone.Kind) attempts=$($clone.Attempts)"

            $completedStatus = "CLONE_FAILED_$($clone.Kind)"
            $failCount++
        }
        else {
            Write-Ok "Clonado."
            Add-Log -LogFile $logFile -Message "OK cloned repo=$($repo.name)"

            $completedStatus = "CLONED"
            $completedOk = $true
            $okCount++
        }
    }

    # Avança o estado depois de cada repo tratado.
    # Isso evita recomeçar do zero se cair VPN, terminal, notebook ou autenticação.
    $state = Repair-StateObject -State $state -ContextHash $contextHash
    $state.CurrentRepoName = ""
    $state.CurrentRepoIndex = 0
    $state.LastCompletedRepoName = $repo.name
    $state.LastCompletedRepoIndex = $globalIndex
    $state.LastCompletedRepoStatus = $completedStatus

    if ($completedOk) {
        $state.LastSuccessfulRepoName = $repo.name
        $state.LastSuccessfulRepoIndex = $globalIndex
    }

    Save-State -StateFile $stateFile -State $state -ContextHash $contextHash
}

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
