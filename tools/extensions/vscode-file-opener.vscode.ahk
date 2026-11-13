; ============================================================
; VSCode
; ============================================================

OpenFilesInVSCode(files) {
    global ProjectRoot, CloseTabsBeforeOpen
    global OpenBatchSize, VSCodeOpenAfterCloseDelayMs, VSCodeBatchDelayMs
    global CodeCommand

    result := {
        closeAttempted: false,
        closedTabs: false,
        batches: 0,
        runOk: false,
        error: ""
    }

    if (!FileExist(CodeCommand)) {
        result.error := "VSCode não encontrado no caminho configurado: " CodeCommand
        return result
    }

    root := RTrim(GetFullPath(ProjectRoot), "\")

    if (CloseTabsBeforeOpen) {
        result.closeAttempted := true
        result.closedTabs := CloseAllVSCodeEditorsForProject(root)
        Sleep(VSCodeOpenAfterCloseDelayMs)
    }

    batch := []

    for filePath in files {
        batch.Push(filePath)

        if (batch.Length >= OpenBatchSize) {
            ok := OpenVSCodeBatch(root, batch)
            result.batches += 1
            result.runOk := result.runOk || ok
            batch := []
            Sleep(VSCodeBatchDelayMs)
        }
    }

    if (batch.Length > 0) {
        ok := OpenVSCodeBatch(root, batch)
        result.batches += 1
        result.runOk := result.runOk || ok
    }

    if (!result.runOk && result.error = "") {
        result.error := "Run do VSCode retornou falha. Confira se o caminho do VSCode está correto."
    }

    return result
}

OpenVSCodeBatch(root, files) {
    args := "-r " Quote(root)

    for filePath in files {
        args .= " " Quote(filePath)
    }

    return RunVSCodeCommand(args, root)
}

CloseAllVSCodeEditorsForProject(root) {
    global VSCodeCloseTabsDelayMs

    ReleaseMainGuiAlwaysOnTop()

    RunVSCodeCommand("-r " Quote(root), root)

    hwnd := WaitForVSCodeProjectWindow(root)

    if (!hwnd) {
        return false
    }

    try WinActivate("ahk_id " hwnd)
    try WinWaitActive("ahk_id " hwnd, , 0.8)

    Sleep(140)

    SendInput("{Ctrl down}k{Ctrl up}")
    Sleep(80)
    SendInput("{Ctrl down}w{Ctrl up}")

    Sleep(VSCodeCloseTabsDelayMs)

    return true
}

WaitForVSCodeProjectWindow(root) {
    global VSCodeWindowWaitMs

    startedAt := A_TickCount

    while ((A_TickCount - startedAt) < VSCodeWindowWaitMs) {
        hwnd := FindVSCodeProjectWindow(root)

        if (hwnd) {
            return hwnd
        }

        Sleep(80)
    }

    return 0
}

FindVSCodeProjectWindow(root) {
    SplitPath(root, &projectName)
    projectNameLower := StrLower(projectName)

    hwnds := []

    try {
        for hwnd in WinGetList("ahk_exe Code.exe") {
            hwnds.Push(hwnd)
        }
    }

    try {
        for hwnd in WinGetList("ahk_exe Code - Insiders.exe") {
            hwnds.Push(hwnd)
        }
    }

    for hwnd in hwnds {
        title := ""

        try title := WinGetTitle("ahk_id " hwnd)

        if (title != "" && InStr(StrLower(title), projectNameLower)) {
            return hwnd
        }
    }

    if (hwnds.Length > 0) {
        return hwnds[1]
    }

    return 0
}

FocusVSCodeProjectWindow(*) {
    global ProjectRoot

    hwnd := WaitForVSCodeProjectWindow(ProjectRoot)

    if (hwnd) {
        try WinActivate("ahk_id " hwnd)
    }
}

RunVSCodeCommand(args, workingDir) {
    global CodeCommand

    if (!FileExist(CodeCommand)) {
        return false
    }

    commandLower := StrLower(CodeCommand)

    try {
        if (EndsWith(commandLower, ".cmd") || EndsWith(commandLower, ".bat")) {
            command := Quote(A_ComSpec) " /d /c " Quote(Quote(CodeCommand) " " args)
            Run(command, workingDir, "Hide")
            return true
        }

        command := Quote(CodeCommand) " " args
        Run(command, workingDir)
        return true
    } catch {
        return false
    }
}

; ============================================================
; Clipboard e relatório manual
; ============================================================

CopyFoundFilesToClipboard(files) {
    global CopyFoundFilesContentToClipboard

    if (!CopyFoundFilesContentToClipboard) {
        return { copied: false, files: 0, chars: 0 }
    }

    chunks := []
    copiedCount := 0

    for filePath in files {
        try {
            content := FileRead(filePath, "UTF-8")
        } catch {
            try {
                content := FileRead(filePath)
            } catch {
                continue
            }
        }

        relativePath := GetRelativeProjectPath(filePath)

        header := "===== FILE: " relativePath " ====="
        footer := "===== END FILE: " relativePath " ====="

        content := RTrim(content, "`r`n")

        chunks.Push(header . "`r`n" . content . "`r`n" . footer)
        copiedCount += 1
    }

    if (chunks.Length = 0) {
        return { copied: false, files: 0, chars: 0 }
    }

    clipboardText := JoinArray(chunks, "`r`n`r`n")
    A_Clipboard := clipboardText

    return {
        copied: true,
        files: copiedCount,
        chars: StrLen(clipboardText)
    }
}

BuildReport(tokens, resolved, notFound, ambiguous, openResult, clipboardResult) {
    report := ""

    report .= "Resumo:`r`n"
    report .= "  Tokens detectados: " tokens.Length "`r`n"
    report .= "  Arquivos encontrados: " resolved.Length "`r`n"
    report .= "  Não encontrados: " UniqueArray(notFound).Length "`r`n"
    report .= "  Ambíguos: " UniqueArray(ambiguous).Length "`r`n"

    report .= "`r`nVSCode:`r`n"
    report .= "  Fechar abas tentou: " (openResult.closeAttempted ? "sim" : "não") "`r`n"
    report .= "  Fechamento confirmado: " (openResult.closedTabs ? "sim" : "não") "`r`n"
    report .= "  Lotes enviados: " openResult.batches "`r`n"
    report .= "  Comando executado: " (openResult.runOk ? "sim" : "não") "`r`n"

    if (openResult.HasOwnProp("error") && openResult.error != "") {
        report .= "  Erro: " openResult.error "`r`n"
    }

    if (clipboardResult.copied) {
        report .= "`r`nClipboard:`r`n"
        report .= "  Conteúdo copiado: " clipboardResult.files " arquivo(s), " clipboardResult.chars " caracteres.`r`n"
    }

    if (resolved.Length > 0) {
        report .= "`r`nArquivos abertos/resolvidos:`r`n"

        for filePath in resolved {
            report .= "  OK: " GetRelativeProjectPath(filePath) "`r`n"
        }
    }

    if (notFound.Length > 0) {
        report .= "`r`nNão encontrados:`r`n"

        for token in UniqueArray(notFound) {
            report .= "  X: " token "`r`n"
        }
    }

    if (ambiguous.Length > 0) {
        report .= "`r`nAmbíguos:`r`n"

        for token in UniqueArray(ambiguous) {
            report .= "  ?: " token "`r`n"
        }

        report .= "`r`nAmbíguo significa que existe mais de um arquivo com o mesmo nome. Cole o path com pasta para resolver.`r`n"
    }

    return report
}

