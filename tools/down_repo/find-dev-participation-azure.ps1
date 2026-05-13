
param(
    [string]$Organization = "",
    [string]$Project      = "",
    [string]$DestRoot     = "$env:USERPROFILE\Documents\GitHub\AzureReposAudit",
    [string]$TargetsJsonPath = "",

    # Contains só afeta targets do tipo name.
    # email, id e url sempre usam match exato.
    [ValidateSet("Contains", "Exact")]
    [string]$NameMatchMode = "Contains",

    [switch]$SkipPrComments,
    [switch]$ScanReviewersList,
    [switch]$ScanCommits,
    [int]$CommitsTop = 500,
    [int]$PrTop = 1000,
    [switch]$NoResume,
    [switch]$ResetState,
    [switch]$OpenCsv,
    [int]$ApiTimeoutSeconds = 120
)

$ErrorActionPreference = "Stop"

function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Message) Write-Host "[OK]   $Message" -ForegroundColor Green }
function Write-Warn2{ param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Bad  { param([string]$Message) Write-Host "[ERRO] $Message" -ForegroundColor Red }

function Get-Sha256Text {
    param([string]$Text)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
        $hashBytes = $sha.ComputeHash($bytes)
        return ([BitConverter]::ToString($hashBytes)).Replace("-", "").ToLowerInvariant()
    }
    finally { $sha.Dispose() }
}

function Get-ShortHash {
    param([string]$Text)
    return (Get-Sha256Text $Text).Substring(0, 12)
}

function Normalize-Text {
    param([string]$Text)
    if ([string]::IsNullOrWhiteSpace($Text)) { return "" }

    $s = $Text.Trim().ToLowerInvariant()
    $normalized = $s.Normalize([Text.NormalizationForm]::FormD)
    $sb = New-Object System.Text.StringBuilder

    foreach ($ch in $normalized.ToCharArray()) {
        $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch)
        if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$sb.Append($ch)
        }
    }

    return $sb.ToString().Normalize([Text.NormalizationForm]::FormC)
}

function Normalize-Url {
    param([string]$Url)
    if ([string]::IsNullOrWhiteSpace($Url)) { return "" }
    return $Url.Trim().TrimEnd('/').ToLowerInvariant()
}

function Get-ContextHash {
    param(
        [string]$Organization,
        [string]$Project,
        [string]$TargetsHash,
        [string]$Mode,
        [bool]$ScanPrComments,
        [bool]$ScanReviewersList,
        [bool]$ScanCommits
    )

    $normalized = @(
        $Organization.Trim().ToLowerInvariant(),
        $Project.Trim().ToLowerInvariant(),
        $TargetsHash,
        $Mode,
        "comments=$ScanPrComments",
        "reviewers=$ScanReviewersList",
        "commits=$ScanCommits"
    ) -join "|"

    return Get-Sha256Text $normalized
}

function Ensure-StateProperty {
    param([object]$State, [string]$Name, [object]$DefaultValue)
    if ($null -eq $State.PSObject.Properties[$Name]) {
        $State | Add-Member -NotePropertyName $Name -NotePropertyValue $DefaultValue -Force
    }
    return $State
}

function Repair-StateObject {
    param([object]$State, [string]$ContextHash)

    $State = Ensure-StateProperty $State "ContextHash" $ContextHash
    $State = Ensure-StateProperty $State "CreatedAt" (Get-Date).ToString("s")
    $State = Ensure-StateProperty $State "UpdatedAt" (Get-Date).ToString("s")
    $State = Ensure-StateProperty $State "CurrentRepoName" ""
    $State = Ensure-StateProperty $State "CurrentRepoIndex" 0
    $State = Ensure-StateProperty $State "LastCompletedRepoName" ""
    $State = Ensure-StateProperty $State "LastCompletedRepoIndex" 0
    $State = Ensure-StateProperty $State "LastCompletedRepoStatus" ""
    $State = Ensure-StateProperty $State "TotalVisibleRepos" 0
    $State = Ensure-StateProperty $State "TotalAccessibleRepos" 0
    $State = Ensure-StateProperty $State "TotalDisabledRepos" 0
    $State = Ensure-StateProperty $State "TotalEvidence" 0

    return $State
}

function New-StateObject {
    param([string]$ContextHash)

    return [PSCustomObject]@{
        ContextHash             = $ContextHash
        CreatedAt               = (Get-Date).ToString("s")
        UpdatedAt               = (Get-Date).ToString("s")
        CurrentRepoName         = ""
        CurrentRepoIndex        = 0
        LastCompletedRepoName   = ""
        LastCompletedRepoIndex  = 0
        LastCompletedRepoStatus = ""
        TotalVisibleRepos       = 0
        TotalAccessibleRepos    = 0
        TotalDisabledRepos      = 0
        TotalEvidence           = 0
    }
}

function Save-State {
    param([string]$StateFile, [object]$State, [string]$ContextHash)
    $State = Repair-StateObject $State $ContextHash
    $State.UpdatedAt = (Get-Date).ToString("s")
    $State | ConvertTo-Json -Depth 10 | Set-Content -Path $StateFile -Encoding UTF8
}

function Get-ErrorKind {
    param([string]$Text)
    if ([string]::IsNullOrWhiteSpace($Text)) { return "UNKNOWN_EMPTY_OUTPUT" }
    $t = $Text.ToLowerInvariant()

    if ($t -match "timed out|timeout|operation canceled|operation cancelled") { return "TIMEOUT" }
    if ($t -match "authentication failed|unauthorized|401|vs30063|tf400813|personal access token|pat|invalid credentials") { return "AUTH" }
    if ($t -match "access denied|forbidden|403|not authorized|tf401019|does not exist or you do not have permissions|you do not have permission") { return "PERMISSION_OR_NOT_FOUND" }
    if ($t -match "not found|404") { return "NOT_FOUND" }
    if ($t -match "disabled|repository is disabled|repo is disabled") { return "REPO_DISABLED" }
    if ($t -match "could not resolve host|failed to connect|connection timed out|tls|ssl|connection was reset|network is unreachable|proxy|schannel|http 407|http 502|http 503|http 504") { return "NETWORK" }

    return "UNKNOWN"
}

function Explain-ErrorKind {
    param([string]$Kind)
    switch ($Kind) {
        "AUTH" { return "Falha de autenticação. PAT inválido, expirado ou sem escopo suficiente." }
        "PERMISSION_OR_NOT_FOUND" { return "Sem permissão ou recurso invisível para seu usuário/PAT." }
        "NOT_FOUND" { return "Recurso não encontrado." }
        "REPO_DISABLED" { return "Repositório desabilitado." }
        "NETWORK" { return "Problema de rede/VPN/proxy/TLS." }
        "TIMEOUT" { return "A chamada demorou demais e estourou timeout." }
        "UNKNOWN_EMPTY_OUTPUT" { return "Falha sem mensagem útil." }
        default { return "Erro não classificado. Veja log bruto." }
    }
}

