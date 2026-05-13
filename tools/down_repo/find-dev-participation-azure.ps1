param(
    [string]$Organization = "",
    [string]$Project = "",

    [string]$TargetsJsonPath = "",
    [string]$OutputCsv = "",

    [ValidateSet("Contains", "Exact")]
    [string]$NameMatchMode = "Contains",

    [int]$PrTop = 1000,
    [int]$CommitsTop = 1000,

    [switch]$SkipComments,
    [switch]$SkipReviewers,
    [switch]$SkipCommits,

    [int]$ApiTimeoutSeconds = 120
)

$ErrorActionPreference = "Stop"

# ============================================================
# Console
# ============================================================

function Write-Info {
    param([string]$Message)
    Write-Host ("[INFO] {0}" -f $Message) -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host ("[OK]   {0}" -f $Message) -ForegroundColor Green
}

function Write-Warn2 {
    param([string]$Message)
    Write-Host ("[WARN] {0}" -f $Message) -ForegroundColor Yellow
}

function Write-Bad {
    param([string]$Message)
    Write-Host ("[ERRO] {0}" -f $Message) -ForegroundColor Red
}

function Write-MatchFound {
    param(
        [string]$Pessoa,
        [string]$Tipo,
        [string]$Repo,
        [string]$Data,
        [string]$Extra
    )

    if ([string]::IsNullOrWhiteSpace($Data)) {
        $dataText = "sem-data"
    }
    else {
        $dataText = $Data
    }

    if ([string]::IsNullOrWhiteSpace($Extra)) {
        Write-Host ("[ACHOU] {0} | {1} | {2} | {3}" -f $Pessoa, $Tipo, $Repo, $dataText) -ForegroundColor Green
    }
    else {
        Write-Host ("[ACHOU] {0} | {1} | {2} | {3} | {4}" -f $Pessoa, $Tipo, $Repo, $dataText, $Extra) -ForegroundColor Green
    }
}

# ============================================================
# Utilitários
# ============================================================

function Get-PropValue {
    param(
        [object]$Obj,
        [string]$Name
    )

    if ($null -eq $Obj) {
        return ""
    }

    $prop = $Obj.PSObject.Properties[$Name]

    if ($null -eq $prop) {
        return ""
    }

    if ($null -eq $prop.Value) {
        return ""
    }

    return [string]$prop.Value
}

function Test-HasProp {
    param(
        [object]$Obj,
        [string]$Name
    )

    if ($null -eq $Obj) {
        return $false
    }

    return ($null -ne $Obj.PSObject.Properties[$Name])
}

function Normalize-Text {
    param([string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return ""
    }

    $s = $Text.Trim().ToLowerInvariant()

    $s = $s -replace "[áàâãäå]", "a"
    $s = $s -replace "[éèêë]", "e"
    $s = $s -replace "[íìîï]", "i"
    $s = $s -replace "[óòôõö]", "o"
    $s = $s -replace "[úùûü]", "u"
    $s = $s -replace "[ç]", "c"
    $s = $s -replace "\s+", " "

    return $s.Trim()
}

function Get-Preview {
    param(
        [string]$Text,
        [int]$Max = 180
    )

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return ""
    }

    $clean = $Text -replace "<[^>]+>", " "
    $clean = $clean -replace "\s+", " "
    $clean = $clean.Trim()

    if ($clean.Length -le $Max) {
        return $clean
    }

    return $clean.Substring(0, $Max) + "..."
}

# ============================================================
# target-devs.json
# ============================================================

function New-TargetTemplate {
    param([string]$Path)

    $template = @'
[
  { "email": "dev1@empresa.com" },
  { "email": "dev2@empresa.com" },
  { "email": "dev3@empresa.com" }
]
'@

    $template | Set-Content -Path $Path -Encoding UTF8
}

