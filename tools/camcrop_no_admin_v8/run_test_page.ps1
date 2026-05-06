$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$TestDir = Join-Path $Root "test"
Write-Host "Abrindo servidor local em http://localhost:8765/cam_test.html"
Write-Host "Depois carregue a extensão em extension/ e abra esse endereço no Chrome/Edge."
Start-Process "http://localhost:8765/cam_test.html"
python -m http.server 8765 --directory $TestDir