function Get-SafeValue {
    param([object]$Object, [string]$PropertyName)
    if ($null -eq $Object) { return "" }
    $prop = $Object.PSObject.Properties[$PropertyName]
    if ($null -eq $prop -or $null -eq $prop.Value) { return "" }
    return "$($prop.Value)"
}

function Test-RepoDisabled {
    param([object]$Repo)
    $prop = $Repo.PSObject.Properties["isDisabled"]
    if ($null -eq $prop -or $null -eq $prop.Value) { return $false }
    try { return [System.Convert]::ToBoolean($prop.Value) } catch { return $false }
}

function Get-RepoStatus {
    param([object]$Repo)
    if (Test-RepoDisabled $Repo) { return "DISABLED" }
    return "ACCESSIBLE"
}

function Get-HeaderValue {
    param([object]$Headers, [string]$Name)
    if ($null -eq $Headers) { return "" }

    foreach ($key in $Headers.Keys) {
        if ("$key".ToLowerInvariant() -eq $Name.ToLowerInvariant()) {
            $value = $Headers[$key]
            if ($null -eq $value) { return "" }
            if ($value -is [array]) { return "$($value[0])" }
            return "$value"
        }
    }
    return ""
}

function Add-QueryParameter {
    param([string]$Url, [string]$Name, [string]$Value)
    $encodedName = [System.Uri]::EscapeDataString($Name)
    $encodedValue = [System.Uri]::EscapeDataString($Value)
    if ($Url.Contains("?")) { return "$Url&$encodedName=$encodedValue" }
    return "$Url`?$encodedName=$encodedValue"
}

function Invoke-AdoGetPagedValues {
    param([string]$Url, [hashtable]$Headers, [int]$TimeoutSeconds, [string]$OperationName)

    $items = New-Object System.Collections.Generic.List[object]
    $continuationToken = ""

    do {
        $actualUrl = $Url
        if (-not [string]::IsNullOrWhiteSpace($continuationToken)) {
            $actualUrl = Add-QueryParameter -Url $Url -Name "continuationToken" -Value $continuationToken
        }

        try {
            $response = Invoke-WebRequest -Uri $actualUrl -Headers $Headers -Method Get -TimeoutSec $TimeoutSeconds
            $content = "$($response.Content)"

            if (-not [string]::IsNullOrWhiteSpace($content)) {
                $json = $content | ConvertFrom-Json
                if ($null -ne $json.PSObject.Properties["value"]) {
                    foreach ($item in @($json.value)) { $items.Add($item) }
                }
                elseif ($null -ne $json) { $items.Add($json) }
            }

            $continuationToken = Get-HeaderValue -Headers $response.Headers -Name "x-ms-continuationtoken"
        }
        catch {
            $message = $_.Exception.Message
            $kind = Get-ErrorKind $message
            throw [System.Exception]::new("$OperationName falhou. Tipo=$kind. Diagnóstico=$(Explain-ErrorKind $kind). Erro=$message")
        }
    }
    while (-not [string]::IsNullOrWhiteSpace($continuationToken))

    return @($items)
}

function Add-Log {
    param([string]$LogFile, [string]$Message)
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Add-Failure {
    param([string]$CsvFile, [string]$Repo, [string]$Operation, [string]$Kind, [string]$Message)
    $safeMsg = "$Message".Replace('"', "'").Replace("`r", " ").Replace("`n", " ")
    [PSCustomObject]@{ Repo = $Repo; Operation = $Operation; Kind = $Kind; Message = $safeMsg } |
        Export-Csv -Path $CsvFile -NoTypeInformation -Encoding UTF8 -Append
}

function Get-TargetKindFromString {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) { return "EMPTY" }
    $v = $Value.Trim()
    if ($v -match "^https?://") { return "url" }
    if ($v -match "@") { return "email" }
    if ($v -match "^[0-9a-fA-F-]{20,}$") { return "id" }
    return "name"
}

function New-TargetTemplate {
    param([string]$Path)
    $template = @'
[
  { "name": "Nome Completo" },
  { "email": "pessoa@empresa.com" },
  { "id": "00000000-0000-0000-0000-000000000000" },
  { "url": "https://vssps.dev.azure.com/ORG/_apis/Identities/00000000-0000-0000-0000-000000000000" }
]
'@
    $template | Set-Content -Path $Path -Encoding UTF8
}

function Load-TargetSpecs {
    param([string]$Path)

    $rawText = Get-Content -Path $Path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($rawText)) { throw "Arquivo de targets vazio: $Path" }

    $parsed = $rawText | ConvertFrom-Json
    if ($null -ne $parsed.PSObject.Properties["devs"]) { $items = @($parsed.devs) }
    elseif ($null -ne $parsed.PSObject.Properties["targets"]) { $items = @($parsed.targets) }
    else { $items = @($parsed) }

    $targets = New-Object System.Collections.Generic.List[object]
    $seenTargetKeys = @{}

    foreach ($item in $items) {
        $label = ""
        $terms = New-Object System.Collections.Generic.List[object]
        $enforceUniqueIdentity = $false
        $targetType = ""

        if ($item -is [string]) {
            $value = $item.Trim()
            if ([string]::IsNullOrWhiteSpace($value)) { continue }

            $kind = Get-TargetKindFromString $value
            $label = $value
            $targetType = $kind
            $enforceUniqueIdentity = ($kind -eq "name")

            $terms.Add([PSCustomObject]@{ Kind = $kind; Value = $value })
        }
        else {
            $name = Get-SafeValue -Object $item -PropertyName "name"
            $email = Get-SafeValue -Object $item -PropertyName "email"
            $id = Get-SafeValue -Object $item -PropertyName "id"
            $url = Get-SafeValue -Object $item -PropertyName "url"

            # Se houver email/id/url, eles são usados para match exato.
            # Nesse caso, name vira só rótulo humano.
            if (-not [string]::IsNullOrWhiteSpace($email)) { $terms.Add([PSCustomObject]@{ Kind = "email"; Value = $email.Trim() }) }
            if (-not [string]::IsNullOrWhiteSpace($id))    { $terms.Add([PSCustomObject]@{ Kind = "id";    Value = $id.Trim() }) }
            if (-not [string]::IsNullOrWhiteSpace($url))   { $terms.Add([PSCustomObject]@{ Kind = "url";   Value = $url.Trim() }) }

            if ($terms.Count -gt 0) {
                $targetType = "identifier"
                $enforceUniqueIdentity = $false
                if (-not [string]::IsNullOrWhiteSpace($name)) { $label = $name.Trim() }
                elseif (-not [string]::IsNullOrWhiteSpace($email)) { $label = $email.Trim() }
                elseif (-not [string]::IsNullOrWhiteSpace($id)) { $label = $id.Trim() }
                else { $label = $url.Trim() }
            }
            elseif (-not [string]::IsNullOrWhiteSpace($name)) {
                $targetType = "name"
                $enforceUniqueIdentity = $true
                $label = $name.Trim()
                $terms.Add([PSCustomObject]@{ Kind = "name"; Value = $name.Trim() })
            }
            else { continue }
        }

        $targetKey = $label
        if ([string]::IsNullOrWhiteSpace($targetKey)) { $targetKey = ($terms[0].Value) }

        $normalizedKey = Normalize-Text $targetKey
        if ($seenTargetKeys.ContainsKey($normalizedKey)) {
            throw "Target duplicado no JSON de entrada: '$targetKey'. Remova duplicatas antes de rodar."
        }
        $seenTargetKeys[$normalizedKey] = $true

        $targets.Add([PSCustomObject]@{
            Key                   = $targetKey
            TargetType            = $targetType
            EnforceUniqueIdentity = $enforceUniqueIdentity
            Terms                 = @($terms)
        })
    }

    return @($targets)
}

