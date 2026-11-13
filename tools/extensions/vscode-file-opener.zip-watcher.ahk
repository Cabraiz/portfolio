; ============================================================
; ZIP Watcher
; ============================================================

StartZipWatcher() {
    global AutoZipWatcherEnabled, WatchIntervalMs

    RefreshWatcherText()

    if (AutoZipWatcherEnabled) {
        SetTimer(ScanDownloadsForNewZip, WatchIntervalMs)
    } else {
        SetTimer(ScanDownloadsForNewZip, 0)
    }
}

ToggleZipWatcher(*) {
    global AutoZipWatcherEnabled

    AutoZipWatcherEnabled := !AutoZipWatcherEnabled
    SaveConfig()
    StartZipWatcher()
    SetZipStatus(AutoZipWatcherEnabled ? "Watcher ligado." : "Watcher desligado.", AutoZipWatcherEnabled ? "ok" : "warn")
    SetZipHud(AutoZipWatcherEnabled ? "idle" : "vscode_off", AutoZipWatcherEnabled ? "Monitoramento de Downloads ativo." : "Monitoramento pausado.", AutoZipWatcherEnabled ? "ok" : "warn")
}

MarkExistingDownloadsZips() {
    global DownloadsDir, ZipSeen

    if (!DirExist(DownloadsDir)) {
        return
    }

    Loop Files DownloadsDir "\*.zip", "F" {
        signature := GetFileSignature(A_LoopFileFullPath)
        if (signature != "") {
            ZipSeen[signature] := true
        }
    }
}

ScanDownloadsForNewZip(*) {
    global AutoZipWatcherEnabled, DownloadsDir, IsZipProcessing, MaxAutoZipBytes, ZipSeen

    if (!AutoZipWatcherEnabled || IsZipProcessing) {
        return
    }

    if (!DirExist(DownloadsDir)) {
        SetZipStatus("Downloads não existe: " DownloadsDir, "error")
        return
    }

    newestPath := ""
    newestTime := ""

    Loop Files DownloadsDir "\*.zip", "F" {
        zipPath := A_LoopFileFullPath
        signature := GetFileSignature(zipPath)

        if (signature = "" || ZipSeen.Has(signature)) {
            continue
        }

        size := SafeFileGetSize(zipPath)

        if (size <= 0) {
            continue
        }

        if (size > MaxAutoZipBytes) {
            ZipSeen[signature] := true
            SetZipStatus("ZIP ignorado por tamanho > 3MB: " A_LoopFileName " (" FormatBytes(size) ")", "warn")
            continue
        }

        if (!IsZipStable(zipPath)) {
            SetZipStatus("Aguardando download estabilizar: " A_LoopFileName " (" FormatBytes(size) ")", "info")
            SetZipHud("stabilizing", A_LoopFileName " ainda está chegando em Downloads.", "info")
            continue
        }

        modTime := SafeFileGetTime(zipPath)

        if (newestPath = "" || modTime > newestTime) {
            newestPath := zipPath
            newestTime := modTime
        }
    }

    if (newestPath != "") {
        SetTimer(() => ProcessZipFile(newestPath, true), -10)
    }
}

ProcessLatestZipClicked(*) {
    global DownloadsDir, MaxAutoZipBytes

    if (!DirExist(DownloadsDir)) {
        SetZipStatus("Downloads não existe: " DownloadsDir, "error")
        return
    }

    latestPath := ""
    latestTime := ""
    latestSize := 0

    Loop Files DownloadsDir "\*.zip", "F" {
        size := SafeFileGetSize(A_LoopFileFullPath)

        if (size <= 0 || size > MaxAutoZipBytes) {
            continue
        }

        modTime := SafeFileGetTime(A_LoopFileFullPath)

        if (latestPath = "" || modTime > latestTime) {
            latestPath := A_LoopFileFullPath
            latestTime := modTime
            latestSize := size
        }
    }

    if (latestPath = "") {
        SetZipStatus("Nenhum ZIP menor que 3MB encontrado em Downloads.", "warn")
        return
    }

    ProcessZipFile(latestPath, false)
}

