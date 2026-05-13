# Azure DevOps - Dev Participation Audit com bloqueio de duplicatas

Este pacote não baixa repositórios. Ele usa a API do Azure DevOps para procurar participação de pessoas nos repositórios.

## Entrada

Edite o arquivo target-devs.json usando SOMENTE objetos com um destes campos:

[
  { "name": "Nome Completo" },
  { "email": "pessoa@empresa.com" },
  { "id": "00000000-0000-0000-0000-000000000000" },
  { "url": "https://vssps.dev.azure.com/ORG/_apis/Identities/00000000-0000-0000-0000-000000000000" }
]

Também aceita strings, mas o formato com objeto é mais claro.

## Regra importante de duplicidade

- Se você usar name e esse nome bater em mais de uma identidade real diferente, o script PARA.
- Ele gera target-duplicates-YYYYMMDD-HHMMSS.csv.
- A correção é trocar esse target para email, id ou url.

## Uso

powershell -ExecutionPolicy Bypass -File .\find-dev-participation-azure.ps1 -OpenCsv

Com commits:

powershell -ExecutionPolicy Bypass -File .\find-dev-participation-azure.ps1 -ScanCommits -OpenCsv

Com reviewers listados:

powershell -ExecutionPolicy Bypass -File .\find-dev-participation-azure.ps1 -ScanReviewersList -OpenCsv

Resetando estado:

powershell -ExecutionPolicy Bypass -File .\find-dev-participation-azure.ps1 -ResetState -OpenCsv

## Saídas principais

Documents\GitHub\AzureReposAudit\_dev_participation_audit

- participation-history-YYYYMMDD-HHMMSS.csv
- summary-by-dev-repo-YYYYMMDD-HHMMSS.csv
- summary-by-repo-YYYYMMDD-HHMMSS.csv
- summary-by-dev-YYYYMMDD-HHMMSS.csv
- target-duplicates-YYYYMMDD-HHMMSS.csv, se houver ambiguidade
- repos-accessible-YYYYMMDD-HHMMSS.csv
- repos-disabled-YYYYMMDD-HHMMSS.csv
- scan-failures-YYYYMMDD-HHMMSS.csv