function Get-IdentityValues {
    param([object]$Identity)
    $values = New-Object System.Collections.Generic.List[object]
    if ($null -eq $Identity) { return @() }

    foreach ($propName in @("id", "descriptor")) {
        $v = Get-SafeValue -Object $Identity -PropertyName $propName
        if (-not [string]::IsNullOrWhiteSpace($v)) { $values.Add([PSCustomObject]@{ Kind = "id"; Value = $v }) }
    }

    foreach ($propName in @("displayName")) {
        $v = Get-SafeValue -Object $Identity -PropertyName $propName
        if (-not [string]::IsNullOrWhiteSpace($v)) { $values.Add([PSCustomObject]@{ Kind = "name"; Value = $v }) }
    }

    foreach ($propName in @("uniqueName", "email")) {
        $v = Get-SafeValue -Object $Identity -PropertyName $propName
        if (-not [string]::IsNullOrWhiteSpace($v)) { $values.Add([PSCustomObject]@{ Kind = "email"; Value = $v }) }
    }

    foreach ($propName in @("url")) {
        $v = Get-SafeValue -Object $Identity -PropertyName $propName
        if (-not [string]::IsNullOrWhiteSpace($v)) { $values.Add([PSCustomObject]@{ Kind = "url"; Value = $v }) }
    }

    return @($values)
}

function Find-IdentityMatches {
    param([object[]]$Targets, [object]$Identity, [string]$NameMatchMode)

    $identityValues = @(Get-IdentityValues -Identity $Identity)
    if ($identityValues.Count -eq 0) { return @() }

    $matches = New-Object System.Collections.Generic.List[object]

    foreach ($target in $Targets) {
        foreach ($term in @($target.Terms)) {
            foreach ($identityValue in $identityValues) {
                $isMatch = $false

                if ($term.Kind -eq "url") {
                    if ($identityValue.Kind -eq "url") {
                        $isMatch = ((Normalize-Url $identityValue.Value) -eq (Normalize-Url $term.Value))
                    }
                }
                elseif ($term.Kind -eq "email") {
                    if ($identityValue.Kind -eq "email") {
                        $isMatch = ((Normalize-Text $identityValue.Value) -eq (Normalize-Text $term.Value))
                    }
                }
                elseif ($term.Kind -eq "id") {
                    if ($identityValue.Kind -eq "id") {
                        $isMatch = ((Normalize-Text $identityValue.Value) -eq (Normalize-Text $term.Value))
                    }
                }
                elseif ($term.Kind -eq "name") {
                    $left = Normalize-Text $identityValue.Value
                    $right = Normalize-Text $term.Value
                    if ($NameMatchMode -eq "Exact") { $isMatch = ($left -eq $right) }
                    else { $isMatch = ($left.Contains($right) -or $right.Contains($left)) }
                }

                if ($isMatch) {
                    $matches.Add([PSCustomObject]@{
                        TargetKey             = $target.Key
                        TargetType            = $target.TargetType
                        EnforceUniqueIdentity = $target.EnforceUniqueIdentity
                        MatchedTerm           = $term.Value
                        MatchedTermKind       = $term.Kind
                        MatchedValue          = $identityValue.Value
                        MatchedValueKind      = $identityValue.Kind
                    })
                }
            }
        }
    }

    return @($matches)
}

function New-IdentitySnapshot {
    param([object]$Identity)
    if ($null -eq $Identity) {
        return [PSCustomObject]@{ Id = ""; DisplayName = ""; UniqueName = ""; Email = ""; Url = ""; Descriptor = "" }
    }
    return [PSCustomObject]@{
        Id          = Get-SafeValue -Object $Identity -PropertyName "id"
        DisplayName = Get-SafeValue -Object $Identity -PropertyName "displayName"
        UniqueName  = Get-SafeValue -Object $Identity -PropertyName "uniqueName"
        Email       = Get-SafeValue -Object $Identity -PropertyName "email"
        Url         = Get-SafeValue -Object $Identity -PropertyName "url"
        Descriptor  = Get-SafeValue -Object $Identity -PropertyName "descriptor"
    }
}

function New-CommitIdentity {
    param([object]$CommitPerson)
    return [PSCustomObject]@{
        id          = ""
        displayName = Get-SafeValue -Object $CommitPerson -PropertyName "name"
        uniqueName  = Get-SafeValue -Object $CommitPerson -PropertyName "email"
        email       = Get-SafeValue -Object $CommitPerson -PropertyName "email"
        url         = ""
        descriptor  = ""
    }
}

function Get-IdentityUniqueKey {
    param([object]$Identity)
    $snap = New-IdentitySnapshot -Identity $Identity
    if (-not [string]::IsNullOrWhiteSpace($snap.Id)) { return "id:" + (Normalize-Text $snap.Id) }
    if (-not [string]::IsNullOrWhiteSpace($snap.Descriptor)) { return "descriptor:" + (Normalize-Text $snap.Descriptor) }
    if (-not [string]::IsNullOrWhiteSpace($snap.Email)) { return "email:" + (Normalize-Text $snap.Email) }
    if (-not [string]::IsNullOrWhiteSpace($snap.UniqueName)) { return "unique:" + (Normalize-Text $snap.UniqueName) }
    if (-not [string]::IsNullOrWhiteSpace($snap.Url)) { return "url:" + (Normalize-Url $snap.Url) }
    if (-not [string]::IsNullOrWhiteSpace($snap.DisplayName)) { return "display:" + (Normalize-Text $snap.DisplayName) }
    return ""
}

