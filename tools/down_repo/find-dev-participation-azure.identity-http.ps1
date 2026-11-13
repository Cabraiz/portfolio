# Match de identidade e HTTP do Azure DevOps (dot-source de find-dev-participation-azure.ps1).

# ============================================================
# Match de identidade
# ============================================================

function Get-IdentityValues {
    param([object]$Identity)

    if ($null -eq $Identity) {
        return @()
    }

    $values = @()

    foreach ($propName in @("id", "displayName", "uniqueName", "email", "descriptor", "url")) {
        $value = Get-PropValue -Obj $Identity -Name $propName

        if (-not [string]::IsNullOrWhiteSpace($value)) {
            $values += ,$value
        }
    }

    return @($values | Select-Object -Unique)
}

function Get-IdentityKey {
    param([object]$Identity)

    if ($null -eq $Identity) {
        return ""
    }

    $email = Get-PropValue -Obj $Identity -Name "email"

    if ([string]::IsNullOrWhiteSpace($email)) {
        $email = Get-PropValue -Obj $Identity -Name "uniqueName"
    }

    if (-not [string]::IsNullOrWhiteSpace($email)) {
        return ("email:{0}" -f (Normalize-Text -Text $email))
    }

    $id = Get-PropValue -Obj $Identity -Name "id"

    if (-not [string]::IsNullOrWhiteSpace($id)) {
        return ("id:{0}" -f (Normalize-Text -Text $id))
    }

    $displayName = Get-PropValue -Obj $Identity -Name "displayName"

    if (-not [string]::IsNullOrWhiteSpace($displayName)) {
        return ("name:{0}" -f (Normalize-Text -Text $displayName))
    }

    return ""
}

function Find-Matches {
    param(
        [object[]]$Targets,
        [object]$Identity,
        [string]$NameMatchMode
    )

    $values = @(Get-IdentityValues -Identity $Identity)

    if ($values.Count -eq 0) {
        return @()
    }

    $matches = @()

    foreach ($target in $Targets) {
        foreach ($value in $values) {
            $normalizedValue = Normalize-Text -Text $value
            $isMatch = $false

            if ($target.Kind -eq "email" -or $target.Kind -eq "id" -or $target.Kind -eq "url") {
                $isMatch = ($normalizedValue -eq $target.NormalizedTerm)

                if ((-not $isMatch) -and $target.Kind -eq "url" -and -not [string]::IsNullOrWhiteSpace($target.ExtractedId)) {
                    $isMatch = ($normalizedValue -eq (Normalize-Text -Text $target.ExtractedId))
                }
            }
            else {
                if ($NameMatchMode -eq "Exact") {
                    $isMatch = ($normalizedValue -eq $target.NormalizedTerm)
                }
                else {
                    $isMatch = (
                        $normalizedValue.Contains($target.NormalizedTerm) -or
                        $target.NormalizedTerm.Contains($normalizedValue)
                    )
                }
            }

            if ($isMatch) {
                $matches += ,[PSCustomObject]@{
                    Pessoa = $target.Label
                    MatchBy = $target.Kind
                    TermoProcurado = $target.Term
                    ValorEncontrado = $value
                }
            }
        }
    }

    return $matches
}

function New-CommitIdentity {
    param([object]$Person)

    return [PSCustomObject]@{
        id = ""
        displayName = Get-PropValue -Obj $Person -Name "name"
        uniqueName = Get-PropValue -Obj $Person -Name "email"
        email = Get-PropValue -Obj $Person -Name "email"
        descriptor = ""
        url = ""
    }
}

