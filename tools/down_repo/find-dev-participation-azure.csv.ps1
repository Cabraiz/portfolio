# Linhas e exportacao do CSV unico (dot-source de find-dev-participation-azure.ps1).

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

