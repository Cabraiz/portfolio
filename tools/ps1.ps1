$organization = "QualicorpBr"
$project      = "Qualitech"
$destRoot     = "C:\Users\Cabraiz\Documents\GitHub\Qualitech"

New-Item -ItemType Directory -Force -Path $destRoot | Out-Null

$patSecure = Read-Host "Cole seu PAT do Azure DevOps" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($patSecure)
$pat = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)

$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
$headers = @{
    Authorization = "Basic $auth"
}

$apiUrl = "https://dev.azure.com/$organization/$project/_apis/git/repositories?api-version=7.1"

Write-Host "Buscando repositórios em:"
Write-Host $apiUrl
Write-Host ""

$response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get
$repos = $response.value | Sort-Object name

Write-Host "Encontrados $($repos.Count) repositórios."
Write-Host ""

foreach ($repo in $repos) {
    $safeName = $repo.name -replace '[\\/:*?"<>|]', '_'
    $target = Join-Path $destRoot $safeName

    if (Test-Path (Join-Path $target ".git")) {
        Write-Host "Já existe, atualizando: $($repo.name)"
        git -C $target -c http.extraHeader="Authorization: Basic $auth" fetch --all --prune
        git -C $target pull
    }
    else {
        Write-Host "Clonando: $($repo.name)"
        git -c http.extraHeader="Authorization: Basic $auth" clone $repo.remoteUrl $target
    }
}

Write-Host ""
Write-Host "Finalizado. Repositórios em:"
Write-Host $destRoot
