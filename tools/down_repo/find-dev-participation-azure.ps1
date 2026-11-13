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

# Funcoes em arquivos irmaos.
. "$PSScriptRoot\find-dev-participation-azure.helpers.ps1"
. "$PSScriptRoot\find-dev-participation-azure.identity-http.ps1"
. "$PSScriptRoot\find-dev-participation-azure.csv.ps1"

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