function Register-IdentityMatchOrStop {
    param(
        [string]$TargetKey,
        [bool]$EnforceUniqueIdentity,
        [object]$Identity,
        [string]$MatchedTerm,
        [string]$MatchedValue,
        [string]$RepoName,
        [string]$ParticipationType,
        [string]$ParticipationDate,
        [string]$PullRequestId,
        [string]$CommitId
    )

    if (-not $EnforceUniqueIdentity) { return }

    $identityKey = Get-IdentityUniqueKey -Identity $Identity
    if ([string]::IsNullOrWhiteSpace($identityKey)) { return }

    if ($null -eq $script:IdentityRegistry) { $script:IdentityRegistry = @{} }
    if (-not $script:IdentityRegistry.ContainsKey($TargetKey)) { $script:IdentityRegistry[$TargetKey] = @{} }

    $bucket = $script:IdentityRegistry[$TargetKey]

    if (-not $bucket.ContainsKey($identityKey)) {
        $snap = New-IdentitySnapshot -Identity $Identity
        $bucket[$identityKey] = [PSCustomObject]@{
            TargetKey         = $TargetKey
            IdentityKey       = $identityKey
            IdentityId        = $snap.Id
            IdentityDisplayName = $snap.DisplayName
            IdentityUniqueName = $snap.UniqueName
            IdentityEmail     = $snap.Email
            IdentityUrl       = $snap.Url
            IdentityDescriptor = $snap.Descriptor
            FirstMatchedTerm  = $MatchedTerm
            FirstMatchedValue = $MatchedValue
            FirstRepoName     = $RepoName
            FirstParticipationType = $ParticipationType
            FirstParticipationDate = $ParticipationDate
            FirstPullRequestId = $PullRequestId
            FirstCommitId     = $CommitId
        }
    }

    if ($bucket.Keys.Count -gt 1) {
        $duplicates = @($bucket.Values | Sort-Object IdentityDisplayName, IdentityEmail, IdentityId)
        $duplicates | Export-Csv -Path $script:DuplicateCsv -NoTypeInformation -Encoding UTF8

        Write-Host ""
        Write-Bad "DUPLICIDADE/AMBIGUIDADE DETECTADA NO TARGET: $TargetKey"
        Write-Host ""
        Write-Host "Esse target foi informado por name e bateu em mais de uma identidade real."
        Write-Host "Para evitar falso positivo, troque esse target no target-devs.json por email, id ou url."
        Write-Host ""
        Write-Host "CSV de duplicatas:"
        Write-Host $script:DuplicateCsv
        Write-Host ""
        Write-Host "Identidades encontradas:"
        foreach ($d in $duplicates) {
            Write-Host " - $($d.IdentityDisplayName) | $($d.IdentityEmail) | $($d.IdentityId)"
        }
        Write-Host ""
        exit 2
    }
}

function Initialize-IdentityRegistryFromExistingEvidence {
    param([string]$RawCsv, [object[]]$Targets)

    $script:IdentityRegistry = @{}
    if (-not (Test-Path $RawCsv)) { return }

    $targetMap = @{}
    foreach ($t in $Targets) { $targetMap[$t.Key] = $t }

    $rows = @()
    try { $rows = @(Import-Csv -Path $RawCsv -Encoding UTF8) } catch { return }

    foreach ($row in $rows) {
        if (-not $targetMap.ContainsKey($row.TargetKey)) { continue }
        $target = $targetMap[$row.TargetKey]
        if (-not [bool]$target.EnforceUniqueIdentity) { continue }

        $fakeIdentity = [PSCustomObject]@{
            id          = $row.IdentityId
            displayName = $row.IdentityDisplayName
            uniqueName  = $row.IdentityUniqueName
            email       = $row.IdentityEmail
            url         = $row.IdentityUrl
            descriptor  = $row.IdentityDescriptor
        }

        Register-IdentityMatchOrStop `
            -TargetKey $row.TargetKey `
            -EnforceUniqueIdentity $true `
            -Identity $fakeIdentity `
            -MatchedTerm $row.MatchedTerm `
            -MatchedValue $row.MatchedValue `
            -RepoName $row.RepoName `
            -ParticipationType $row.ParticipationType `
            -ParticipationDate $row.ParticipationDate `
            -PullRequestId $row.PullRequestId `
            -CommitId $row.CommitId
    }
}

function New-ParticipationRow {
    param(
        [string]$EvidenceKey,
        [object]$Match,
        [string]$RepoName,
        [string]$RepoId,
        [string]$RepoDefaultBranch,
        [string]$ParticipationType,
        [string]$ParticipationDate,
        [string]$DateSource,
        [string]$PullRequestId,
        [string]$PullRequestTitle,
        [string]$PullRequestStatus,
        [string]$PullRequestCreationDate,
        [string]$PullRequestClosedDate,
        [string]$CommentId,
        [string]$CommentPublishedDate,
        [string]$CommentLastUpdatedDate,
        [string]$CommentPreview,
        [string]$CommitId,
        [string]$CommitDate,
        [string]$CommitComment,
        [object]$Identity
    )

    Register-IdentityMatchOrStop `
        -TargetKey $Match.TargetKey `
        -EnforceUniqueIdentity ([bool]$Match.EnforceUniqueIdentity) `
        -Identity $Identity `
        -MatchedTerm $Match.MatchedTerm `
        -MatchedValue $Match.MatchedValue `
        -RepoName $RepoName `
        -ParticipationType $ParticipationType `
        -ParticipationDate $ParticipationDate `
        -PullRequestId $PullRequestId `
        -CommitId $CommitId

    $identitySnapshot = New-IdentitySnapshot -Identity $Identity

    return [PSCustomObject]@{
        EvidenceKey              = $EvidenceKey
        TargetKey                = $Match.TargetKey
        TargetType               = $Match.TargetType
        MatchedTerm              = $Match.MatchedTerm
        MatchedTermKind          = $Match.MatchedTermKind
        MatchedValue             = $Match.MatchedValue
        MatchedValueKind         = $Match.MatchedValueKind
        RepoName                 = $RepoName
        RepoId                   = $RepoId
        RepoDefaultBranch        = $RepoDefaultBranch
        ParticipationType        = $ParticipationType
        ParticipationDate        = $ParticipationDate
        DateSource               = $DateSource
        PullRequestId            = $PullRequestId
        PullRequestTitle         = $PullRequestTitle
        PullRequestStatus        = $PullRequestStatus
        PullRequestCreationDate  = $PullRequestCreationDate
        PullRequestClosedDate    = $PullRequestClosedDate
        CommentId                = $CommentId
        CommentPublishedDate     = $CommentPublishedDate
        CommentLastUpdatedDate   = $CommentLastUpdatedDate
        CommentPreview           = $CommentPreview
        CommitId                 = $CommitId
        CommitDate               = $CommitDate
        CommitComment            = $CommitComment
        IdentityId               = $identitySnapshot.Id
        IdentityDisplayName      = $identitySnapshot.DisplayName
        IdentityUniqueName       = $identitySnapshot.UniqueName
        IdentityEmail            = $identitySnapshot.Email
        IdentityUrl              = $identitySnapshot.Url
        IdentityDescriptor       = $identitySnapshot.Descriptor
    }
}

function Append-RowsCsv {
    param([string]$Path, [object[]]$Rows)
    if ($Rows.Count -eq 0) { return }
    if (Test-Path $Path) { $Rows | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8 -Append }
    else { $Rows | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8 }
}

function Get-PreviewText {
    param([string]$Text, [int]$MaxLength = 180)
    if ([string]::IsNullOrWhiteSpace($Text)) { return "" }
    $clean = $Text -replace "<[^>]+>", " "
    $clean = $clean -replace "\s+", " "
    $clean = $clean.Trim()
    if ($clean.Length -le $MaxLength) { return $clean }
    return $clean.Substring(0, $MaxLength) + "..."
}

