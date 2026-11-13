# Execucao do Git com retry e logs (dot-source de clone_repo.ps1).

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