function Assert-NameIsNotAmbiguous {
    param(
        [object]$Match,
        [object]$Identity,
        [hashtable]$NameMap
    )

    if ($Match.MatchBy -ne "name") {
        return
    }

    $identityKey = Get-IdentityKey -Identity $Identity

    if ([string]::IsNullOrWhiteSpace($identityKey)) {
        return
    }

    if (-not $NameMap.ContainsKey($Match.Pessoa)) {
        $NameMap[$Match.Pessoa] = @{}
    }

    $bucket = $NameMap[$Match.Pessoa]

    if (-not $bucket.ContainsKey($identityKey)) {
        $displayName = Get-PropValue -Obj $Identity -Name "displayName"
        $uniqueName = Get-PropValue -Obj $Identity -Name "uniqueName"
        $id = Get-PropValue -Obj $Identity -Name "id"

        $bucket[$identityKey] = [PSCustomObject]@{
            IdentityKey = $identityKey
            DisplayName = $displayName
            UniqueName = $uniqueName
            Id = $id
        }
    }

    if ($bucket.Keys.Count -gt 1) {
        Write-Bad ("Nome ambíguo: {0}" -f $Match.Pessoa)
        Write-Host ""
        Write-Host "Esse nome bateu em mais de uma identidade. Troque no target-devs.json por email, id ou url."
        Write-Host ""
        Write-Host "Identidades encontradas:"

        foreach ($key in $bucket.Keys) {
            $x = $bucket[$key]
            Write-Host (" - {0} | {1} | {2}" -f $x.DisplayName, $x.UniqueName, $x.Id)
        }

        exit 2
    }
}

# ============================================================
# HTTP Azure DevOps
# ============================================================

function Get-HeaderValue {
    param(
        [object]$Headers,
        [string]$Name
    )

    if ($null -eq $Headers) {
        return ""
    }

    try {
        foreach ($key in $Headers.Keys) {
            if (([string]$key).ToLowerInvariant() -eq $Name.ToLowerInvariant()) {
                $value = $Headers[$key]

                if ($null -eq $value) {
                    return ""
                }

                if ($value -is [System.Array]) {
                    if ($value.Count -gt 0) {
                        return [string]$value[0]
                    }

                    return ""
                }

                return [string]$value
            }
        }
    }
    catch {
        return ""
    }

    return ""
}

function Add-QueryParameter {
    param(
        [string]$Url,
        [string]$Name,
        [string]$Value
    )

    $encodedName = [System.Uri]::EscapeDataString($Name)
    $encodedValue = [System.Uri]::EscapeDataString($Value)

    if ($Url.Contains("?")) {
        return ("{0}&{1}={2}" -f $Url, $encodedName, $encodedValue)
    }

    return ("{0}?{1}={2}" -f $Url, $encodedName, $encodedValue)
}

function Invoke-AdoPaged {
    param(
        [string]$Url,
        [hashtable]$Headers,
        [int]$TimeoutSeconds,
        [string]$Operation
    )

    $items = @()
    $continuationToken = ""

    do {
        $actualUrl = $Url

        if (-not [string]::IsNullOrWhiteSpace($continuationToken)) {
            $actualUrl = Add-QueryParameter -Url $Url -Name "continuationToken" -Value $continuationToken
        }

        try {
            $response = Invoke-WebRequest `
                -Uri $actualUrl `
                -Headers $Headers `
                -Method Get `
                -TimeoutSec $TimeoutSeconds `
                -UseBasicParsing

            $content = [string]$response.Content

            if (-not [string]::IsNullOrWhiteSpace($content)) {
                $json = $content | ConvertFrom-Json

                if ($null -ne $json) {
                    if (Test-HasProp -Obj $json -Name "value") {
                        foreach ($item in @($json.value)) {
                            $items += ,$item
                        }
                    }
                    elseif ($json -is [System.Array]) {
                        foreach ($item in @($json)) {
                            $items += ,$item
                        }
                    }
                    else {
                        $items += ,$json
                    }
                }
            }

            $continuationToken = Get-HeaderValue -Headers $response.Headers -Name "x-ms-continuationtoken"
        }
        catch {
            $msg = $_.Exception.Message
            throw ("{0} falhou. {1}" -f $Operation, $msg)
        }
    }
    while (-not [string]::IsNullOrWhiteSpace($continuationToken))

    return $items
}

function Test-RepoDisabled {
    param([object]$Repo)

    $value = Get-PropValue -Obj $Repo -Name "isDisabled"

    if ([string]::IsNullOrWhiteSpace($value)) {
        return $false
    }

    try {
        return [System.Convert]::ToBoolean($value)
    }
    catch {
        return $false
    }
}

