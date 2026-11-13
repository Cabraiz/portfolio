# Laco principal de clone/atualizacao; roda no escopo de clone_repo.ps1 (dot-source).

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