function Read-ParticipationCsv {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return @() }
    try { return @(Import-Csv -Path $Path -Encoding UTF8) } catch { return @() }
}

function Get-FirstParticipationDate {
    param([object[]]$Rows)
    $dated = @($Rows | Where-Object { -not [string]::IsNullOrWhiteSpace($_.ParticipationDate) } | Sort-Object ParticipationDate)
    if ($dated.Count -eq 0) { return "" }
    return $dated[0].ParticipationDate
}

function Get-LastParticipationDate {
    param([object[]]$Rows)
    $dated = @($Rows | Where-Object { -not [string]::IsNullOrWhiteSpace($_.ParticipationDate) } | Sort-Object ParticipationDate -Descending)
    if ($dated.Count -eq 0) { return "" }
    return $dated[0].ParticipationDate
}

function Write-FinalCsvReports {
    param([string]$RawCsv, [string]$FinalHistoryCsv, [string]$SummaryByDevRepoCsv, [string]$SummaryByRepoCsv, [string]$SummaryByDevCsv)

    $rows = @(Read-ParticipationCsv -Path $RawCsv)
    $uniqueRows = @($rows | Group-Object EvidenceKey | ForEach-Object { $_.Group | Select-Object -First 1 } | Sort-Object TargetKey, RepoName, ParticipationDate, ParticipationType)

    if ($uniqueRows.Count -gt 0) { $uniqueRows | Export-Csv -Path $FinalHistoryCsv -NoTypeInformation -Encoding UTF8 }
    else {
        @([PSCustomObject]@{
            EvidenceKey=""; TargetKey=""; TargetType=""; MatchedTerm=""; MatchedTermKind=""; MatchedValue=""; MatchedValueKind=""; RepoName=""; RepoId=""; RepoDefaultBranch=""; ParticipationType=""; ParticipationDate=""; DateSource=""; PullRequestId=""; PullRequestTitle=""; PullRequestStatus=""; PullRequestCreationDate=""; PullRequestClosedDate=""; CommentId=""; CommentPublishedDate=""; CommentLastUpdatedDate=""; CommentPreview=""; CommitId=""; CommitDate=""; CommitComment=""; IdentityId=""; IdentityDisplayName=""; IdentityUniqueName=""; IdentityEmail=""; IdentityUrl=""; IdentityDescriptor=""
        }) | Select-Object -First 0 | Export-Csv -Path $FinalHistoryCsv -NoTypeInformation -Encoding UTF8
    }

    $summaryByDevRepo = @($uniqueRows | Group-Object TargetKey, RepoName | ForEach-Object {
        $groupRows = @($_.Group); $first = $groupRows | Select-Object -First 1
        [PSCustomObject]@{
            TargetKey          = $first.TargetKey
            TargetType         = $first.TargetType
            RepoName           = $first.RepoName
            RepoId             = $first.RepoId
            EvidenceCount      = $groupRows.Count
            ParticipationTypes = (@($groupRows | Select-Object -ExpandProperty ParticipationType -Unique | Sort-Object) -join "; ")
            FirstDate          = Get-FirstParticipationDate -Rows $groupRows
            LastDate           = Get-LastParticipationDate -Rows $groupRows
            PullRequests       = @($groupRows | Where-Object { -not [string]::IsNullOrWhiteSpace($_.PullRequestId) } | Select-Object -ExpandProperty PullRequestId -Unique).Count
            Commits            = @($groupRows | Where-Object { -not [string]::IsNullOrWhiteSpace($_.CommitId) } | Select-Object -ExpandProperty CommitId -Unique).Count
            Comments           = @($groupRows | Where-Object { $_.ParticipationType -eq "PR_COMMENT" }).Count
        }
    } | Sort-Object TargetKey, RepoName)

    $summaryByRepo = @($uniqueRows | Group-Object RepoName | ForEach-Object {
        $groupRows = @($_.Group); $first = $groupRows | Select-Object -First 1
        [PSCustomObject]@{
            RepoName           = $first.RepoName
            RepoId             = $first.RepoId
            EvidenceCount      = $groupRows.Count
            DevsMatched        = @($groupRows | Select-Object -ExpandProperty TargetKey -Unique).Count
            Devs               = (@($groupRows | Select-Object -ExpandProperty TargetKey -Unique | Sort-Object) -join "; ")
            ParticipationTypes = (@($groupRows | Select-Object -ExpandProperty ParticipationType -Unique | Sort-Object) -join "; ")
            FirstDate          = Get-FirstParticipationDate -Rows $groupRows
            LastDate           = Get-LastParticipationDate -Rows $groupRows
        }
    } | Sort-Object RepoName)

    $summaryByDev = @($uniqueRows | Group-Object TargetKey | ForEach-Object {
        $groupRows = @($_.Group); $first = $groupRows | Select-Object -First 1
        [PSCustomObject]@{
            TargetKey          = $first.TargetKey
            TargetType         = $first.TargetType
            EvidenceCount      = $groupRows.Count
            ReposMatched       = @($groupRows | Select-Object -ExpandProperty RepoName -Unique).Count
            Repos              = (@($groupRows | Select-Object -ExpandProperty RepoName -Unique | Sort-Object) -join "; ")
            ParticipationTypes = (@($groupRows | Select-Object -ExpandProperty ParticipationType -Unique | Sort-Object) -join "; ")
            FirstDate          = Get-FirstParticipationDate -Rows $groupRows
            LastDate           = Get-LastParticipationDate -Rows $groupRows
        }
    } | Sort-Object TargetKey)

    $summaryByDevRepo | Export-Csv -Path $SummaryByDevRepoCsv -NoTypeInformation -Encoding UTF8
    $summaryByRepo    | Export-Csv -Path $SummaryByRepoCsv -NoTypeInformation -Encoding UTF8
    $summaryByDev     | Export-Csv -Path $SummaryByDevCsv -NoTypeInformation -Encoding UTF8

    return [PSCustomObject]@{ HistoryRows = $uniqueRows.Count; DevRepoRows = $summaryByDevRepo.Count; RepoRows = $summaryByRepo.Count; DevRows = $summaryByDev.Count }
}

# Entrada sem hardcode.
if ([string]::IsNullOrWhiteSpace($Organization)) { $Organization = Read-Host "Cole o nome da Organization do Azure DevOps" }
if ([string]::IsNullOrWhiteSpace($Project)) { $Project = Read-Host "Cole o nome do Project do Azure DevOps" }
if ([string]::IsNullOrWhiteSpace($Organization) -or [string]::IsNullOrWhiteSpace($Project)) { Write-Bad "Organization e Project são obrigatórios."; exit 1 }

New-Item -ItemType Directory -Force -Path $DestRoot | Out-Null
$auditDir = Join-Path $DestRoot "_dev_participation_audit"
New-Item -ItemType Directory -Force -Path $auditDir | Out-Null