ProcessZipFile(zipPath, markSeen := true) {
    global IsZipProcessing, ZipSeen, LastProcessedZip

    if (IsZipProcessing) {
        return
    }

    IsZipProcessing := true
    signature := GetFileSignature(zipPath)

    try {
        if (!FileExist(zipPath)) {
            SetZipStatus("ZIP não encontrado: " zipPath, "error")
            IsZipProcessing := false
            return
        }

        LastProcessedZip := zipPath
        SetBanner("PROCESSANDO ZIP — extraindo e analisando estrutura...", "info")
        SetZipStatus("Processando " GetFileName(zipPath) " (" FormatBytes(SafeFileGetSize(zipPath)) ")", "info")
        SetZipHud("detected", GetFileName(zipPath) " recebido para aplicação.", "info")

        result := ApplyZipToProject(zipPath)

        if (markSeen && signature != "") {
            ZipSeen[signature] := true
        }

        SetResult(result.report)

        if (result.success) {
            if (result.HasOwnProp("openTabs") && result.openTabs) {
                SetBanner("OK — ZIP aplicado e arquivos abertos no VSCode.", "ok")
                SetZipStatus("OK: " GetFileName(zipPath) " aplicado. " result.appliedCount " arquivo(s). Abas abertas.", "ok")
            } else {
                SetBanner("OK — ZIP aplicado em modo silencioso. VSCode não foi focado.", "ok")
                SetZipStatus("OK: " GetFileName(zipPath) " aplicado na surdina. " result.appliedCount " arquivo(s).", "ok")
            }
        } else {
            SetBanner("ERRO/AVISO — ZIP não foi aplicado completamente. Veja o diagnóstico.", "error")
            SetZipStatus("Falhou ou ficou incompleto: " GetFileName(zipPath), "error")
        }
    } catch as err {
        if (markSeen && signature != "") {
            ZipSeen[signature] := true
        }

        SetBanner("ERRO — processamento do ZIP interrompido.", "error")
        SetZipStatus("Erro ao processar " GetFileName(zipPath), "error")
        SetZipHud("failed", "Erro inesperado durante processamento do ZIP.", "error")
        SetResult(FormatAhkError(err))
    }

    IsZipProcessing := false
}

IsZipStable(zipPath) {
    global ZipStableMap, ZipStableMs

    size := SafeFileGetSize(zipPath)

    if (size <= 0) {
        return false
    }

    key := StrLower(zipPath)

    if (!ZipStableMap.Has(key)) {
        ZipStableMap[key] := { size: size, tick: A_TickCount }
        return false
    }

    entry := ZipStableMap[key]

    if (entry.size != size) {
        ZipStableMap[key] := { size: size, tick: A_TickCount }
        return false
    }

    return (A_TickCount - entry.tick) >= ZipStableMs
}

GetFileSignature(path) {
    size := SafeFileGetSize(path)
    modTime := SafeFileGetTime(path)

    if (size <= 0 || modTime = "") {
        return ""
    }

    return StrLower(path) "|" size "|" modTime
}