function Load-Targets {
    param([string]$Path)

    $raw = Get-Content -Path $Path -Raw -Encoding UTF8

    if ([string]::IsNullOrWhiteSpace($raw)) {
        throw ("Arquivo vazio: {0}" -f $Path)
    }

    $parsed = $raw | ConvertFrom-Json

    if ((-not ($parsed -is [System.Array])) -and (Test-HasProp -Obj $parsed -Name "targets")) {
        $items = @($parsed.targets)
    }
    elseif ((-not ($parsed -is [System.Array])) -and (Test-HasProp -Obj $parsed -Name "devs")) {
        $items = @($parsed.devs)
    }
    else {
        $items = @($parsed)
    }

    $targets = @()

    foreach ($item in $items) {
        if ($null -eq $item) {
            continue
        }

        $name = ""
        $email = ""
        $id = ""
        $url = ""

        if ($item -is [string]) {
            $rawItem = ([string]$item).Trim()

            if ($rawItem -match "^https?://") {
                $url = $rawItem
            }
            elseif ($rawItem -match "@") {
                $email = $rawItem
            }
            elseif ($rawItem -match "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$") {
                $id = $rawItem
            }
            else {
                $name = $rawItem
            }
        }
        else {
            $name = Get-PropValue -Obj $item -Name "name"

            if ([string]::IsNullOrWhiteSpace($name)) {
                $name = Get-PropValue -Obj $item -Name "displayName"
            }

            $email = Get-PropValue -Obj $item -Name "email"

            if ([string]::IsNullOrWhiteSpace($email)) {
                $email = Get-PropValue -Obj $item -Name "uniqueName"
            }

            $id = Get-PropValue -Obj $item -Name "id"
            $url = Get-PropValue -Obj $item -Name "url"
        }

        $kind = ""
        $term = ""
        $label = ""
        $extractedId = ""

        if (-not [string]::IsNullOrWhiteSpace($email)) {
            $kind = "email"
            $term = $email.Trim()

            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $label = $name.Trim()
            }
            else {
                $label = $term
            }
        }
        elseif (-not [string]::IsNullOrWhiteSpace($id)) {
            $kind = "id"
            $term = $id.Trim()

            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $label = $name.Trim()
            }
            else {
                $label = $term
            }
        }
        elseif (-not [string]::IsNullOrWhiteSpace($url)) {
            $kind = "url"
            $term = $url.Trim()

            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $label = $name.Trim()
            }
            else {
                $label = $term
            }

            if ($term -match "([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})") {
                $extractedId = $Matches[1]
            }
        }
        elseif (-not [string]::IsNullOrWhiteSpace($name)) {
            $kind = "name"
            $term = $name.Trim()
            $label = $term
        }

        if ([string]::IsNullOrWhiteSpace($term)) {
            continue
        }

        $targets += ,[PSCustomObject]@{
            Label = $label
            Kind = $kind
            Term = $term
            NormalizedTerm = Normalize-Text -Text $term
            ExtractedId = $extractedId
        }
    }

    return $targets
}

# ============================================================
# Match de identidade
# ============================================================

function Get-IdentityValues {
    param([object]$Identity)

    if ($null -eq $Identity) {
        return @()
    }

    $values = @()

    foreach ($propName in @("id", "displayName", "uniqueName", "email", "descriptor", "url")) {
        $value = Get-PropValue -Obj $Identity -Name $propName

        if (-not [string]::IsNullOrWhiteSpace($value)) {
            $values += ,$value
        }
    }

    return @($values | Select-Object -Unique)
}

function Get-IdentityKey {
    param([object]$Identity)

    if ($null -eq $Identity) {
        return ""
    }

    $email = Get-PropValue -Obj $Identity -Name "email"

    if ([string]::IsNullOrWhiteSpace($email)) {
        $email = Get-PropValue -Obj $Identity -Name "uniqueName"
    }

    if (-not [string]::IsNullOrWhiteSpace($email)) {
        return ("email:{0}" -f (Normalize-Text -Text $email))
    }

    $id = Get-PropValue -Obj $Identity -Name "id"

    if (-not [string]::IsNullOrWhiteSpace($id)) {
        return ("id:{0}" -f (Normalize-Text -Text $id))
    }

    $displayName = Get-PropValue -Obj $Identity -Name "displayName"

    if (-not [string]::IsNullOrWhiteSpace($displayName)) {
        return ("name:{0}" -f (Normalize-Text -Text $displayName))
    }

    return ""
}

