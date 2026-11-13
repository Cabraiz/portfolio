# Reports HID, warmup e troca de canal (dot-source de LogiEasySwitch.ps1).

function New-ReportBytes([int]$OutLen, [byte[]]$Payload) {
    $buf = New-Object byte[] $OutLen
    $len = [Math]::Min($Payload.Length, $OutLen)
    [Array]::Copy($Payload, 0, $buf, 0, $len)
    return $buf
}

function Get-ChannelValue([int]$Channel) {
    if ($Channel -eq 1) { return [byte]$Channel1Value }
    if ($Channel -eq 2) { return [byte]$Channel2Value }
    if ($Channel -eq 3) { return [byte]$Channel3Value }
    throw "Canal inválido: $Channel"
}

function Convert-PairStringToObject([string]$Pair) {
    $parts = $Pair.Split("/")
    if ($parts.Count -ne 2) { throw "Par inválido: $Pair" }

    return [pscustomobject]@{
        Feature = [Convert]::ToByte($parts[0], 16)
        Function = [Convert]::ToByte($parts[1], 16)
        Label = $Pair
    }
}

function Get-HotFeatureFunctionPairs {
    $pairs = New-Object System.Collections.Generic.List[object]

    foreach ($pair in $HotPairs) {
        $pairs.Add((Convert-PairStringToObject $pair))
    }

    return $pairs
}

function Get-FallbackFeatureFunctionPairs {
    $pairs = New-Object System.Collections.Generic.List[object]

    # Ordem repensada:
    # 1) pares que já eram fortes na V2;
    # 2) família 0A;
    # 3) família 09.
    $pairs.Add([pscustomobject]@{ Feature=[byte]0x09; Function=[byte]0x1E; Label="09/1E" })
    $pairs.Add([pscustomobject]@{ Feature=[byte]0x0C; Function=[byte]0x1C; Label="0C/1C" })

    foreach ($fn in 0x10..0x1F) {
        $pairs.Add([pscustomobject]@{ Feature=[byte]0x0A; Function=[byte]$fn; Label=("0A/{0:X2}" -f $fn) })
    }

    foreach ($fn in 0x10..0x1F) {
        $pairs.Add([pscustomobject]@{ Feature=[byte]0x09; Function=[byte]$fn; Label=("09/{0:X2}" -f $fn) })
    }

    return $pairs
}

function Get-TargetDevices([switch]$Refresh) {
    if (-not $Refresh -and $null -ne $script:TargetDeviceCache) {
        return $script:TargetDeviceCache
    }

    $devices = [LogiEasySwitchSplit.Hid]::ListLogitech()

    $targets = @(
        $devices | Where-Object {
            $_.UsagePage -in 0xFF00,0xFF43 -and $_.OutputReportByteLength -gt 0
        } | Sort-Object `
            @{ Expression = { if ($_.ProductId -eq 0xC548) { 0 } elseif ($_.ProductId -eq 0xC52B) { 1 } else { 2 } } }, `
            @{ Expression = { if ($_.OutputReportByteLength -eq 7) { 0 } elseif ($_.OutputReportByteLength -eq 20) { 1 } else { 2 } } }
    )

    $script:TargetDeviceCache = $targets
    return $script:TargetDeviceCache
}

function New-Payload([byte]$Msg, [int]$DeviceIndex, [byte]$Feature, [byte]$Function, [byte]$ChannelValue) {
    $p = New-Object byte[] 7
    $p[0] = [byte]$Msg
    $p[1] = [byte]$DeviceIndex
    $p[2] = [byte]$Feature
    $p[3] = [byte]$Function
    $p[4] = [byte]$ChannelValue
    $p[5] = 0x00
    $p[6] = 0x00
    return $p
}

function Convert-ReportListToJaggedArray($ReportList) {
    $arr = [byte[][]]::new($ReportList.Count)
    for ($i = 0; $i -lt $ReportList.Count; $i++) {
        $arr[$i] = [byte[]]$ReportList[$i]
    }
    return $arr
}

function New-ReportPlanForChannel([int]$Channel) {
    $targets = Get-TargetDevices
    $channelValue = Get-ChannelValue $Channel

    $plan = New-Object System.Collections.Generic.List[object]

    foreach ($dev in $targets) {
        $messageTypes = if ([int]$dev.OutputReportByteLength -ge 20) {
            @([byte]0x11, [byte]0x10)
        } else {
            @([byte]0x10)
        }

        $hotReports = New-Object System.Collections.Generic.List[byte[]]
        $fallbackReports = New-Object System.Collections.Generic.List[byte[]]

        if ($HotFirstEnabled) {
            $hotPairsResolved = Get-HotFeatureFunctionPairs

            foreach ($msg in $messageTypes) {
                foreach ($deviceIndex in $HotDeviceIndexes) {
                    foreach ($pair in $hotPairsResolved) {
                        $payload = New-Payload -Msg $msg -DeviceIndex ([int]$deviceIndex) -Feature $pair.Feature -Function $pair.Function -ChannelValue $channelValue
                        $report = New-ReportBytes -OutLen ([int]$dev.OutputReportByteLength) -Payload $payload
                        $hotReports.Add($report)
                    }
                }
            }
        }

        if ($SendFallbackBurstAfterHot) {
            $fallbackPairs = Get-FallbackFeatureFunctionPairs

            foreach ($msg in $messageTypes) {
                foreach ($deviceIndex in 1..([int]$MaxDeviceIndex)) {
                    foreach ($pair in $fallbackPairs) {
                        $payload = New-Payload -Msg $msg -DeviceIndex $deviceIndex -Feature $pair.Feature -Function $pair.Function -ChannelValue $channelValue
                        $report = New-ReportBytes -OutLen ([int]$dev.OutputReportByteLength) -Payload $payload
                        $fallbackReports.Add($report)
                    }
                }
            }
        }

        $plan.Add([pscustomobject]@{
            Target = $dev
            HotReports = $hotReports
            FallbackReports = $fallbackReports
        })
    }

    return $plan
}