if ([string]::IsNullOrWhiteSpace($TargetsJsonPath)) { $TargetsJsonPath = Join-Path $DestRoot "target-devs.json" }
if (-not (Test-Path $TargetsJsonPath)) {
    New-TargetTemplate -Path $TargetsJsonPath
    Write-Warn2 "Arquivo de devs-alvo criado."
    Write-Host ""
    Write-Host "Edite este arquivo usando somente name, email, id ou url:"
    Write-Host $TargetsJsonPath
    Write-Host ""
    try { Start-Process notepad.exe $TargetsJsonPath } catch {}
    exit 0
}

$targetsRawText = Get-Content -Path $TargetsJsonPath -Raw -Encoding UTF8
$targetsHash = Get-ShortHash $targetsRawText
$scanPrComments = -not [bool]$SkipPrComments
$contextHash = Get-ContextHash -Organization $Organization -Project $Project -TargetsHash $targetsHash -Mode $NameMatchMode -ScanPrComments $scanPrComments -ScanReviewersList ([bool]$ScanReviewersList) -ScanCommits ([bool]$ScanCommits)

try { $targets = @(Load-TargetSpecs -Path $TargetsJsonPath) }
catch { Write-Bad $_.Exception.Message; exit 1 }

if ($targets.Count -eq 0) { Write-Bad "Nenhum dev-alvo válido encontrado em: $TargetsJsonPath"; exit 1 }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$stateFile = Join-Path $auditDir "scan-state-$targetsHash.json"
$rawEvidenceCsv = Join-Path $auditDir "participation-raw-$targetsHash.csv"
$duplicateCsv = Join-Path $auditDir "target-duplicates-$stamp.csv"
$script:DuplicateCsv = $duplicateCsv
$script:IdentityRegistry = @{}

$logFile = Join-Path $auditDir "scan-log-$stamp.txt"
$failCsv = Join-Path $auditDir "scan-failures-$stamp.csv"
$catalogCsv = Join-Path $auditDir "repos-catalog-$stamp.csv"
$accessibleCsv = Join-Path $auditDir "repos-accessible-$stamp.csv"
$disabledCsv = Join-Path $auditDir "repos-disabled-$stamp.csv"
$finalHistoryCsv = Join-Path $auditDir "participation-history-$stamp.csv"
$summaryByDevRepoCsv = Join-Path $auditDir "summary-by-dev-repo-$stamp.csv"
$summaryByRepoCsv = Join-Path $auditDir "summary-by-repo-$stamp.csv"
$summaryByDevCsv = Join-Path $auditDir "summary-by-dev-$stamp.csv"

if ($ResetState) {
    Remove-Item $stateFile -Force -ErrorAction SilentlyContinue
    Remove-Item $rawEvidenceCsv -Force -ErrorAction SilentlyContinue
    Write-Warn2 "Estado e evidências anteriores removidos para este conjunto de devs."
}

@([PSCustomObject]@{ Repo=""; Operation=""; Kind=""; Message="" }) | Select-Object -First 0 | Export-Csv -Path $failCsv -NoTypeInformation -Encoding UTF8

Initialize-IdentityRegistryFromExistingEvidence -RawCsv $rawEvidenceCsv -Targets $targets

Write-Info "Destino: $DestRoot"
Write-Info "Auditoria: $auditDir"
Write-Info "Targets: $TargetsJsonPath"
Write-Info "Estado: $stateFile"
Write-Info "CSV bruto incremental: $rawEvidenceCsv"
Write-Host ""

Write-Info "Devs-alvo carregados: $($targets.Count)"
foreach ($target in $targets) {
    $ambiguity = if ($target.EnforceUniqueIdentity) { "name/ambíguo: para se bater em mais de uma identidade, o script para" } else { "identificador exato" }
    Write-Host " - $($target.Key) [$($target.TargetType)] $ambiguity"
}
Write-Host ""

if ((-not $NoResume) -and (Test-Path $stateFile)) {
    try {
        $state = Get-Content $stateFile -Raw -Encoding UTF8 | ConvertFrom-Json
        $state = Repair-StateObject $state $contextHash
        if ($state.ContextHash -ne $contextHash) {
            Write-Warn2 "Estado existe, mas é de outro contexto. Criando estado novo."
            $state = New-StateObject $contextHash
        }
        else {
            Write-Warn2 "Retomada automática ativa."
            Write-Host "Último repo concluído: $($state.LastCompletedRepoName)"
            Write-Host ""
        }
    }
    catch {
        Write-Warn2 "Não consegui ler/reparar estado. Criando estado novo."
        $state = New-StateObject $contextHash
    }
}
else { $state = New-StateObject $contextHash }

Save-State -StateFile $stateFile -State $state -ContextHash $contextHash

