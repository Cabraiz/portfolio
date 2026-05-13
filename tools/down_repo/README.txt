# Versão compatível

Esta versão evita o erro "os tipos de argumentos não correspondem" removendo chamadas mais frágeis e simplificando a validação.

## Exemplo target-devs.json para 3 emails
[
  { "email": "dev1@empresa.com" },
  { "email": "dev2@empresa.com" },
  { "email": "dev3@empresa.com" }
]

## Rodar
powershell -ExecutionPolicy Bypass -File .\find-dev-participation-azure.ps1 -OpenCsv

## Com commits
powershell -ExecutionPolicy Bypass -File .\find-dev-participation-azure.ps1 -ScanCommits -OpenCsv

## Reset
powershell -ExecutionPolicy Bypass -File .\find-dev-participation-azure.ps1 -ResetState -OpenCsv

Se usar { "name": "..." } e bater em mais de uma identidade, ele para e gera target-duplicates-*.csv.
Troque por email, id ou url.