ApplyZipToProject(zipPath) {
    global TempRoot, ProjectRoot, OpenTabsAfterZipApply

    SetZipHud("detected", GetFileName(zipPath) " pronto para extração.", "info")
    EnsureDir(TempRoot)

    zipName := GetNameNoExt(zipPath)
    stamp := FormatTime(A_Now, "yyyyMMdd-HHmmss")
    extractDir := TempRoot "\" stamp "-" SanitizePathPart(zipName)

    if (DirExist(extractDir)) {
        DirDelete(extractDir, true)
    }

    EnsureDir(extractDir)

    SetZipHud("extracting", "Extraindo em: " extractDir, "info")
    extractOk := ExtractZip(zipPath, extractDir)

    if (!extractOk) {
        SetZipHud("failed", "Falha na extração do ZIP.", "error")
        return {
            success: false,
            appliedCount: 0,
            openTabs: OpenTabsAfterZipApply,
            report: "Falha ao extrair ZIP:`r`n" zipPath "`r`n`r`nVerifique se PowerShell/Expand-Archive está disponível e se o ZIP não está corrompido."
        }
    }

    SetZipHud("collecting", "Extração concluída. Lendo arquivos compatíveis.", "info")
    files := CollectExtractedFiles(extractDir)

    if (files.Length = 0) {
        SetZipHud("failed", "ZIP extraído, mas sem arquivos compatíveis.", "error")
        return {
            success: false,
            appliedCount: 0,
            openTabs: OpenTabsAfterZipApply,
            report: "ZIP extraído, mas nenhum arquivo compatível foi encontrado.`r`nZIP: " zipPath
        }
    }

    SetZipHud("planning", files.Length " arquivo(s) compatível(is). Inferindo destino no projeto.", "info")
    planResult := BuildZipApplyPlan(files)

    if (planResult.plan.Length = 0) {
        SetZipHud("failed", "Nenhum destino seguro foi inferido. Nada foi copiado.", "error")
        report := "Nenhum arquivo seguro para aplicar.`r`n`r`n"
        report .= BuildZipAnalysisReport(zipPath, extractDir, files, planResult, { applied: [], failed: [], backupDir: "" }, MakeOpenResultSkipped("ZIP não chegou à etapa de abertura de abas."))

        return { success: false, appliedCount: 0, openTabs: OpenTabsAfterZipApply, report: report }
    }

    SetZipHud("copying", planResult.plan.Length " arquivo(s) no plano. Copiando/substituindo com backup.", "info")
    applyResult := CopyPlannedFiles(planResult.plan, zipPath)

    if (applyResult.applied.Length > 0) {
        SetZipHud("manifest", "Criando manifest para rollback do último ZIP.", "info")
        manifestPath := SaveApplyManifest(applyResult, zipPath)
        applyResult.manifest := manifestPath
    }

    openedFiles := []
    for item in applyResult.applied {
        openedFiles.Push(item.target)
    }

    openResult := MakeOpenResultSkipped("Modo silencioso ZIP: abrir abas após aplicar está OFF.")

    if (OpenTabsAfterZipApply && openedFiles.Length > 0) {
        SetZipHud("vscode", openedFiles.Length " arquivo(s) aplicado(s). Abrindo abas no VSCode.", "info")
        openResult := OpenFilesInVSCode(openedFiles)
    } else if (openedFiles.Length > 0) {
        SetZipHud("vscode_skip", openedFiles.Length " arquivo(s) aplicado(s). VSCode preservado sem foco.", "warn")
    }

    report := BuildZipAnalysisReport(zipPath, extractDir, files, planResult, applyResult, openResult)

    success := (applyResult.applied.Length > 0 && applyResult.failed.Length = 0 && (!OpenTabsAfterZipApply || openResult.runOk))

    if (success) {
        SetZipHud("done", OpenTabsAfterZipApply ? "Entrega concluída com abas abertas." : "Entrega concluída em modo silencioso.", "ok")
    } else {
        SetZipHud("failed", "Entrega incompleta. Veja o diagnóstico.", "error")
    }

    return { success: success, appliedCount: applyResult.applied.Length, openTabs: OpenTabsAfterZipApply, report: report }
}

ExtractZip(zipPath, destinationDir) {
    ps := "powershell.exe"
    commandText := "$ErrorActionPreference = 'Stop'; Expand-Archive -LiteralPath " PSEscape(zipPath) " -DestinationPath " PSEscape(destinationDir) " -Force"
    command := Quote(ps) " -NoProfile -ExecutionPolicy Bypass -Command " Quote(commandText)

    try {
        exitCode := RunWait(command, , "Hide")
        return exitCode = 0
    } catch {
        return false
    }
}

CollectExtractedFiles(extractDir) {
    files := []

    Loop Files extractDir "\*", "FR" {
        fullPath := A_LoopFileFullPath
        lowerPath := StrLower(fullPath)

        if (InStr(lowerPath, "\__macosx\") || InStr(lowerPath, "\.ds_store")) {
            continue
        }

        if (!IsSupportedFile(fullPath)) {
            continue
        }

        rel := GetRelativePath(fullPath, extractDir)
        rel := NormalizeSlashes(rel)

        if (rel = "") {
            continue
        }

        files.Push({ source: fullPath, relative: rel })
    }

    return files
}
