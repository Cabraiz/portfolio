# Logi EasySwitch AUTO WARMUP HOTFIRST
# Base: versão AUTO FAST BULK que funcionou.
# Mudança:
# - warmup automático no startup;
# - pré-monta reports dos canais 1/2/3 em memória;
# - na troca, envia fila HOT primeiro;
# - depois envia fallback amplo opcional;
# - sem opção manual de calibração;
# - menu continua enxuto.
#
# Sem internet, sem clipboard, sem startup, sem serviço, sem binário externo.

$ErrorActionPreference = "Stop"

$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HidCsPath = Join-Path $BaseDir "src\HidBridge.cs"
$ConfigPath = Join-Path $BaseDir "config\EdgeSwitch.config.ps1"

try {
    Add-Type -Path $HidCsPath -ErrorAction Stop
} catch {
    Write-Host "[ERRO] Falha ao compilar src\HidBridge.cs:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

if (Test-Path $ConfigPath) {
    . $ConfigPath
} else {
    Write-Host "[ERRO] Config não encontrado: $ConfigPath" -ForegroundColor Red
    exit 1
}

$script:TargetDeviceCache = $null
$script:PreparedReportsByChannel = @{}

# Funcoes de canal em arquivo irmao.
. "$PSScriptRoot\LogiEasySwitch.channels.ps1"

function Test-IsOnEdge([string]$Edge, [int]$X, [int]$WidthPixels) {
    $screen = [LogiEasySwitchSplit.Cursor]::GetVirtualScreen()

    if ($Edge -eq "left") {
        return ($X -ge [int]$screen.Left -and $X -le ([int]$screen.Left + [int]$WidthPixels))
    }

    if ($Edge -eq "right") {
        return ($X -le [int]$screen.Right -and $X -ge ([int]$screen.Right - [int]$WidthPixels))
    }

    return $false
}

function Test-IsBeyondRearmDistance([string]$Edge, [int]$X, [int]$DistancePixels) {
    $screen = [LogiEasySwitchSplit.Cursor]::GetVirtualScreen()

    if ($Edge -eq "left") {
        return ($X -gt ([int]$screen.Left + [int]$DistancePixels))
    }

    if ($Edge -eq "right") {
        return ($X -lt ([int]$screen.Right - [int]$DistancePixels))
    }

    return $true
}

function Start-EdgeWatcher(
    [string]$Edge,
    [int]$TargetChannel,
    [int]$WidthPixels,
    [int]$DwellMilliseconds,
    [int]$CooldownMilliseconds,
    [int]$PollMilliseconds,
    [bool]$RequireLeaveAndReturn,
    [bool]$Verbose
) {
    Clear-Host

    $edgeName = if ($Edge -eq "left") { "esquerda" } else { "direita" }
    $screen = [LogiEasySwitchSplit.Cursor]::GetVirtualScreen()

    Write-Host "======================================="
    Write-Host " Edge Watcher HOTFIRST"
    Write-Host "======================================="
    Write-Host "Borda: $edgeName"
    Write-Host "Ação: trocar para canal $TargetChannel"
    Write-Host "Largura: $WidthPixels px"
    Write-Host "Dwell: $DwellMilliseconds ms"
    Write-Host "Poll: $PollMilliseconds ms"
    Write-Host "Cooldown: $CooldownMilliseconds ms"
    Write-Host "Rearm distance: $RearmDistancePixels px"
    Write-Host "Warmup cache: $UsePreparedPayloadCache"
    Write-Host "Hot first: $HotFirstEnabled"
    Write-Host "Fallback: $SendFallbackBurstAfterHot"
    Write-Host "Virtual screen: Left=$($screen.Left), Right=$($screen.Right), Width=$($screen.Width)"
    Write-Host ""
    Write-Host "Encoste o mouse na BORDA $($edgeName.ToUpper()) para trocar."
    Write-Host "Pressione Q para parar e voltar ao menu."
    Write-Host ""

    $insideSince = $null
    $lastFire = [DateTime]::MinValue
    $armed = $true
    $hardLocked = $false

    while ($true) {
        if ([Console]::KeyAvailable) {
            $key = [Console]::ReadKey($true)
            if ($key.Key -eq [ConsoleKey]::Q) { break }
        }

        $pos = [LogiEasySwitchSplit.Cursor]::GetPosition()
        $isInside = Test-IsOnEdge -Edge $Edge -X ([int]$pos.X) -WidthPixels $WidthPixels
        $isBeyondRearm = Test-IsBeyondRearmDistance -Edge $Edge -X ([int]$pos.X) -DistancePixels ([int]$RearmDistancePixels)
        $now = Get-Date

        if ($Verbose) {
            Write-Host ("X={0} Y={1} edge={2} inside={3} armed={4} locked={5} beyondRearm={6}" -f $pos.X, $pos.Y, $Edge, $isInside, $armed, $hardLocked, $isBeyondRearm)
        }

        if ($hardLocked) {
            if ($isBeyondRearm) {
                $hardLocked = $false
                $armed = $true
                $insideSince = $null
                Write-Host ("[{0}] Rearmado: cursor afastou {1}px da borda." -f (Get-Date -Format "HH:mm:ss.fff"), $RearmDistancePixels) -ForegroundColor DarkGray
            } else {
                Start-Sleep -Milliseconds $PollMilliseconds
                continue
            }
        }

        if (-not $isInside) {
            $insideSince = $null

            if ($RequireLeaveAndReturn -and $isBeyondRearm) {
                $armed = $true
            }
        } else {
            if ($null -eq $insideSince) { $insideSince = $now }

            $dwellOk = (($now - $insideSince).TotalMilliseconds -ge $DwellMilliseconds)
            $cooldownOk = (($now - $lastFire).TotalMilliseconds -ge $CooldownMilliseconds)

            if ($armed -and $dwellOk -and $cooldownOk) {
                Write-Host ("[{0}] Borda {1} -> canal {2}" -f (Get-Date -Format "HH:mm:ss.fff"), $edgeName, $TargetChannel) -ForegroundColor Cyan

                [void](Switch-ChannelFast -Channel $TargetChannel -Quiet)

                $lastFire = Get-Date
                $armed = $false
                $hardLocked = $true

                Write-Host ("Enviado. Travado até afastar {0}px da borda. Q para parar." -f $RearmDistancePixels) -ForegroundColor Green
            }
        }

        Start-Sleep -Milliseconds $PollMilliseconds
    }
}

function Start-LeftEdgeWatcher {
    Start-EdgeWatcher `
        -Edge "left" `
        -TargetChannel ([int]$LeftEdgeTargetChannel) `
        -WidthPixels ([int]$LeftEdgeWidthPixels) `
        -DwellMilliseconds ([int]$LeftEdgeDwellMilliseconds) `
        -CooldownMilliseconds ([int]$LeftEdgeCooldownMilliseconds) `
        -PollMilliseconds ([int]$LeftEdgePollMilliseconds) `
        -RequireLeaveAndReturn ([bool]$LeftEdgeRequireLeaveAndReturn) `
        -Verbose ([bool]$LeftEdgeVerbose)
}

function Start-RightEdgeWatcher {
    Start-EdgeWatcher `
        -Edge "right" `
        -TargetChannel ([int]$RightEdgeTargetChannel) `
        -WidthPixels ([int]$RightEdgeWidthPixels) `
        -DwellMilliseconds ([int]$RightEdgeDwellMilliseconds) `
        -CooldownMilliseconds ([int]$RightEdgeCooldownMilliseconds) `
        -PollMilliseconds ([int]$RightEdgePollMilliseconds) `
        -RequireLeaveAndReturn ([bool]$RightEdgeRequireLeaveAndReturn) `
        -Verbose ([bool]$RightEdgeVerbose)
}

function Show-Menu {
    while ($true) {
        Clear-Host
        Write-Host "======================================="
        Write-Host " Logi EasySwitch AUTO WARMUP HOTFIRST"
        Write-Host "======================================="
        Write-Host "1) Trocar para canal 1"
        Write-Host "2) Trocar para canal 2"
        Write-Host "3) Trocar para canal 3"
        Write-Host "4) Monitorar borda esquerda -> canal 2"
        Write-Host "5) Monitorar borda direita -> canal 3"
        Write-Host ""
        Write-Host "Q) Sair"
        Write-Host ""

        $choice = Read-Host "Escolha"

        switch ($choice.ToUpperInvariant()) {
            "1" { Switch-ChannelFast 1; Read-Host | Out-Null }
            "2" { Switch-ChannelFast 2; Read-Host | Out-Null }
            "3" { Switch-ChannelFast 3; Read-Host | Out-Null }
            "4" { Start-LeftEdgeWatcher; Read-Host "Enter para voltar ao menu" | Out-Null }
            "5" { Start-RightEdgeWatcher; Read-Host "Enter para voltar ao menu" | Out-Null }
            "Q" { return }
            default { Write-Host "Opção inválida."; Start-Sleep -Milliseconds 700 }
        }
    }
}

if ($AutoWarmupOnStart) {
    Initialize-AutoWarmup
}

Show-Menu
