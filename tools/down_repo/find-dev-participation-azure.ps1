param(
    [string]$Organization = "",
    [string]$Project = "",

    [string]$DestRoot = "$env:USERPROFILE\Documents\GitHub\AzureReposAudit",
    [string]$TargetsJsonPath = "",

    [ValidateSet("Contains", "Exact")]
    [string]$NameMatchMode = "Contains",

    [switch]$SkipPrComments,
    [switch]$ScanReviewersList,
    [switch]$ScanCommits,

    [int]$PrTop = 1000,
    [int]$CommitsTop = 500,

    [switch]$NoResume,
    [switch]$ResetState,
    [switch]$OpenCsv,

    [int]$ApiTimeoutSeconds = 120
)

$ErrorActionPreference = "Stop"

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

function Write-MatchFound {
    param(
        [string]$TargetKey,
        [string]$TargetKind,
        [string]$ParticipationType,
        [string]$RepoName,
        [string]$Date,
        [string]$Extra
    )

    if ([string]::IsNullOrWhiteSpace($Date)) {
        $dateText = "sem-data-exata"
    }
    else {
        $dateText = $Date
    }

    if ([string]::IsNullOrWhiteSpace($Extra)) {
        Write-Host "[ACHOU] $TargetKey [$TargetKind] | $ParticipationType | $RepoName | $dateText" -ForegroundColor Green
    }
    else {
        Write-Host "[ACHOU] $TargetKey [$TargetKind] | $ParticipationType | $RepoName | $dateText | $Extra" -ForegroundColor Green
    }
}

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

function Get-HashText {
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

function Get-ShortHash {
    param([string]$Text)

    $hash = Get-HashText $Text
    return $hash.Substring(0, 12)
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

function New-TargetTemplate {
    param([string]$Path)

    $template = @'
[
  { "email": "dev1@empresa.com" },
  { "email": "dev2@empresa.com" },
  { "email": "dev3@empresa.com" },

  { "name": "Nome Completo" },
  { "id": "00000000-0000-0000-0000-000000000000" },
  { "url": "https://vssps.dev.azure.com/ORG/_apis/Identities/00000000-0000-0000-0000-000000000000" }
]
'@

    $template | Set-Content -Path $Path -Encoding UTF8
}

function Load-Targets {
    param([string]$Path)

    $raw = Get-Content -Path $Path -Raw -Encoding UTF8

    if ([string]::IsNullOrWhiteSpace($raw)) {
        throw "Arquivo de devs vazio: $Path"
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

    $targets = New-Object System.Collections.Generic.List[object]

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
        $key = ""
        $extractedId = ""

        if (-not [string]::IsNullOrWhiteSpace($email)) {
            $kind = "email"
            $term = $email.Trim()

            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $key = $name.Trim()
            }
            else {
                $key = $term
            }
        }
        elseif (-not [string]::IsNullOrWhiteSpace($id)) {
            $kind = "id"
            $term = $id.Trim()

            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $key = $name.Trim()
            }
            else {
                $key = $term
            }
        }
        elseif (-not [string]::IsNullOrWhiteSpace($url)) {
            $kind = "url"
            $term = $url.Trim()

            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $key = $name.Trim()
            }
            else {
                $key = $term
            }

            if ($term -match "([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})") {
                $extractedId = $Matches[1]
            }
        }
        elseif (-not [string]::IsNullOrWhiteSpace($name)) {
            $kind = "name"
            $term = $name.Trim()
            $key = $term
        }

        if ([string]::IsNullOrWhiteSpace($term)) {
            continue
        }

        $targets.Add([PSCustomObject]@{
            Key = $key
            Kind = $kind
            Term = $term
            NormalizedTerm = Normalize-Text $term
            ExtractedId = $extractedId
        })
    }

    return @($targets)
}

