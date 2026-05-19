$root = "$env:USERPROFILE\Downloads\download_repo\temp"
$logPath = "$env:USERPROFILE\Desktop\fetch-repos-log.txt"

Remove-Item $logPath -ErrorAction SilentlyContinue

$repos = Get-ChildItem $root -Directory | Where-Object {
    Test-Path (Join-Path $_.FullName ".git")
}

"Repos encontrados: $($repos.Count)" | Tee-Object -FilePath $logPath -Append

foreach ($repo in $repos) {
    Write-Host ""
    Write-Host "==== FETCH: $($repo.Name) ====" -ForegroundColor Cyan
    Write-Host "Caminho: $($repo.FullName)"

    git -C $repo.FullName fetch origin --prune 2>&1 |
        Tee-Object -FilePath $logPath -Append

    if ($LASTEXITCODE -eq 0) {
        "[OK] $($repo.Name)" | Tee-Object -FilePath $logPath -Append
    } else {
        "[ERRO] $($repo.Name)" | Tee-Object -FilePath $logPath -Append
    }
}

Write-Host ""
Write-Host "Finalizado. Log em: $logPath" -ForegroundColor Green
