param(
  [string]$Source = "C:\Users\Cabraiz\Documents\GitHub\portfolio\src\assets\Mateus\perfil_SEO.png",
  [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
)

$destinationDirectory = Join-Path $ProjectRoot "public\assets\Mateus"
$destinationFile = Join-Path $destinationDirectory "mateus-cardoso-cabral-perfil-seo.png"

if (-not (Test-Path $Source)) {
  Write-Error "Imagem de origem não encontrada: $Source"
  exit 1
}

New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
Copy-Item -Path $Source -Destination $destinationFile -Force

Write-Host "Imagem SEO copiada para: $destinationFile"
Write-Host "URL pública esperada: https://cabraiz.com/assets/Mateus/mateus-cardoso-cabral-perfil-seo.png"