function Get-IdentityValues {
    param([object]$Identity)

    $values = New-Object System.Collections.Generic.List[string]

    if ($null -eq $Identity) {
        return @()
    }

    foreach ($propName in @("id", "displayName", "uniqueName", "email", "descriptor", "url")) {
        $value = Get-PropValue -Obj $Identity -Name $propName

        if (-not [string]::IsNullOrWhiteSpace($value)) {
            $values.Add($value)
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
        return "email:" + (Normalize-Text $email)
    }

    $id = Get-PropValue -Obj $Identity -Name "id"

    if (-not [string]::IsNullOrWhiteSpace($id)) {
        return "id:" + (Normalize-Text $id)
    }

    $url = Get-PropValue -Obj $Identity -Name "url"

    if (-not [string]::IsNullOrWhiteSpace($url)) {
        return "url:" + (Normalize-Text $url)
    }

    $displayName = Get-PropValue -Obj $Identity -Name "displayName"

    if (-not [string]::IsNullOrWhiteSpace($displayName)) {
        return "name:" + (Normalize-Text $displayName)
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

    $matches = New-Object System.Collections.Generic.List[object]

    foreach ($target in $Targets) {
        foreach ($value in $values) {
            $normalizedValue = Normalize-Text $value
            $isMatch = $false

            if ($target.Kind -eq "email" -or $target.Kind -eq "id" -or $target.Kind -eq "url") {
                $isMatch = ($normalizedValue -eq $target.NormalizedTerm)

                if ((-not $isMatch) -and $target.Kind -eq "url" -and -not [string]::IsNullOrWhiteSpace($target.ExtractedId)) {
                    $isMatch = ($normalizedValue -eq (Normalize-Text $target.ExtractedId))
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
                $matches.Add([PSCustomObject]@{
                    TargetKey = $target.Key
                    TargetKind = $target.Kind
                    MatchedTerm = $target.Term
                    MatchedValue = $value
                })
            }
        }
    }

    return @($matches)
}

function New-IdentitySnapshot {
    param([object]$Identity)

    return [PSCustomObject]@{
        Id = Get-PropValue -Obj $Identity -Name "id"
        DisplayName = Get-PropValue -Obj $Identity -Name "displayName"
        UniqueName = Get-PropValue -Obj $Identity -Name "uniqueName"
        Email = Get-PropValue -Obj $Identity -Name "email"
        Descriptor = Get-PropValue -Obj $Identity -Name "descriptor"
        Url = Get-PropValue -Obj $Identity -Name "url"
    }
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

function New-Row {
    param(
        [string]$EvidenceKey,
        [object]$Match,
        [object]$Identity,

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
        [string]$CommitComment
    )

    $snapshot = New-IdentitySnapshot -Identity $Identity

    return [PSCustomObject]@{
        EvidenceKey = $EvidenceKey

        TargetKey = $Match.TargetKey
        TargetKind = $Match.TargetKind
        MatchedTerm = $Match.MatchedTerm
        MatchedValue = $Match.MatchedValue

        RepoName = $RepoName
        RepoId = $RepoId
        RepoDefaultBranch = $RepoDefaultBranch

        ParticipationType = $ParticipationType
        ParticipationDate = $ParticipationDate
        DateSource = $DateSource

        PullRequestId = $PullRequestId
        PullRequestTitle = $PullRequestTitle
        PullRequestStatus = $PullRequestStatus
        PullRequestCreationDate = $PullRequestCreationDate
        PullRequestClosedDate = $PullRequestClosedDate

        CommentId = $CommentId
        CommentPublishedDate = $CommentPublishedDate
        CommentLastUpdatedDate = $CommentLastUpdatedDate
        CommentPreview = $CommentPreview

        CommitId = $CommitId
        CommitDate = $CommitDate
        CommitComment = $CommitComment

        IdentityId = $snapshot.Id
        IdentityDisplayName = $snapshot.DisplayName
        IdentityUniqueName = $snapshot.UniqueName
        IdentityEmail = $snapshot.Email
        IdentityDescriptor = $snapshot.Descriptor
        IdentityUrl = $snapshot.Url
    }
}

function Append-CsvRows {
    param(
        [string]$Path,
        [object[]]$Rows
    )

    if ($Rows.Count -eq 0) {
        return
    }

    if (Test-Path $Path) {
        $Rows | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8 -Append
    }
    else {
        $Rows | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8
    }
}

function Get-HeaderValue {
    param(
        [object]$Headers,
        [string]$Name
    )

    if ($null -eq $Headers) {
        return ""
    }

    foreach ($key in $Headers.Keys) {
        if (([string]$key).ToLowerInvariant() -eq $Name.ToLowerInvariant()) {
            $value = $Headers[$key]

            if ($null -eq $value) {
                return ""
            }

            if ($value -is [array]) {
                return [string]$value[0]
            }

            return [string]$value
        }
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
        return "$Url&$encodedName=$encodedValue"
    }

    return "$Url`?$encodedName=$encodedValue"
}

function Invoke-AdoPaged {
    param(
        [string]$Url,
        [hashtable]$Headers,
        [int]$TimeoutSeconds,
        [string]$Operation
    )

    $items = New-Object System.Collections.Generic.List[object]
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

                if (Test-HasProp -Obj $json -Name "value") {
                    foreach ($item in @($json.value)) {
                        $items.Add($item)
                    }
                }
                else {
                    $items.Add($json)
                }
            }

            $continuationToken = Get-HeaderValue -Headers $response.Headers -Name "x-ms-continuationtoken"
        }
        catch {
            throw "$Operation falhou: $($_.Exception.Message)"
        }
    }
    while (-not [string]::IsNullOrWhiteSpace($continuationToken))

    return @($items)
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

function Add-Failure {
    param(
        [string]$Path,
        [string]$Repo,
        [string]$Operation,
        [string]$Message
    )

    $row = [PSCustomObject]@{
        Repo = $Repo
        Operation = $Operation
        Message = ($Message -replace "`r|`n", " ")
    }

    if (Test-Path $Path) {
        $row | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8 -Append
    }
    else {
        $row | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8
    }
}

function Save-State {
    param(
        [string]$Path,
        [object]$State
    )

    $State.UpdatedAt = (Get-Date).ToString("s")
    $State | ConvertTo-Json -Depth 10 | Set-Content -Path $Path -Encoding UTF8
}

function Load-State {
    param(
        [string]$Path,
        [string]$ContextHash
    )

    if (-not (Test-Path $Path)) {
        return [PSCustomObject]@{
            ContextHash = $ContextHash
            CreatedAt = (Get-Date).ToString("s")
            UpdatedAt = (Get-Date).ToString("s")
            LastCompletedRepoName = ""
            TotalEvidence = 0
        }
    }

    try {
        $state = Get-Content -Path $Path -Raw -Encoding UTF8 | ConvertFrom-Json

        if ((Get-PropValue -Obj $state -Name "ContextHash") -ne $ContextHash) {
            return [PSCustomObject]@{
                ContextHash = $ContextHash
                CreatedAt = (Get-Date).ToString("s")
                UpdatedAt = (Get-Date).ToString("s")
                LastCompletedRepoName = ""
                TotalEvidence = 0
            }
        }

        if (-not (Test-HasProp -Obj $state -Name "LastCompletedRepoName")) {
            $state | Add-Member -NotePropertyName "LastCompletedRepoName" -NotePropertyValue "" -Force
        }

        if (-not (Test-HasProp -Obj $state -Name "TotalEvidence")) {
            $state | Add-Member -NotePropertyName "TotalEvidence" -NotePropertyValue 0 -Force
        }

        return $state
    }
    catch {
        return [PSCustomObject]@{
            ContextHash = $ContextHash
            CreatedAt = (Get-Date).ToString("s")
            UpdatedAt = (Get-Date).ToString("s")
            LastCompletedRepoName = ""
            TotalEvidence = 0
        }
    }
}

function Export-EmptyHistory {
    param([string]$Path)

    @(
        [PSCustomObject]@{
            EvidenceKey = ""
            TargetKey = ""
            TargetKind = ""
            MatchedTerm = ""
            MatchedValue = ""
            RepoName = ""
            RepoId = ""
            RepoDefaultBranch = ""
            ParticipationType = ""
            ParticipationDate = ""
            DateSource = ""
            PullRequestId = ""
            PullRequestTitle = ""
            PullRequestStatus = ""
            PullRequestCreationDate = ""
            PullRequestClosedDate = ""
            CommentId = ""
            CommentPublishedDate = ""
            CommentLastUpdatedDate = ""
            CommentPreview = ""
            CommitId = ""
            CommitDate = ""
            CommitComment = ""
            IdentityId = ""
            IdentityDisplayName = ""
            IdentityUniqueName = ""
            IdentityEmail = ""
            IdentityDescriptor = ""
            IdentityUrl = ""
        }
    ) | Select-Object -First 0 | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8
}

function Export-EmptySummaryDevRepo {
    param([string]$Path)

    @(
        [PSCustomObject]@{
            TargetKey = ""
            RepoName = ""
            RepoId = ""
            EvidenceCount = ""
            ParticipationTypes = ""
            FirstDate = ""
            LastDate = ""
        }
    ) | Select-Object -First 0 | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8
}

function Export-EmptySummaryRepo {
    param([string]$Path)

    @(
        [PSCustomObject]@{
            RepoName = ""
            RepoId = ""
            EvidenceCount = ""
            DevsMatched = ""
            Devs = ""
            ParticipationTypes = ""
            FirstDate = ""
            LastDate = ""
        }
    ) | Select-Object -First 0 | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8
}

function Export-EmptySummaryDev {
    param([string]$Path)

    @(
        [PSCustomObject]@{
            TargetKey = ""
            EvidenceCount = ""
            ReposMatched = ""
            Repos = ""
            ParticipationTypes = ""
            FirstDate = ""
            LastDate = ""
        }
    ) | Select-Object -First 0 | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8
}

function Write-Summaries {
    param(
        [string]$RawPath,
        [string]$HistoryPath,
        [string]$ByDevRepoPath,
        [string]$ByRepoPath,
        [string]$ByDevPath
    )

    if (-not (Test-Path $RawPath)) {
        Export-EmptyHistory -Path $HistoryPath
        Export-EmptySummaryDevRepo -Path $ByDevRepoPath
        Export-EmptySummaryRepo -Path $ByRepoPath
        Export-EmptySummaryDev -Path $ByDevPath

        return 0
    }

    $rows = @(Import-Csv -Path $RawPath -Encoding UTF8)
    $map = @{}

    foreach ($row in $rows) {
        if ([string]::IsNullOrWhiteSpace($row.EvidenceKey)) {
            continue
        }

        if (-not $map.ContainsKey($row.EvidenceKey)) {
            $map[$row.EvidenceKey] = $row
        }
    }

    $unique = @($map.Values | Sort-Object TargetKey, RepoName, ParticipationDate, ParticipationType)

    if ($unique.Count -gt 0) {
        $unique | Export-Csv -Path $HistoryPath -NoTypeInformation -Encoding UTF8
    }
    else {
        Export-EmptyHistory -Path $HistoryPath
    }

    $devRepoSummary = New-Object System.Collections.Generic.List[object]
    $repoSummary = New-Object System.Collections.Generic.List[object]
    $devSummary = New-Object System.Collections.Generic.List[object]

    foreach ($group in @($unique | Group-Object { $_.TargetKey + "||" + $_.RepoName })) {
        $items = @($group.Group)

        if ($items.Count -eq 0) {
            continue
        }

        $first = $items[0]
        $dates = @($items | Where-Object { -not [string]::IsNullOrWhiteSpace($_.ParticipationDate) } | Sort-Object ParticipationDate)
        $types = @($items | Select-Object -ExpandProperty ParticipationType -Unique | Sort-Object)

        $firstDate = ""
        $lastDate = ""

        if ($dates.Count -gt 0) {
            $firstDate = $dates[0].ParticipationDate
            $lastDate = $dates[$dates.Count - 1].ParticipationDate
        }

        $devRepoSummary.Add([PSCustomObject]@{
            TargetKey = $first.TargetKey
            RepoName = $first.RepoName
            RepoId = $first.RepoId
            EvidenceCount = $items.Count
            ParticipationTypes = ($types -join "; ")
            FirstDate = $firstDate
            LastDate = $lastDate
        })
    }

    foreach ($group in @($unique | Group-Object RepoName)) {
        $items = @($group.Group)

        if ($items.Count -eq 0) {
            continue
        }

        $first = $items[0]
        $dates = @($items | Where-Object { -not [string]::IsNullOrWhiteSpace($_.ParticipationDate) } | Sort-Object ParticipationDate)
        $types = @($items | Select-Object -ExpandProperty ParticipationType -Unique | Sort-Object)
        $devs = @($items | Select-Object -ExpandProperty TargetKey -Unique | Sort-Object)

        $firstDate = ""
        $lastDate = ""

        if ($dates.Count -gt 0) {
            $firstDate = $dates[0].ParticipationDate
            $lastDate = $dates[$dates.Count - 1].ParticipationDate
        }

        $repoSummary.Add([PSCustomObject]@{
            RepoName = $first.RepoName
            RepoId = $first.RepoId
            EvidenceCount = $items.Count
            DevsMatched = $devs.Count
            Devs = ($devs -join "; ")
            ParticipationTypes = ($types -join "; ")
            FirstDate = $firstDate
            LastDate = $lastDate
        })
    }

    foreach ($group in @($unique | Group-Object TargetKey)) {
        $items = @($group.Group)

        if ($items.Count -eq 0) {
            continue
        }

        $first = $items[0]
        $dates = @($items | Where-Object { -not [string]::IsNullOrWhiteSpace($_.ParticipationDate) } | Sort-Object ParticipationDate)
        $types = @($items | Select-Object -ExpandProperty ParticipationType -Unique | Sort-Object)
        $repos = @($items | Select-Object -ExpandProperty RepoName -Unique | Sort-Object)

        $firstDate = ""
        $lastDate = ""

        if ($dates.Count -gt 0) {
            $firstDate = $dates[0].ParticipationDate
            $lastDate = $dates[$dates.Count - 1].ParticipationDate
        }

        $devSummary.Add([PSCustomObject]@{
            TargetKey = $first.TargetKey
            EvidenceCount = $items.Count
            ReposMatched = $repos.Count
            Repos = ($repos -join "; ")
            ParticipationTypes = ($types -join "; ")
            FirstDate = $firstDate
            LastDate = $lastDate
        })
    }

    if ($devRepoSummary.Count -gt 0) {
        @($devRepoSummary) | Export-Csv -Path $ByDevRepoPath -NoTypeInformation -Encoding UTF8
    }
    else {
        Export-EmptySummaryDevRepo -Path $ByDevRepoPath
    }

    if ($repoSummary.Count -gt 0) {
        @($repoSummary) | Export-Csv -Path $ByRepoPath -NoTypeInformation -Encoding UTF8
    }
    else {
        Export-EmptySummaryRepo -Path $ByRepoPath
    }

    if ($devSummary.Count -gt 0) {
        @($devSummary) | Export-Csv -Path $ByDevPath -NoTypeInformation -Encoding UTF8
    }
    else {
        Export-EmptySummaryDev -Path $ByDevPath
    }

    return $unique.Count
}

function Check-DuplicateOrStop {
    param(
        [object]$Match,
        [object]$Identity,
        [hashtable]$NameTargetIdentities,
        [string]$DuplicateCsv
    )

    if ($Match.TargetKind -ne "name") {
        return
    }

    $identityKey = Get-IdentityKey -Identity $Identity

    if ([string]::IsNullOrWhiteSpace($identityKey)) {
        return
    }

    if (-not $NameTargetIdentities.ContainsKey($Match.TargetKey)) {
        $NameTargetIdentities[$Match.TargetKey] = @{}
    }

    $bucket = $NameTargetIdentities[$Match.TargetKey]

    if (-not $bucket.ContainsKey($identityKey)) {
        $snapshot = New-IdentitySnapshot -Identity $Identity

        $bucket[$identityKey] = [PSCustomObject]@{
            TargetKey = $Match.TargetKey
            MatchedTerm = $Match.MatchedTerm
            IdentityKey = $identityKey
            IdentityId = $snapshot.Id
            DisplayName = $snapshot.DisplayName
            UniqueName = $snapshot.UniqueName
            Email = $snapshot.Email
            Url = $snapshot.Url
        }
    }

    if ($bucket.Keys.Count -gt 1) {
        @($bucket.Values) | Export-Csv -Path $DuplicateCsv -NoTypeInformation -Encoding UTF8

        Write-Bad "Nome ambíguo encontrado: '$($Match.TargetKey)' bateu em mais de uma identidade real."
        Write-Host ""
        Write-Host "CSV de duplicatas:"
        Write-Host $DuplicateCsv
        Write-Host ""
        Write-Host "Troque esse item do target-devs.json por email, id ou url e rode novamente com -ResetState."
        exit 2
    }
}

# ============================================================
# Entrada inicial
# ============================================================

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

New-Item -ItemType Directory -Force -Path $DestRoot | Out-Null

$auditDir = Join-Path $DestRoot "_dev_participation_audit"
New-Item -ItemType Directory -Force -Path $auditDir | Out-Null

if ([string]::IsNullOrWhiteSpace($TargetsJsonPath)) {
    $TargetsJsonPath = Join-Path $DestRoot "target-devs.json"
}

if (-not (Test-Path $TargetsJsonPath)) {
    New-TargetTemplate -Path $TargetsJsonPath

    Write-Warn2 "Arquivo de devs-alvo criado:"
    Write-Host $TargetsJsonPath
    Write-Host ""
    Write-Host "Edite o arquivo e rode novamente."

    try {
        Start-Process notepad.exe $TargetsJsonPath
    }
    catch {}

    exit 0
}

$targetsRaw = Get-Content -Path $TargetsJsonPath -Raw -Encoding UTF8
$targetsHash = Get-ShortHash $targetsRaw
$targets = @(Load-Targets -Path $TargetsJsonPath)

if ($targets.Count -eq 0) {
    Write-Bad "Nenhum alvo válido em: $TargetsJsonPath"
    exit 1
}

$scanComments = -not [bool]$SkipPrComments

$contextText = @(
    $Organization.Trim().ToLowerInvariant()
    $Project.Trim().ToLowerInvariant()
    $targetsHash
    $NameMatchMode
    "comments=$scanComments"
    "reviewers=$([bool]$ScanReviewersList)"
    "commits=$([bool]$ScanCommits)"
) -join "|"

$contextHash = Get-HashText $contextText

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

$stateFile = Join-Path $auditDir "scan-state-$targetsHash.json"
$rawCsv = Join-Path $auditDir "participation-raw-$targetsHash.csv"

$historyCsv = Join-Path $auditDir "participation-history-$stamp.csv"
$byDevRepoCsv = Join-Path $auditDir "summary-by-dev-repo-$stamp.csv"
$byRepoCsv = Join-Path $auditDir "summary-by-repo-$stamp.csv"
$byDevCsv = Join-Path $auditDir "summary-by-dev-$stamp.csv"

$catalogCsv = Join-Path $auditDir "repos-catalog-$stamp.csv"
$accessibleCsv = Join-Path $auditDir "repos-accessible-$stamp.csv"
$disabledCsv = Join-Path $auditDir "repos-disabled-$stamp.csv"

$failCsv = Join-Path $auditDir "scan-failures-$stamp.csv"
$dupCsv = Join-Path $auditDir "target-duplicates-$stamp.csv"

if ($ResetState) {
    Remove-Item $stateFile -Force -ErrorAction SilentlyContinue
    Remove-Item $rawCsv -Force -ErrorAction SilentlyContinue
}

if ($NoResume) {
    $state = [PSCustomObject]@{
        ContextHash = $contextHash
        CreatedAt = (Get-Date).ToString("s")
        UpdatedAt = (Get-Date).ToString("s")
        LastCompletedRepoName = ""
        TotalEvidence = 0
    }
}
else {
    $state = Load-State -Path $stateFile -ContextHash $contextHash
}

Save-State -Path $stateFile -State $state

Write-Info "Targets carregados:"
foreach ($target in $targets) {
    Write-Host " - $($target.Kind): $($target.Key)"
}
Write-Host ""

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
    $visibleRepos = @(Invoke-AdoPaged -Url $repoUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -Operation "LIST_REPOSITORIES" | Sort-Object name)
}
catch {
    Write-Bad "Falha ao listar repositórios."
    Write-Host $_.Exception.Message
    exit 1
}

$catalog = New-Object System.Collections.Generic.List[object]
$accessible = New-Object System.Collections.Generic.List[object]
$disabled = New-Object System.Collections.Generic.List[object]

foreach ($repo in $visibleRepos) {
    $isDisabled = Test-RepoDisabled -Repo $repo

    if ($isDisabled) {
        $status = "DISABLED"
    }
    else {
        $status = "ACCESSIBLE"
    }

    $catalog.Add([PSCustomObject]@{
        Status = $status
        Name = Get-PropValue -Obj $repo -Name "name"
        Id = Get-PropValue -Obj $repo -Name "id"
        IsDisabled = $isDisabled
        DefaultBranch = Get-PropValue -Obj $repo -Name "defaultBranch"
        Size = Get-PropValue -Obj $repo -Name "size"
    })

    if ($isDisabled) {
        $disabled.Add($repo)
    }
    else {
        $accessible.Add($repo)
    }
}

@($catalog) | Export-Csv -Path $catalogCsv -NoTypeInformation -Encoding UTF8
@($catalog | Where-Object { $_.Status -eq "ACCESSIBLE" }) | Export-Csv -Path $accessibleCsv -NoTypeInformation -Encoding UTF8
@($catalog | Where-Object { $_.Status -eq "DISABLED" }) | Export-Csv -Path $disabledCsv -NoTypeInformation -Encoding UTF8

Write-Host ""
Write-Host "Visíveis pela API:       $($visibleRepos.Count)"
Write-Host "Acessíveis/ativos:       $($accessible.Count)"
Write-Host "Disabled/desabilitados:  $($disabled.Count)"
Write-Host ""

$reposToScan = @($accessible)
$lastDone = Get-PropValue -Obj $state -Name "LastCompletedRepoName"

if ((-not $NoResume) -and (-not [string]::IsNullOrWhiteSpace($lastDone))) {
    Write-Warn2 "Retomando depois de: $lastDone"

    $reposToScan = @(
        $accessible | Where-Object {
            [string]::Compare((Get-PropValue -Obj $_ -Name "name"), $lastDone, $true) -gt 0
        }
    )
}

if ($reposToScan.Count -eq 0) {
    Write-Ok "Nada pendente. Gerando CSVs finais."

    $total = Write-Summaries `
        -RawPath $rawCsv `
        -HistoryPath $historyCsv `
        -ByDevRepoPath $byDevRepoCsv `
        -ByRepoPath $byRepoCsv `
        -ByDevPath $byDevCsv

    Write-Host ""
    Write-Host "CSV principal:"
    Write-Host $historyCsv

    if ($OpenCsv) {
        Start-Process notepad.exe $historyCsv
    }

    exit 0
}

# ============================================================
# Varredura
# ============================================================

$nameTargetIdentities = @{}
$totalThisRun = 0
$failCount = 0
$repoCounter = 0

foreach ($repo in $reposToScan) {
    $repoCounter++

    $repoId = Get-PropValue -Obj $repo -Name "id"
    $repoName = Get-PropValue -Obj $repo -Name "name"
    $repoDefaultBranch = Get-PropValue -Obj $repo -Name "defaultBranch"

    Write-Host ""
    Write-Info "[$repoCounter/$($reposToScan.Count)] $repoName"

    $repoRows = New-Object System.Collections.Generic.List[object]

    try {
        $prsUrl = "$baseApi/git/repositories/$repoId/pullrequests?searchCriteria.status=all&`$top=$PrTop&api-version=7.1"
        $prs = @(Invoke-AdoPaged -Url $prsUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -Operation "LIST_PULL_REQUESTS")

        foreach ($pr in $prs) {
            $prId = Get-PropValue -Obj $pr -Name "pullRequestId"
            $prTitle = Get-PropValue -Obj $pr -Name "title"
            $prStatus = Get-PropValue -Obj $pr -Name "status"
            $prCreated = Get-PropValue -Obj $pr -Name "creationDate"
            $prClosed = Get-PropValue -Obj $pr -Name "closedDate"

            # PR criado pelo dev
            foreach ($match in @(Find-Matches -Targets $targets -Identity $pr.createdBy -NameMatchMode $NameMatchMode)) {
                Check-DuplicateOrStop `
                    -Match $match `
                    -Identity $pr.createdBy `
                    -NameTargetIdentities $nameTargetIdentities `
                    -DuplicateCsv $dupCsv

                $evidenceKey = "$repoId|PR_CREATED|$prId|$($match.TargetKey)|$($match.MatchedTerm)"

                Write-MatchFound `
                    -TargetKey $match.TargetKey `
                    -TargetKind $match.TargetKind `
                    -ParticipationType "PR_CREATED" `
                    -RepoName $repoName `
                    -Date $prCreated `
                    -Extra "PR $prId"

                $repoRows.Add((New-Row `
                    -EvidenceKey $evidenceKey `
                    -Match $match `
                    -Identity $pr.createdBy `
                    -RepoName $repoName `
                    -RepoId $repoId `
                    -RepoDefaultBranch $repoDefaultBranch `
                    -ParticipationType "PR_CREATED" `
                    -ParticipationDate $prCreated `
                    -DateSource "pullRequest.creationDate" `
                    -PullRequestId $prId `
                    -PullRequestTitle $prTitle `
                    -PullRequestStatus $prStatus `
                    -PullRequestCreationDate $prCreated `
                    -PullRequestClosedDate $prClosed `
                    -CommentId "" `
                    -CommentPublishedDate "" `
                    -CommentLastUpdatedDate "" `
                    -CommentPreview "" `
                    -CommitId "" `
                    -CommitDate "" `
                    -CommitComment ""))
            }

            # Reviewer listado no PR
            if ($ScanReviewersList -and (Test-HasProp -Obj $pr -Name "reviewers")) {
                foreach ($reviewer in @($pr.reviewers)) {
                    foreach ($match in @(Find-Matches -Targets $targets -Identity $reviewer -NameMatchMode $NameMatchMode)) {
                        Check-DuplicateOrStop `
                            -Match $match `
                            -Identity $reviewer `
                            -NameTargetIdentities $nameTargetIdentities `
                            -DuplicateCsv $dupCsv

                        $reviewerId = Get-PropValue -Obj $reviewer -Name "id"
                        $evidenceKey = "$repoId|PR_REVIEWER_LISTED|$prId|$reviewerId|$($match.TargetKey)|$($match.MatchedTerm)"

                        Write-MatchFound `
                            -TargetKey $match.TargetKey `
                            -TargetKind $match.TargetKind `
                            -ParticipationType "PR_REVIEWER_LISTED" `
                            -RepoName $repoName `
                            -Date "" `
                            -Extra "PR $prId"

                        $repoRows.Add((New-Row `
                            -EvidenceKey $evidenceKey `
                            -Match $match `
                            -Identity $reviewer `
                            -RepoName $repoName `
                            -RepoId $repoId `
                            -RepoDefaultBranch $repoDefaultBranch `
                            -ParticipationType "PR_REVIEWER_LISTED" `
                            -ParticipationDate "" `
                            -DateSource "no_exact_reviewer_date_in_pr_list" `
                            -PullRequestId $prId `
                            -PullRequestTitle $prTitle `
                            -PullRequestStatus $prStatus `
                            -PullRequestCreationDate $prCreated `
                            -PullRequestClosedDate $prClosed `
                            -CommentId "" `
                            -CommentPublishedDate "" `
                            -CommentLastUpdatedDate "" `
                            -CommentPreview "" `
                            -CommitId "" `
                            -CommitDate "" `
                            -CommitComment ""))
                    }
                }
            }

            # Comentários de PR
            if ($scanComments) {
                try {
                    $threadsUrl = "$baseApi/git/repositories/$repoId/pullRequests/$prId/threads?api-version=7.1"
                    $threads = @(Invoke-AdoPaged -Url $threadsUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -Operation "LIST_PR_THREADS")

                    foreach ($thread in $threads) {
                        if (-not (Test-HasProp -Obj $thread -Name "comments")) {
                            continue
                        }

                        foreach ($comment in @($thread.comments)) {
                            if ($null -eq $comment.author) {
                                continue
                            }

                            foreach ($match in @(Find-Matches -Targets $targets -Identity $comment.author -NameMatchMode $NameMatchMode)) {
                                Check-DuplicateOrStop `
                                    -Match $match `
                                    -Identity $comment.author `
                                    -NameTargetIdentities $nameTargetIdentities `
                                    -DuplicateCsv $dupCsv

                                $commentId = Get-PropValue -Obj $comment -Name "id"
                                $published = Get-PropValue -Obj $comment -Name "publishedDate"
                                $updated = Get-PropValue -Obj $comment -Name "lastUpdatedDate"
                                $preview = Get-Preview -Text (Get-PropValue -Obj $comment -Name "content")
                                $evidenceKey = "$repoId|PR_COMMENT|$prId|$commentId|$($match.TargetKey)|$($match.MatchedTerm)"

                                Write-MatchFound `
                                    -TargetKey $match.TargetKey `
                                    -TargetKind $match.TargetKind `
                                    -ParticipationType "PR_COMMENT" `
                                    -RepoName $repoName `
                                    -Date $published `
                                    -Extra "PR $prId Comentário $commentId"

                                $repoRows.Add((New-Row `
                                    -EvidenceKey $evidenceKey `
                                    -Match $match `
                                    -Identity $comment.author `
                                    -RepoName $repoName `
                                    -RepoId $repoId `
                                    -RepoDefaultBranch $repoDefaultBranch `
                                    -ParticipationType "PR_COMMENT" `
                                    -ParticipationDate $published `
                                    -DateSource "comment.publishedDate" `
                                    -PullRequestId $prId `
                                    -PullRequestTitle $prTitle `
                                    -PullRequestStatus $prStatus `
                                    -PullRequestCreationDate $prCreated `
                                    -PullRequestClosedDate $prClosed `
                                    -CommentId $commentId `
                                    -CommentPublishedDate $published `
                                    -CommentLastUpdatedDate $updated `
                                    -CommentPreview $preview `
                                    -CommitId "" `
                                    -CommitDate "" `
                                    -CommitComment ""))
                            }
                        }
                    }
                }
                catch {
                    $msg = $_.Exception.Message

                    Add-Failure `
                        -Path $failCsv `
                        -Repo $repoName `
                        -Operation "LIST_PR_THREADS_$prId" `
                        -Message $msg

                    Write-Warn2 "Falha ao ler comentários do PR $prId em $repoName. Seguindo."
                }
            }
        }
    }
    catch {
        $failCount++
        $msg = $_.Exception.Message

        Add-Failure `
            -Path $failCsv `
            -Repo $repoName `
            -Operation "LIST_PULL_REQUESTS" `
            -Message $msg

        Write-Warn2 "Falha ao varrer PRs de $repoName. Seguindo para commits/próximo repo."
    }

    # Commits, opcional
    if ($ScanCommits) {
        try {
            $commitsUrl = "$baseApi/git/repositories/$repoId/commits?searchCriteria.`$top=$CommitsTop&api-version=7.1"
            $commits = @(Invoke-AdoPaged -Url $commitsUrl -Headers $headers -TimeoutSeconds $ApiTimeoutSeconds -Operation "LIST_COMMITS")

            foreach ($commit in $commits) {
                $commitId = Get-PropValue -Obj $commit -Name "commitId"
                $commitPreview = Get-Preview -Text (Get-PropValue -Obj $commit -Name "comment") -Max 220

                foreach ($role in @("author", "committer")) {
                    $person = $commit.$role

                    if ($null -eq $person) {
                        continue
                    }

                    $identity = New-CommitIdentity -Person $person

                    foreach ($match in @(Find-Matches -Targets $targets -Identity $identity -NameMatchMode $NameMatchMode)) {
                        Check-DuplicateOrStop `
                            -Match $match `
                            -Identity $identity `
                            -NameTargetIdentities $nameTargetIdentities `
                            -DuplicateCsv $dupCsv

                        $commitDate = Get-PropValue -Obj $person -Name "date"

                        if ($role -eq "author") {
                            $participationType = "COMMIT_AUTHOR"
                        }
                        else {
                            $participationType = "COMMIT_COMMITTER"
                        }

                        $evidenceKey = "$repoId|$participationType|$commitId|$($match.TargetKey)|$($match.MatchedTerm)"

                        Write-MatchFound `
                            -TargetKey $match.TargetKey `
                            -TargetKind $match.TargetKind `
                            -ParticipationType $participationType `
                            -RepoName $repoName `
                            -Date $commitDate `
                            -Extra "Commit $commitId"

                        $repoRows.Add((New-Row `
                            -EvidenceKey $evidenceKey `
                            -Match $match `
                            -Identity $identity `
                            -RepoName $repoName `
                            -RepoId $repoId `
                            -RepoDefaultBranch $repoDefaultBranch `
                            -ParticipationType $participationType `
                            -ParticipationDate $commitDate `
                            -DateSource "commit.$role.date" `
                            -PullRequestId "" `
                            -PullRequestTitle "" `
                            -PullRequestStatus "" `
                            -PullRequestCreationDate "" `
                            -PullRequestClosedDate "" `
                            -CommentId "" `
                            -CommentPublishedDate "" `
                            -CommentLastUpdatedDate "" `
                            -CommentPreview "" `
                            -CommitId $commitId `
                            -CommitDate $commitDate `
                            -CommitComment $commitPreview))
                    }
                }
            }
        }
        catch {
            $failCount++
            $msg = $_.Exception.Message

            Add-Failure `
                -Path $failCsv `
                -Repo $repoName `
                -Operation "LIST_COMMITS" `
                -Message $msg

            Write-Warn2 "Falha ao varrer commits de $repoName. Seguindo."
        }
    }

    if ($repoRows.Count -gt 0) {
        Append-CsvRows -Path $rawCsv -Rows @($repoRows)
        Write-Ok "Participações encontradas em $repoName: $($repoRows.Count)"
    }
    else {
        Write-Info "Nenhuma participação encontrada em $repoName."
    }

    $totalThisRun += $repoRows.Count

    $state.LastCompletedRepoName = $repoName
    $state.TotalEvidence = [int]$state.TotalEvidence + $repoRows.Count
    Save-State -Path $stateFile -State $state
}

# ============================================================
# CSVs finais
# ============================================================

$totalUnique = Write-Summaries `
    -RawPath $rawCsv `
    -HistoryPath $historyCsv `
    -ByDevRepoPath $byDevRepoCsv `
    -ByRepoPath $byRepoCsv `
    -ByDevPath $byDevCsv

Write-Host ""
Write-Host "========================================"
Write-Host "Finalizado"
Write-Host "========================================"
Write-Host "Visíveis pela API:             $($visibleRepos.Count)"
Write-Host "Acessíveis/ativos:             $($accessible.Count)"
Write-Host "Disabled/desabilitados:        $($disabled.Count)"
Write-Host "Participações nesta execução:  $totalThisRun"
Write-Host "Participações únicas totais:   $totalUnique"
Write-Host "Falhas:                        $failCount"
Write-Host ""
Write-Host "CSV principal:"
Write-Host $historyCsv
Write-Host ""
Write-Host "Resumo por dev + repo:"
Write-Host $byDevRepoCsv
Write-Host ""
Write-Host "Resumo por repo:"
Write-Host $byRepoCsv
Write-Host ""
Write-Host "Resumo por dev:"
Write-Host $byDevCsv
Write-Host ""
Write-Host "Catálogo acessíveis:"
Write-Host $accessibleCsv
Write-Host ""
Write-Host "Catálogo disabled:"
Write-Host $disabledCsv
Write-Host ""
Write-Host "Falhas:"
Write-Host $failCsv
Write-Host ""

if ($OpenCsv) {
    Start-Process notepad.exe $historyCsv
}