function Initialize-AutoWarmup {
    Clear-Host
    Write-Host "======================================="
    Write-Host " Logi EasySwitch AUTO WARMUP"
    Write-Host "======================================="
    Write-Host "Preparando endpoints e filas de reports..."
    Write-Host ""

    [void](Get-TargetDevices -Refresh)

    foreach ($channel in 1,2,3) {
        $script:PreparedReportsByChannel["$channel"] = New-ReportPlanForChannel -Channel $channel
        $hotCount = 0
        $fallbackCount = 0

        foreach ($item in $script:PreparedReportsByChannel["$channel"]) {
            $hotCount += $item.HotReports.Count
            $fallbackCount += $item.FallbackReports.Count
        }

        Write-Host ("Canal {0}: hot={1}, fallback={2}" -f $channel, $hotCount, $fallbackCount) -ForegroundColor DarkGray
    }

    Write-Host ""
    Write-Host "Warmup pronto." -ForegroundColor Green
    Start-Sleep -Milliseconds 550
}

function Send-ReportBatch($Target, $Reports) {
    if (-not $Reports -or $Reports.Count -eq 0) {
        return [pscustomobject]@{ Total = 0; Accepted = 0; Failed = 0 }
    }

    $jagged = Convert-ReportListToJaggedArray $Reports
    $summary = [LogiEasySwitchSplit.Hid]::SendBulkReports(
        $Target.Path,
        $jagged,
        [bool]$UseSetOutputReport,
        [bool]$UseWriteFile,
        [int]$SwitchInterPacketDelayMilliseconds
    )

    return [pscustomobject]@{
        Total = [int]$summary.Total
        Accepted = [int]$summary.Accepted
        Failed = [int]$summary.Failed
    }
}

function Switch-ChannelFast([int]$Channel, [switch]$Quiet) {
    if (-not $Quiet) {
        Clear-Host
        Write-Host "Logi EasySwitch AUTO WARMUP HOTFIRST" -ForegroundColor Cyan
        Write-Host "Trocando para canal $Channel..."
        Write-Host ""
    }

    if ($UsePreparedPayloadCache -and $script:PreparedReportsByChannel.ContainsKey("$Channel")) {
        $plan = $script:PreparedReportsByChannel["$Channel"]
    } else {
        $plan = New-ReportPlanForChannel -Channel $Channel
        if ($UsePreparedPayloadCache) {
            $script:PreparedReportsByChannel["$Channel"] = $plan
        }
    }

    if (-not $plan -or $plan.Count -eq 0) {
        if (-not $Quiet) {
            Write-Host "[ERRO] Nenhum endpoint Logitech HID candidato encontrado." -ForegroundColor Red
        }
        return $false
    }

    $total = 0
    $accepted = 0
    $failed = 0

    # 1) HOT FIRST: poucos reports, ordem mais provável.
    foreach ($item in $plan) {
        $s = Send-ReportBatch -Target $item.Target -Reports $item.HotReports
        $total += $s.Total
        $accepted += $s.Accepted
        $failed += $s.Failed
    }

    # 2) Fallback amplo, opcional, para manter a compatibilidade que já funcionou.
    if ($SendFallbackBurstAfterHot) {
        foreach ($item in $plan) {
            $s = Send-ReportBatch -Target $item.Target -Reports $item.FallbackReports
            $total += $s.Total
            $accepted += $s.Accepted
            $failed += $s.Failed
        }
    }

    if (-not $Quiet) {
        Write-Host "Comando concluído." -ForegroundColor Green
        Write-Host "Warmup cache: $UsePreparedPayloadCache"
        Write-Host "Hot first: $HotFirstEnabled"
        Write-Host "Fallback após hot: $SendFallbackBurstAfterHot"
        Write-Host "Tentativas: $total"
        Write-Host "Aceitas pelo Windows: $accepted"
        Write-Host "Recusadas pelo Windows: $failed"
        Write-Host ""
        Write-Host "Enter para voltar ao menu."
    }

    return ($accepted -gt 0)
}