function Find-Matches {
    param(
        [object[]]$Targets,
        [object]$Identity,
        [string]$NameMatchMode
    )

    $values = @(Get-IdentityValues -Identity $Identity)

    if ($values.Count -eq 0) {
        return @()
    }

    $matches = @()

    foreach ($target in $Targets) {
        foreach ($value in $values) {
            $normalizedValue = Normalize-Text -Text $value
            $isMatch = $false

            if ($target.Kind -eq "email" -or $target.Kind -eq "id" -or $target.Kind -eq "url") {
                $isMatch = ($normalizedValue -eq $target.NormalizedTerm)

                if ((-not $isMatch) -and $target.Kind -eq "url" -and -not [string]::IsNullOrWhiteSpace($target.ExtractedId)) {
                    $isMatch = ($normalizedValue -eq (Normalize-Text -Text $target.ExtractedId))
                }
            }
            else {
                if ($NameMatchMode -eq "Exact") {
                    $isMatch = ($normalizedValue -eq $target.NormalizedTerm)
                }
                else {
                    $isMatch = (
                        $normalizedValue.Contains($target.NormalizedTerm) -or
                        $target.NormalizedTerm.Contains($normalizedValue)
                    )
                }
            }

            if ($isMatch) {
                $matches += ,[PSCustomObject]@{
                    Pessoa = $target.Label
                    MatchBy = $target.Kind
                    TermoProcurado = $target.Term
                    ValorEncontrado = $value
                }
            }
        }
    }

    return $matches
}

function New-CommitIdentity {
    param([object]$Person)

    return [PSCustomObject]@{
        id = ""
        displayName = Get-PropValue -Obj $Person -Name "name"
        uniqueName = Get-PropValue -Obj $Person -Name "email"
        email = Get-PropValue -Obj $Person -Name "email"
        descriptor = ""
        url = ""
    }
}

function Assert-NameIsNotAmbiguous {
    param(
        [object]$Match,
        [object]$Identity,
        [hashtable]$NameMap
    )

    if ($Match.MatchBy -ne "name") {
        return
    }

    $identityKey = Get-IdentityKey -Identity $Identity

    if ([string]::IsNullOrWhiteSpace($identityKey)) {
        return
    }

    if (-not $NameMap.ContainsKey($Match.Pessoa)) {
        $NameMap[$Match.Pessoa] = @{}
    }

    $bucket = $NameMap[$Match.Pessoa]

    if (-not $bucket.ContainsKey($identityKey)) {
        $displayName = Get-PropValue -Obj $Identity -Name "displayName"
        $uniqueName = Get-PropValue -Obj $Identity -Name "uniqueName"
        $id = Get-PropValue -Obj $Identity -Name "id"

        $bucket[$identityKey] = [PSCustomObject]@{
            IdentityKey = $identityKey
            DisplayName = $displayName
            UniqueName = $uniqueName
            Id = $id
        }
    }

    if ($bucket.Keys.Count -gt 1) {
        Write-Bad ("Nome ambíguo: {0}" -f $Match.Pessoa)
        Write-Host ""
        Write-Host "Esse nome bateu em mais de uma identidade. Troque no target-devs.json por email, id ou url."
        Write-Host ""
        Write-Host "Identidades encontradas:"

        foreach ($key in $bucket.Keys) {
            $x = $bucket[$key]
            Write-Host (" - {0} | {1} | {2}" -f $x.DisplayName, $x.UniqueName, $x.Id)
        }

        exit 2
    }
}

# ============================================================
# HTTP Azure DevOps
# ============================================================

function Get-HeaderValue {
    param(
        [object]$Headers,
        [string]$Name
    )

    if ($null -eq $Headers) {
        return ""
    }

    try {
        foreach ($key in $Headers.Keys) {
            if (([string]$key).ToLowerInvariant() -eq $Name.ToLowerInvariant()) {
                $value = $Headers[$key]

                if ($null -eq $value) {
                    return ""
                }

                if ($value -is [System.Array]) {
                    if ($value.Count -gt 0) {
                        return [string]$value[0]
                    }

                    return ""
                }

                return [string]$value
            }
        }
    }
    catch {
        return ""
    }

    return ""
}