$patSecure = Read-Host "Cole seu PAT do Azure DevOps" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($patSecure)
try { $pat = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
if ([string]::IsNullOrWhiteSpace($pat)) { Write-Bad "PAT vazio. Encerrando."; exit 1 }

$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
$headers = @{ Authorization = "Basic $auth" }
$encodedProject = [System.Uri]::EscapeDataString($Project)
$baseApi = "https://dev.azure.com/$Organization/$encodedProject/_apis"

Write-Info "Buscando lista de repositórios no Azure DevOps..."
Write-Host ""

try {
    $reposUrl = "$baseApi/git/repositories?api-version=7.1"
    $visibleRepos = @(Invoke-AdoGetPagedValues -Url $reposUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -OperationName "LIST_REPOSITORIES")
}
catch {
    $raw = $_.Exception.Message; $kind = Get-ErrorKind $raw
    Write-Bad "Não consegui listar os repositórios."
    Write-Host "Tipo: $kind"
    Write-Host "Diagnóstico: $(Explain-ErrorKind $kind)"
    Write-Host "Erro: $raw"
    Add-Failure -CsvFile $failCsv -Repo "__API_LIST__" -Operation "LIST_REPOSITORIES" -Kind $kind -Message $raw
    exit 1
}

$visibleRepos = @($visibleRepos | Sort-Object name)
if ($visibleRepos.Count -eq 0) { Write-Warn2 "Nenhum repositório encontrado."; exit 0 }

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

if ($accessibleRepos.Count -eq 0) { Write-Warn2 "Nenhum repositório acessível/ativo para varrer."; exit 0 }

$resumePoint = ""
if ((-not $NoResume) -and (-not [string]::IsNullOrWhiteSpace($state.LastCompletedRepoName))) {
    $resumePoint = $state.LastCompletedRepoName
    Write-Warn2 "Retomando automaticamente depois de: $resumePoint"
}

$reposToScan = $accessibleRepos
if (-not [string]::IsNullOrWhiteSpace($resumePoint)) {
    $reposToScan = @($accessibleRepos | Where-Object { [string]::Compare($_.name, $resumePoint, $true) -gt 0 })
}

if ($reposToScan.Count -eq 0) {
    Write-Ok "Nada pendente pelo estado atual. Gerando CSVs finais com evidências existentes."
    $stats = Write-FinalCsvReports -RawCsv $rawEvidenceCsv -FinalHistoryCsv $finalHistoryCsv -SummaryByDevRepoCsv $summaryByDevRepoCsv -SummaryByRepoCsv $summaryByRepoCsv -SummaryByDevCsv $summaryByDevCsv
    Write-Host "CSV principal:"
    Write-Host $finalHistoryCsv
    if ($OpenCsv) { Start-Process notepad.exe $finalHistoryCsv }
    exit 0
}

Write-Info "Repos acessíveis para varrer nesta execução: $($reposToScan.Count)"
Write-Info "Modo de match de nome: $NameMatchMode"
Write-Info "Scan comentários de PR: $scanPrComments"
Write-Info "Scan reviewers listados: $([bool]$ScanReviewersList)"
Write-Info "Scan commits: $([bool]$ScanCommits)"
Write-Host ""

$accessibleRepoNames = @($accessibleRepos | ForEach-Object { $_.name })
$totalEvidenceThisRun = 0
$failCount = 0

foreach ($repo in $reposToScan) {
    if (Test-RepoDisabled $repo) { continue }

    $repoId = Get-SafeValue -Object $repo -PropertyName "id"
    $repoName = Get-SafeValue -Object $repo -PropertyName "name"
    $repoDefaultBranch = Get-SafeValue -Object $repo -PropertyName "defaultBranch"
    $repoIndex = [Array]::IndexOf($accessibleRepoNames, $repoName) + 1

    Write-Host ""
    Write-Info "[$repoIndex/$($accessibleRepos.Count) acessíveis] Varrendo: $repoName"

    $state.CurrentRepoName = $repoName
    $state.CurrentRepoIndex = $repoIndex
    Save-State -StateFile $stateFile -State $state -ContextHash $contextHash
    Add-Log -LogFile $logFile -Message "START repo=$repoName id=$repoId"

    $repoRows = New-Object System.Collections.Generic.List[object]
    $completedStatus = "SCANNED"

    try {
        $prsUrl = "$baseApi/git/repositories/$repoId/pullrequests?searchCriteria.status=all&%24top=$PrTop&api-version=7.1"
        $prs = @(Invoke-AdoGetPagedValues -Url $prsUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -OperationName "LIST_PULL_REQUESTS")

        foreach ($pr in $prs) {
            $prId = Get-SafeValue -Object $pr -PropertyName "pullRequestId"
            $prTitle = Get-SafeValue -Object $pr -PropertyName "title"
            $prStatus = Get-SafeValue -Object $pr -PropertyName "status"
            $prCreationDate = Get-SafeValue -Object $pr -PropertyName "creationDate"
            $prClosedDate = Get-SafeValue -Object $pr -PropertyName "closedDate"

            # 1. PR criado pelo dev.
            $createdByMatches = @(Find-IdentityMatches -Targets $targets -Identity $pr.createdBy -NameMatchMode $NameMatchMode)
            foreach ($match in $createdByMatches) {
                $evidenceKey = "$repoId|PR_CREATED|$prId|$($match.TargetKey)|$($match.MatchedTerm)"
                $repoRows.Add((New-ParticipationRow -EvidenceKey $evidenceKey -Match $match -RepoName $repoName -RepoId $repoId -RepoDefaultBranch $repoDefaultBranch -ParticipationType "PR_CREATED" -ParticipationDate $prCreationDate -DateSource "pullRequest.creationDate" -PullRequestId $prId -PullRequestTitle $prTitle -PullRequestStatus $prStatus -PullRequestCreationDate $prCreationDate -PullRequestClosedDate $prClosedDate -CommentId "" -CommentPublishedDate "" -CommentLastUpdatedDate "" -CommentPreview "" -CommitId "" -CommitDate "" -CommitComment "" -Identity $pr.createdBy))
            }

            # 2. Reviewers listados.
            if ($ScanReviewersList -and $null -ne $pr.PSObject.Properties["reviewers"] -and $null -ne $pr.reviewers) {
                foreach ($reviewer in @($pr.reviewers)) {
                    $reviewerMatches = @(Find-IdentityMatches -Targets $targets -Identity $reviewer -NameMatchMode $NameMatchMode)
                    foreach ($match in $reviewerMatches) {
                        $reviewerId = Get-SafeValue -Object $reviewer -PropertyName "id"
                        $evidenceKey = "$repoId|PR_REVIEWER_LISTED|$prId|$reviewerId|$($match.TargetKey)|$($match.MatchedTerm)"
                        $repoRows.Add((New-ParticipationRow -EvidenceKey $evidenceKey -Match $match -RepoName $repoName -RepoId $repoId -RepoDefaultBranch $repoDefaultBranch -ParticipationType "PR_REVIEWER_LISTED" -ParticipationDate "" -DateSource "no_exact_reviewer_date_in_pr_list" -PullRequestId $prId -PullRequestTitle $prTitle -PullRequestStatus $prStatus -PullRequestCreationDate $prCreationDate -PullRequestClosedDate $prClosedDate -CommentId "" -CommentPublishedDate "" -CommentLastUpdatedDate "" -CommentPreview "" -CommitId "" -CommitDate "" -CommitComment "" -Identity $reviewer))
                    }
                }
            }

            # 3. Comentários em PR com data real.
            if ($scanPrComments) {
                try {
                    $threadsUrl = "$baseApi/git/repositories/$repoId/pullRequests/$prId/threads?api-version=7.1"
                    $threads = @(Invoke-AdoGetPagedValues -Url $threadsUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -OperationName "LIST_PR_THREADS")

                    foreach ($thread in $threads) {
                        if ($null -eq $thread.PSObject.Properties["comments"] -or $null -eq $thread.comments) { continue }
                        foreach ($comment in @($thread.comments)) {
                            if ($null -eq $comment.author) { continue }
                            $commentMatches = @(Find-IdentityMatches -Targets $targets -Identity $comment.author -NameMatchMode $NameMatchMode)
                            foreach ($match in $commentMatches) {
                                $commentId = Get-SafeValue -Object $comment -PropertyName "id"
                                $publishedDate = Get-SafeValue -Object $comment -PropertyName "publishedDate"
                                $lastUpdatedDate = Get-SafeValue -Object $comment -PropertyName "lastUpdatedDate"
                                $preview = Get-PreviewText -Text (Get-SafeValue -Object $comment -PropertyName "content")
                                $evidenceKey = "$repoId|PR_COMMENT|$prId|$commentId|$($match.TargetKey)|$($match.MatchedTerm)"
                                $repoRows.Add((New-ParticipationRow -EvidenceKey $evidenceKey -Match $match -RepoName $repoName -RepoId $repoId -RepoDefaultBranch $repoDefaultBranch -ParticipationType "PR_COMMENT" -ParticipationDate $publishedDate -DateSource "comment.publishedDate" -PullRequestId $prId -PullRequestTitle $prTitle -PullRequestStatus $prStatus -PullRequestCreationDate $prCreationDate -PullRequestClosedDate $prClosedDate -CommentId $commentId -CommentPublishedDate $publishedDate -CommentLastUpdatedDate $lastUpdatedDate -CommentPreview $preview -CommitId "" -CommitDate "" -CommitComment "" -Identity $comment.author))
                            }
                        }
                    }
                }
                catch {
                    $raw = $_.Exception.Message; $kind = Get-ErrorKind $raw
                    Add-Failure -CsvFile $failCsv -Repo $repoName -Operation "LIST_PR_THREADS_PR_$prId" -Kind $kind -Message $raw
                    Add-Log -LogFile $logFile -Message "FAIL THREADS repo=$repoName pr=$prId kind=$kind message=$raw"
                }
            }
        }
    }
    catch {
        $raw = $_.Exception.Message; $kind = Get-ErrorKind $raw
        Write-Bad "Falha ao varrer PRs. Pulando repo."
        Write-Host "Tipo: $kind"
        Write-Host "Diagnóstico: $(Explain-ErrorKind $kind)"
        Write-Host "Erro: $raw"
        Add-Failure -CsvFile $failCsv -Repo $repoName -Operation "LIST_PULL_REQUESTS" -Kind $kind -Message $raw
        Add-Log -LogFile $logFile -Message "FAIL PR repo=$repoName kind=$kind message=$raw"
        $completedStatus = "PR_SCAN_FAILED_$kind"
        $failCount++
    }

    # 4. Commits, opcional.
    if ($ScanCommits) {
        try {
            $commitsUrl = "$baseApi/git/repositories/$repoId/commits?searchCriteria.%24top=$CommitsTop&api-version=7.1"
            $commits = @(Invoke-AdoGetPagedValues -Url $commitsUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -OperationName "LIST_COMMITS")

            foreach ($commit in $commits) {
                $commitId = Get-SafeValue -Object $commit -PropertyName "commitId"
                $commitComment = Get-PreviewText -Text (Get-SafeValue -Object $commit -PropertyName "comment") -MaxLength 220

                foreach ($role in @("author", "committer")) {
                    $person = $commit.$role
                    if ($null -eq $person) { continue }
                    $fakeIdentity = New-CommitIdentity -CommitPerson $person
                    $commitMatches = @(Find-IdentityMatches -Targets $targets -Identity $fakeIdentity -NameMatchMode $NameMatchMode)

                    foreach ($match in $commitMatches) {
                        $commitDate = Get-SafeValue -Object $person -PropertyName "date"
                        $participationType = if ($role -eq "author") { "COMMIT_AUTHOR" } else { "COMMIT_COMMITTER" }
                        $evidenceKey = "$repoId|$participationType|$commitId|$($match.TargetKey)|$($match.MatchedTerm)"
                        $repoRows.Add((New-ParticipationRow -EvidenceKey $evidenceKey -Match $match -RepoName $repoName -RepoId $repoId -RepoDefaultBranch $repoDefaultBranch -ParticipationType $participationType -ParticipationDate $commitDate -DateSource "commit.$role.date" -PullRequestId "" -PullRequestTitle "" -PullRequestStatus "" -PullRequestCreationDate "" -PullRequestClosedDate "" -CommentId "" -CommentPublishedDate "" -CommentLastUpdatedDate "" -CommentPreview "" -CommitId $commitId -CommitDate $commitDate -CommitComment $commitComment -Identity $fakeIdentity))
                    }
                }
            }
        }
        catch {
            $raw = $_.Exception.Message; $kind = Get-ErrorKind $raw
            Write-Bad "Falha ao varrer commits. Pulando commits deste repo."
            Write-Host "Tipo: $kind"
            Write-Host "Diagnóstico: $(Explain-ErrorKind $kind)"
            Write-Host "Erro: $raw"
            Add-Failure -CsvFile $failCsv -Repo $repoName -Operation "LIST_COMMITS" -Kind $kind -Message $raw
            Add-Log -LogFile $logFile -Message "FAIL COMMITS repo=$repoName kind=$kind message=$raw"
            $completedStatus = "COMMIT_SCAN_FAILED_$kind"
            $failCount++
        }
    }

    $repoEvidenceCount = $repoRows.Count
    if ($repoEvidenceCount -gt 0) {
        Append-RowsCsv -Path $rawEvidenceCsv -Rows @($repoRows)
        Write-Ok "Participações encontradas neste repo: $repoEvidenceCount"
    }
    else { Write-Info "Nenhuma participação encontrada neste repo." }

    $totalEvidenceThisRun += $repoEvidenceCount
    $state.CurrentRepoName = ""
    $state.CurrentRepoIndex = 0
    $state.LastCompletedRepoName = $repoName
    $state.LastCompletedRepoIndex = $repoIndex
    $state.LastCompletedRepoStatus = $completedStatus
    $state.TotalEvidence = $state.TotalEvidence + $repoEvidenceCount
    Save-State -StateFile $stateFile -State $state -ContextHash $contextHash
    Add-Log -LogFile $logFile -Message "END repo=$repoName evidence=$repoEvidenceCount status=$completedStatus"
}

$stats = Write-FinalCsvReports -RawCsv $rawEvidenceCsv -FinalHistoryCsv $finalHistoryCsv -SummaryByDevRepoCsv $summaryByDevRepoCsv -SummaryByRepoCsv $summaryByRepoCsv -SummaryByDevCsv $summaryByDevCsv

Write-Host ""
Write-Host "========================================"
Write-Host "Finalizado"
Write-Host "========================================"
Write-Host "Visíveis pela API:        $($visibleRepos.Count)"
Write-Host "Acessíveis/ativos:        $($accessibleRepos.Count)"
Write-Host "Disabled/desabilitados:   $($disabledRepos.Count)"
Write-Host ""
Write-Host "Participações nesta execução: $totalEvidenceThisRun"
Write-Host "Participações únicas totais:  $($stats.HistoryRows)"
Write-Host "Falhas:                       $failCount"
Write-Host ""
Write-Host "CSV principal, histórico completo:"
Write-Host $finalHistoryCsv
Write-Host ""
Write-Host "Resumo por dev + repo:"
Write-Host $summaryByDevRepoCsv
Write-Host ""
Write-Host "Resumo por repo:"
Write-Host $summaryByRepoCsv
Write-Host ""
Write-Host "Resumo por dev:"
Write-Host $summaryByDevCsv
Write-Host ""
Write-Host "CSV bruto incremental:"
Write-Host $rawEvidenceCsv
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
Write-Host "Falhas:"
Write-Host $failCsv
Write-Host ""
Write-Host "Log:"
Write-Host $logFile
Write-Host ""

if ($OpenCsv) { Start-Process notepad.exe $finalHistoryCsv }
if ($failCount -gt 0) { Write-Warn2 "Houve falhas em alguns repos/PRs, mas a varredura continuou." }
else { Write-Ok "Varredura concluída sem falhas registradas." }
