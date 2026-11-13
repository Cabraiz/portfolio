# Console, utilitarios e leitura do target-devs.json (dot-source de find-dev-participation-azure.ps1).

# ============================================================
# Console
# ============================================================

function Write-Info {
    param([string]$Message)
    Write-Host ("[INFO] {0}" -f $Message) -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host ("[OK]   {0}" -f $Message) -ForegroundColor Green
}

function Write-Warn2 {
    param([string]$Message)
    Write-Host ("[WARN] {0}" -f $Message) -ForegroundColor Yellow
}

function Write-Bad {
    param([string]$Message)
    Write-Host ("[ERRO] {0}" -f $Message) -ForegroundColor Red
}

function Write-MatchFound {
    param(
        [string]$Pessoa,
        [string]$Tipo,
        [string]$Repo,
        [string]$Data,
        [string]$Extra
    )

    if ([string]::IsNullOrWhiteSpace($Data)) {
        $dataText = "sem-data"
    }
    else {
        $dataText = $Data
    }

    if ([string]::IsNullOrWhiteSpace($Extra)) {
        Write-Host ("[ACHOU] {0} | {1} | {2} | {3}" -f $Pessoa, $Tipo, $Repo, $dataText) -ForegroundColor Green
    }
    else {
        Write-Host ("[ACHOU] {0} | {1} | {2} | {3} | {4}" -f $Pessoa, $Tipo, $Repo, $dataText, $Extra) -ForegroundColor Green
    }
}

# ============================================================
# Utilitários
# ============================================================

function Get-PropValue {
    param(
        [object]$Obj,
        [string]$Name
    )

    if ($null -eq $Obj) {
        return ""
    }

    $prop = $Obj.PSObject.Properties[$Name]

    if ($null -eq $prop) {
        return ""
    }

    if ($null -eq $prop.Value) {
        return ""
    }

    return [string]$prop.Value
}

function Test-HasProp {
    param(
        [object]$Obj,
        [string]$Name
    )

    if ($null -eq $Obj) {
        return $false
    }

    return ($null -ne $Obj.PSObject.Properties[$Name])
}

function Normalize-Text {
    param([string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return ""
    }

    $s = $Text.Trim().ToLowerInvariant()

    $s = $s -replace "[áàâãäå]", "a"
    $s = $s -replace "[éèêë]", "e"
    $s = $s -replace "[íìîï]", "i"
    $s = $s -replace "[óòôõö]", "o"
    $s = $s -replace "[úùûü]", "u"
    $s = $s -replace "[ç]", "c"
    $s = $s -replace "\s+", " "

    return $s.Trim()
}

function Get-Preview {
    param(
        [string]$Text,
        [int]$Max = 180
    )

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return ""
    }

    $clean = $Text -replace "<[^>]+>", " "
    $clean = $clean -replace "\s+", " "
    $clean = $clean.Trim()

    if ($clean.Length -le $Max) {
        return $clean
    }

    return $clean.Substring(0, $Max) + "..."
}

# ============================================================
# target-devs.json
# ============================================================

function New-TargetTemplate {
    param([string]$Path)

    $template = @'
[
  { "email": "dev1@empresa.com" },
  { "email": "dev2@empresa.com" },
  { "email": "dev3@empresa.com" }
]
'@

    $template | Set-Content -Path $Path -Encoding UTF8
}

function Load-Targets {
    param([string]$Path)

    $raw = Get-Content -Path $Path -Raw -Encoding UTF8

    if ([string]::IsNullOrWhiteSpace($raw)) {
        throw ("Arquivo vazio: {0}" -f $Path)
    }

    $parsed = $raw | ConvertFrom-Json

    if ((-not ($parsed -is [System.Array])) -and (Test-HasProp -Obj $parsed -Name "targets")) {
        $items = @($parsed.targets)
    }
    elseif ((-not ($parsed -is [System.Array])) -and (Test-HasProp -Obj $parsed -Name "devs")) {
        $items = @($parsed.devs)
    }
    else {
        $items = @($parsed)
    }

    $targets = @()

    foreach ($item in $items) {
        if ($null -eq $item) {
            continue
        }

        $name = ""
        $email = ""
        $id = ""
        $url = ""

        if ($item -is [string]) {
            $rawItem = ([string]$item).Trim()

            if ($rawItem -match "^https?://") {
                $url = $rawItem
            }
            elseif ($rawItem -match "@") {
                $email = $rawItem
            }
            elseif ($rawItem -match "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$") {
                $id = $rawItem
            }
            else {
                $name = $rawItem
            }
        }
        else {
            $name = Get-PropValue -Obj $item -Name "name"

            if ([string]::IsNullOrWhiteSpace($name)) {
                $name = Get-PropValue -Obj $item -Name "displayName"
            }

            $email = Get-PropValue -Obj $item -Name "email"

            if ([string]::IsNullOrWhiteSpace($email)) {
                $email = Get-PropValue -Obj $item -Name "uniqueName"
            }

            $id = Get-PropValue -Obj $item -Name "id"
            $url = Get-PropValue -Obj $item -Name "url"
        }

        $kind = ""
        $term = ""
        $label = ""
        $extractedId = ""

        if (-not [string]::IsNullOrWhiteSpace($email)) {
            $kind = "email"
            $term = $email.Trim()

            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $label = $name.Trim()
            }
            else {
                $label = $term
            }
        }
        elseif (-not [string]::IsNullOrWhiteSpace($id)) {
            $kind = "id"
            $term = $id.Trim()

            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $label = $name.Trim()
            }
            else {
                $label = $term
            }
        }
        elseif (-not [string]::IsNullOrWhiteSpace($url)) {
            $kind = "url"
            $term = $url.Trim()

            if (-not [string]::IsNullOrWhiteSpace($name)) {
                $label = $name.Trim()
            }
            else {
                $label = $term
            }

            if ($term -match "([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})") {
                $extractedId = $Matches[1]
            }
        }
        elseif (-not [string]::IsNullOrWhiteSpace($name)) {
            $kind = "name"
            $term = $name.Trim()
            $label = $term
        }

        if ([string]::IsNullOrWhiteSpace($term)) {
            continue
        }

        $targets += ,[PSCustomObject]@{
            Label = $label
            Kind = $kind
            Term = $term
            NormalizedTerm = Normalize-Text -Text $term
            ExtractedId = $extractedId
        }
    }

    return $targets
}