function Add-QueryParameter {
    param(
        [string]$Url,
        [string]$Name,
        [string]$Value
    )

    $encodedName = [System.Uri]::EscapeDataString($Name)
    $encodedValue = [System.Uri]::EscapeDataString($Value)

    if ($Url.Contains("?")) {
        return ("{0}&{1}={2}" -f $Url, $encodedName, $encodedValue)
    }

    return ("{0}?{1}={2}" -f $Url, $encodedName, $encodedValue)
}

function Invoke-AdoPaged {
    param(
        [string]$Url,
        [hashtable]$Headers,
        [int]$TimeoutSeconds,
        [string]$Operation
    )

    $items = @()
    $continuationToken = ""

    do {
        $actualUrl = $Url

        if (-not [string]::IsNullOrWhiteSpace($continuationToken)) {
            $actualUrl = Add-QueryParameter -Url $Url -Name "continuationToken" -Value $continuationToken
        }

        try {
            $response = Invoke-WebRequest `
                -Uri $actualUrl `
                -Headers $Headers `
                -Method Get `
                -TimeoutSec $TimeoutSeconds `
                -UseBasicParsing

            $content = [string]$response.Content

            if (-not [string]::IsNullOrWhiteSpace($content)) {
                $json = $content | ConvertFrom-Json

                if ($null -ne $json) {
                    if (Test-HasProp -Obj $json -Name "value") {
                        foreach ($item in @($json.value)) {
                            $items += ,$item
                        }
                    }
                    elseif ($json -is [System.Array]) {
                        foreach ($item in @($json)) {
                            $items += ,$item
                        }
                    }
                    else {
                        $items += ,$json
                    }
                }
            }

            $continuationToken = Get-HeaderValue -Headers $response.Headers -Name "x-ms-continuationtoken"
        }
        catch {
            $msg = $_.Exception.Message
            throw ("{0} falhou. {1}" -f $Operation, $msg)
        }
    }
    while (-not [string]::IsNullOrWhiteSpace($continuationToken))

    return $items
}

function Test-RepoDisabled {
    param([object]$Repo)

    $value = Get-PropValue -Obj $Repo -Name "isDisabled"

    if ([string]::IsNullOrWhiteSpace($value)) {
        return $false
    }

    try {
        return [System.Convert]::ToBoolean($value)
    }
    catch {
        return $false
    }
}

# ============================================================
# CSV único
# ============================================================

function New-HistoryRow {
    param(
        [string]$Data,
        [string]$Pessoa,
        [string]$Repositorio,
        [string]$Tipo,
        [string]$Origem,

        [string]$PullRequestId,
        [string]$PullRequestTitulo,

        [string]$CommitId,
        [string]$Comentario,

        [object]$Match,
        [object]$Identity
    )

    $sortDate = $Data

    if ([string]::IsNullOrWhiteSpace($sortDate)) {
        $sortDate = "9999-12-31T23:59:59Z"
    }

    return [PSCustomObject]@{
        SortDate = $sortDate

        Data = $Data
        Pessoa = $Pessoa
        Repositorio = $Repositorio
        Tipo = $Tipo
        Origem = $Origem

        PullRequestId = $PullRequestId
        PullRequestTitulo = $PullRequestTitulo

        CommitId = $CommitId
        Comentario = $Comentario

        ValorEncontrado = $Match.ValorEncontrado
        ProcuradoPor = $Match.MatchBy

        IdentityDisplayName = Get-PropValue -Obj $Identity -Name "displayName"
        IdentityUniqueName = Get-PropValue -Obj $Identity -Name "uniqueName"
        IdentityId = Get-PropValue -Obj $Identity -Name "id"
    }
}

function Export-OneCsv {
    param(
        [object[]]$Rows,
        [string]$Path
    )

    $empty = [PSCustomObject]@{
        Data = ""
        Pessoa = ""
        Repositorio = ""
        Tipo = ""
        Origem = ""
        PullRequestId = ""
        PullRequestTitulo = ""
        CommitId = ""
        Comentario = ""
        ValorEncontrado = ""
        ProcuradoPor = ""
        IdentityDisplayName = ""
        IdentityUniqueName = ""
        IdentityId = ""
    }

    if ($null -eq $Rows -or $Rows.Count -eq 0) {
        @($empty) | Select-Object -First 0 | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8
        return
    }

    $Rows |
        Sort-Object SortDate, Pessoa, Repositorio, Tipo |
        Select-Object `
            Data,
            Pessoa,
            Repositorio,
            Tipo,
            Origem,
            PullRequestId,
            PullRequestTitulo,
            CommitId,
            Comentario,
            ValorEncontrado,
            ProcuradoPor,
            IdentityDisplayName,
            IdentityUniqueName,
            IdentityId |
        Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8
}

# ============================================================
# Entrada
# ============================================================

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if ([string]::IsNullOrWhiteSpace($TargetsJsonPath)) {
    $TargetsJsonPath = Join-Path $scriptDir "target-devs.json"
}

if ([string]::IsNullOrWhiteSpace($OutputCsv)) {
    $OutputCsv = Join-Path $scriptDir "colegas-repos-historico.csv"
}

if (-not (Test-Path $TargetsJsonPath)) {
    New-TargetTemplate -Path $TargetsJsonPath

    Write-Warn2 "Criei o target-devs.json aqui:"
    Write-Host $TargetsJsonPath
    Write-Host ""
    Write-Host "Edite com os emails dos colegas e rode novamente."

    try {
        Start-Process notepad.exe $TargetsJsonPath
    }
    catch {}

    exit 0
}

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

$targets = @(Load-Targets -Path $TargetsJsonPath)

if ($targets.Count -eq 0) {
    Write-Bad "Nenhum alvo válido no target-devs.json."
    exit 1
}

Write-Info "Pessoas carregadas:"
foreach ($target in $targets) {
    Write-Host (" - {0}: {1}" -f $target.Kind, $target.Label)
}

Write-Host ""
Write-Info "CSV único será gerado em:"
Write-Host $OutputCsv
Write-Host ""

Export-OneCsv -Rows @() -Path $OutputCsv

$patSecure = Read-Host "Cole seu PAT do Azure DevOps" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($patSecure)

try {
    $pat = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

if ([string]::IsNullOrWhiteSpace($pat)) {
    Write-Bad "PAT vazio."
    exit 1
}

$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
$headers = @{
    Authorization = "Basic $auth"
}

$encodedProject = [System.Uri]::EscapeDataString($Project)
$baseApi = "https://dev.azure.com/$Organization/$encodedProject/_apis"

# ============================================================
# Lista repos
# ============================================================

Write-Info "Listando repositórios..."

$repoUrl = "$baseApi/git/repositories?api-version=7.1"

try {
    $allRepos = @(Invoke-AdoPaged -Url $repoUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -Operation "LIST_REPOSITORIES")
}
catch {
    Write-Bad "Falha ao listar repositórios."
    Write-Host $_.Exception.Message
    exit 1
}

$repos = @()

foreach ($repo in $allRepos) {
    if (-not (Test-RepoDisabled -Repo $repo)) {
        $repos += ,$repo
    }
}

$repos = @($repos | Sort-Object name)

Write-Ok ("Repos ativos encontrados: {0}" -f $repos.Count)

# ============================================================
# Varredura
# ============================================================

$rows = @()
$nameMap = @{}
$repoIndex = 0
$totalMatches = 0

foreach ($repo in $repos) {
    $repoIndex++

    $repoId = Get-PropValue -Obj $repo -Name "id"
    $repoName = Get-PropValue -Obj $repo -Name "name"

    Write-Host ""
    Write-Info ("[{0}/{1}] {2}" -f $repoIndex, $repos.Count, $repoName)

    # ------------------------------------------------------------
    # PRs
    # ------------------------------------------------------------

    try {
        $prsUrl = "$baseApi/git/repositories/$repoId/pullrequests?searchCriteria.status=all&%24top=$PrTop&api-version=7.1"
        $prs = @(Invoke-AdoPaged -Url $prsUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -Operation "LIST_PULL_REQUESTS")
    }
    catch {
        Write-Warn2 ("Não consegui ler PRs de {0}. Seguindo." -f $repoName)
        Write-Warn2 $_.Exception.Message
        $prs = @()
    }

    foreach ($pr in $prs) {
        $prId = Get-PropValue -Obj $pr -Name "pullRequestId"
        $prTitle = Get-PropValue -Obj $pr -Name "title"
        $prCreated = Get-PropValue -Obj $pr -Name "creationDate"

        # Quem criou PR
        foreach ($match in @(Find-Matches -Targets $targets -Identity $pr.createdBy -NameMatchMode $NameMatchMode)) {
            Assert-NameIsNotAmbiguous -Match $match -Identity $pr.createdBy -NameMap $nameMap

            $row = New-HistoryRow `
                -Data $prCreated `
                -Pessoa $match.Pessoa `
                -Repositorio $repoName `
                -Tipo "PR_CRIADO" `
                -Origem "pullRequest.creationDate" `
                -PullRequestId $prId `
                -PullRequestTitulo $prTitle `
                -CommitId "" `
                -Comentario "" `
                -Match $match `
                -Identity $pr.createdBy

            $rows += ,$row
            $totalMatches++

            Write-MatchFound `
                -Pessoa $match.Pessoa `
                -Tipo "PR_CRIADO" `
                -Repo $repoName `
                -Data $prCreated `
                -Extra ("PR {0}" -f $prId)
        }

        # Reviewers listados no PR
        if (-not $SkipReviewers) {
            if (Test-HasProp -Obj $pr -Name "reviewers") {
                foreach ($reviewer in @($pr.reviewers)) {
                    foreach ($match in @(Find-Matches -Targets $targets -Identity $reviewer -NameMatchMode $NameMatchMode)) {
                        Assert-NameIsNotAmbiguous -Match $match -Identity $reviewer -NameMap $nameMap

                        $row = New-HistoryRow `
                            -Data $prCreated `
                            -Pessoa $match.Pessoa `
                            -Repositorio $repoName `
                            -Tipo "REVIEWER_NO_PR" `
                            -Origem "pullRequest.creationDate; data aproximada, não é data exata da review" `
                            -PullRequestId $prId `
                            -PullRequestTitulo $prTitle `
                            -CommitId "" `
                            -Comentario "" `
                            -Match $match `
                            -Identity $reviewer

                        $rows += ,$row
                        $totalMatches++

                        Write-MatchFound `
                            -Pessoa $match.Pessoa `
                            -Tipo "REVIEWER_NO_PR" `
                            -Repo $repoName `
                            -Data $prCreated `
                            -Extra ("PR {0}" -f $prId)
                    }
                }
            }
        }

        # Comentários de PR
        if (-not $SkipComments) {
            try {
                $threadsUrl = "$baseApi/git/repositories/$repoId/pullRequests/$prId/threads?api-version=7.1"
                $threads = @(Invoke-AdoPaged -Url $threadsUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -Operation "LIST_PR_THREADS")
            }
            catch {
                Write-Warn2 ("Não consegui ler comentários do PR {0} em {1}. Seguindo." -f $prId, $repoName)
                $threads = @()
            }

            foreach ($thread in $threads) {
                if (-not (Test-HasProp -Obj $thread -Name "comments")) {
                    continue
                }

                foreach ($comment in @($thread.comments)) {
                    if ($null -eq $comment.author) {
                        continue
                    }

                    $commentId = Get-PropValue -Obj $comment -Name "id"
                    $published = Get-PropValue -Obj $comment -Name "publishedDate"
                    $commentText = Get-Preview -Text (Get-PropValue -Obj $comment -Name "content") -Max 180

                    foreach ($match in @(Find-Matches -Targets $targets -Identity $comment.author -NameMatchMode $NameMatchMode)) {
                        Assert-NameIsNotAmbiguous -Match $match -Identity $comment.author -NameMap $nameMap

                        $row = New-HistoryRow `
                            -Data $published `
                            -Pessoa $match.Pessoa `
                            -Repositorio $repoName `
                            -Tipo "COMENTARIO_PR" `
                            -Origem "comment.publishedDate" `
                            -PullRequestId $prId `
                            -PullRequestTitulo $prTitle `
                            -CommitId "" `
                            -Comentario $commentText `
                            -Match $match `
                            -Identity $comment.author

                        $rows += ,$row
                        $totalMatches++

                        Write-MatchFound `
                            -Pessoa $match.Pessoa `
                            -Tipo "COMENTARIO_PR" `
                            -Repo $repoName `
                            -Data $published `
                            -Extra ("PR {0} Comentario {1}" -f $prId, $commentId)
                    }
                }
            }
        }
    }

    # ------------------------------------------------------------
    # Commits
    # ------------------------------------------------------------

    if (-not $SkipCommits) {
        try {
            $commitsUrl = "$baseApi/git/repositories/$repoId/commits?searchCriteria.%24top=$CommitsTop&api-version=7.1"
            $commits = @(Invoke-AdoPaged -Url $commitsUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -Operation "LIST_COMMITS")
        }
        catch {
            Write-Warn2 ("Não consegui ler commits de {0}. Seguindo." -f $repoName)
            Write-Warn2 $_.Exception.Message
            $commits = @()
        }

        foreach ($commit in $commits) {
            $commitId = Get-PropValue -Obj $commit -Name "commitId"
            $commitMessage = Get-Preview -Text (Get-PropValue -Obj $commit -Name "comment") -Max 180

            foreach ($role in @("author", "committer")) {
                $person = $commit.$role

                if ($null -eq $person) {
                    continue
                }

                $identity = New-CommitIdentity -Person $person
                $commitDate = Get-PropValue -Obj $person -Name "date"

                if ($role -eq "author") {
                    $tipo = "COMMIT_AUTHOR"
                    $origem = "commit.author.date"
                }
                else {
                    $tipo = "COMMIT_COMMITTER"
                    $origem = "commit.committer.date"
                }

                foreach ($match in @(Find-Matches -Targets $targets -Identity $identity -NameMatchMode $NameMatchMode)) {
                    Assert-NameIsNotAmbiguous -Match $match -Identity $identity -NameMap $nameMap

                    $row = New-HistoryRow `
                        -Data $commitDate `
                        -Pessoa $match.Pessoa `
                        -Repositorio $repoName `
                        -Tipo $tipo `
                        -Origem $origem `
                        -PullRequestId "" `
                        -PullRequestTitulo "" `
                        -CommitId $commitId `
                        -Comentario $commitMessage `
                        -Match $match `
                        -Identity $identity

                    $rows += ,$row
                    $totalMatches++

                    Write-MatchFound `
                        -Pessoa $match.Pessoa `
                        -Tipo $tipo `
                        -Repo $repoName `
                        -Data $commitDate `
                        -Extra ("Commit {0}" -f $commitId)
                }
            }
        }
    }

    # Atualiza o mesmo CSV único a cada repo concluído
    Export-OneCsv -Rows $rows -Path $OutputCsv
    Write-Info ("CSV atualizado: {0}" -f $OutputCsv)
}

# ============================================================
# Final
# ============================================================

Export-OneCsv -Rows $rows -Path $OutputCsv

Write-Host ""
Write-Host "========================================"
Write-Host "Finalizado"
Write-Host "========================================"
Write-Host ("Repos analisados:       {0}" -f $repos.Count)
Write-Host ("Participações achadas:  {0}" -f $totalMatches)
Write-Host ""
Write-Host "CSV único:"
Write-Host $OutputCsv
Write-Host ""

try {
    Start-Process notepad.exe $OutputCsv
}
catch {}
