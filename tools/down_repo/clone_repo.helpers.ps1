# Console, estado e classificacao de erros (dot-source de clone_repo.ps1).

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

