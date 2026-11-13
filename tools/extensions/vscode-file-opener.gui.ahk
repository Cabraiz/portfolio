; ============================================================
; GUI
; ============================================================

BuildGui() {
    global MainGui, BannerText, InputEdit, ResultEdit, ConfigText, AppName
    global WatcherText, ZipStatusText, ZipDeliveryHudText, WatchToggleButton, ZipOpenTabsToggleButton
    global GuiInitialWidth, GuiInitialHeight, GuiContentWidth

    contentW := GuiContentWidth
    gap := 6
    buttonH := 25
    halfW := Floor((contentW - gap) / 2)
    thirdW := Floor((contentW - (gap * 2)) / 3)

    ; Sem +Resize: mantém a HUD travada em 9:16 e evita passar de 620px de altura.
    MainGui := Gui("+AlwaysOnTop", AppName)
    MainGui.SetFont("s8", "Segoe UI")

    MainGui.AddText(
        "xm ym w" contentW " h32",
        "ZIP watcher: aplica ZIP novo menor que 3MB. Default: silencioso, sem focar VSCode."
    )

    BannerText := MainGui.AddText("xm y+4 w" contentW " h30 +Border c555555", "AGUARDANDO — cole paths ou baixe um ZIP pequeno em Downloads.")

    WatcherText := MainGui.AddText("xm y+3 w" contentW " h23 +Border c555555", "WATCHER — inicializando...")
    ZipStatusText := MainGui.AddText("xm y+3 w" contentW " h32 +Border c555555", "ZIP — nenhum ZIP processado nesta sessão.")
    ZipDeliveryHudText := MainGui.AddText("xm y+3 w" contentW " h76 +Border c555555", "HUD ENTREGA ZIP — inicializando...")

    MainGui.AddText(
        "xm y+4 w" contentW " h24 c777777",
        "Inferência: genérica — remove wrapper, testa path direto e encaixe por sufixo dentro do ProjectRoot."
    )

    InputEdit := MainGui.AddEdit("xm y+4 w" contentW " h65 WantTab -Wrap")

    openButton := MainGui.AddButton("xm y+6 w" halfW " h" buttonH " Default", "Abrir paths")
    openButton.OnEvent("Click", QueueProcessInput)

    pasteButton := MainGui.AddButton("x+" gap " yp w" halfW " h" buttonH, "Colar e abrir")
    pasteButton.OnEvent("Click", PasteClipboardAndQueue)

    processZipButton := MainGui.AddButton("xm y+4 w" halfW " h" buttonH, "Processar ZIP")
    processZipButton.OnEvent("Click", ProcessLatestZipClicked)

    revertZipButton := MainGui.AddButton("x+" gap " yp w" halfW " h" buttonH, "Reverter ZIP")
    revertZipButton.OnEvent("Click", RevertLastApplyClicked)

    WatchToggleButton := MainGui.AddButton("xm y+4 w" halfW " h" buttonH, "Watcher ON")
    WatchToggleButton.OnEvent("Click", ToggleZipWatcher)

    ZipOpenTabsToggleButton := MainGui.AddButton("x+" gap " yp w" halfW " h" buttonH, "Abas ZIP: OFF")
    ZipOpenTabsToggleButton.OnEvent("Click", ToggleZipOpenTabsAfterApply)

    chooseCodeButton := MainGui.AddButton("xm y+6 w" thirdW " h" buttonH, "VSCode")
    chooseCodeButton.OnEvent("Click", ChooseVSCodeClicked)

    chooseRootButton := MainGui.AddButton("x+" gap " yp w" thirdW " h" buttonH, "Projeto")
    chooseRootButton.OnEvent("Click", ChooseProjectRootClicked)

    chooseDownloadsButton := MainGui.AddButton("x+" gap " yp w" thirdW " h" buttonH, "Downloads")
    chooseDownloadsButton.OnEvent("Click", AskDownloadsDir)

    backupFolderButton := MainGui.AddButton("xm y+4 w" halfW " h" buttonH, "Abrir backup")
    backupFolderButton.OnEvent("Click", OpenBackupFolderClicked)

    clearButton := MainGui.AddButton("x+" gap " yp w" halfW " h" buttonH, "Limpar")
    clearButton.OnEvent("Click", ClearAll)

    MainGui.AddText("xm y+5 w" contentW " h16", "Resultado / diagnóstico:")
    ResultEdit := MainGui.AddEdit("xm y+3 w" contentW " h80 ReadOnly -Wrap")

    ConfigText := MainGui.AddText("xm y+4 w" contentW " h70 c555555", "")

    RefreshConfigText()
    RefreshWatcherText()
    RefreshZipOpenTabsToggleText()
    SetZipHud("idle", "Aguardando ZIP novo ou processamento manual.", "info")
    SetBanner("AGUARDANDO — manual ou automático pronto.", "info")

    MainGui.OnEvent("Size", GuiResize)
    MainGui.OnEvent("Close", (*) => ExitApp())

    MainGui.Show("w" GuiInitialWidth " h" GuiInitialHeight)

    KeepWindowReady()
}

ChooseVSCodeClicked(*) {
    AskVSCode()
    RefreshConfigText()
    SetBanner("OK — VSCode selecionado.", "ok")
    KeepWindowReady()
}

ChooseProjectRootClicked(*) {
    AskProjectRoot()
    RefreshConfigText()
    SetBanner("OK — projeto selecionado.", "ok")
    KeepWindowReady()
}

RefreshConfigText() {
    global ConfigText, CodeCommand, ProjectRoot, DownloadsDir
    global CloseTabsBeforeOpen, CopyFoundFilesContentToClipboard, OpenBatchSize, OpenTabsAfterZipApply
    global DrivingRootRelative, MobileRootRelative, MaxAutoZipBytes, GuiInitialWidth, GuiMaxHeight

    closeMode := CloseTabsBeforeOpen ? "ligado" : "desligado"
    copyMode := CopyFoundFilesContentToClipboard ? "ligado" : "desligado"
    zipOpenMode := OpenTabsAfterZipApply ? "ligado" : "desligado/silencioso"
    maxMb := Round(MaxAutoZipBytes / 1024 / 1024, 2)

    ConfigText.Value :=
        "Layout: 9:16 " GuiInitialWidth "x" GuiMaxHeight " | ZIP abas: " zipOpenMode " | Manual fecha abas: " closeMode " | Lote: " OpenBatchSize "`n"
        . "VSCode: " CodeCommand "`n"
        . "Projeto: " ProjectRoot "`n"
        . "Downloads: " DownloadsDir " | ZIP máx.: " maxMb " MB`n"
        . "Base principal: " ProjectRoot
}

RefreshWatcherText() {
    global WatcherText, AutoZipWatcherEnabled, DownloadsDir, MaxAutoZipBytes, WatchToggleButton

    state := AutoZipWatcherEnabled ? "LIGADO" : "DESLIGADO"
    maxMb := Round(MaxAutoZipBytes / 1024 / 1024, 2)

    try {
        WatcherText.Opt(AutoZipWatcherEnabled ? "c007000" : "c9A5A00")
        WatcherText.Value := "WATCHER " state " — monitorando " DownloadsDir " — processa apenas .zip novo menor que " maxMb " MB."
        WatchToggleButton.Text := AutoZipWatcherEnabled ? "Watcher ON" : "Watcher OFF"
    }
}

RefreshZipOpenTabsToggleText() {
    global ZipOpenTabsToggleButton, OpenTabsAfterZipApply

    try {
        ZipOpenTabsToggleButton.Text := OpenTabsAfterZipApply ? "Abas ZIP: ON" : "Abas ZIP: OFF"
    }
}

ToggleZipOpenTabsAfterApply(*) {
    global OpenTabsAfterZipApply

    OpenTabsAfterZipApply := !OpenTabsAfterZipApply
    SaveConfig()
    RefreshZipOpenTabsToggleText()
    RefreshConfigText()

    if (OpenTabsAfterZipApply) {
        SetZipStatus("Abrir abas após aplicar ZIP ligado. Próximo ZIP vai focar/abrir VSCode.", "ok")
        SetZipHud("vscode_on", "Modo revisão ligado: após aplicar o ZIP, os arquivos alterados serão abertos no VSCode.", "ok")
    } else {
        SetZipStatus("Abrir abas após aplicar ZIP desligado. Próximo ZIP será aplicado na surdina.", "warn")
        SetZipHud("vscode_off", "Modo silencioso ligado: ZIP será extraído, copiado e versionado com backup sem focar VSCode.", "warn")
    }
}

SetZipHud(stage := "idle", detail := "", kind := "info") {
    global ZipDeliveryHudText

    try {
        if (kind = "ok") {
            ZipDeliveryHudText.Opt("c007000")
        } else if (kind = "warn") {
            ZipDeliveryHudText.Opt("c9A5A00")
        } else if (kind = "error") {
            ZipDeliveryHudText.Opt("cB00020")
        } else {
            ZipDeliveryHudText.Opt("c555555")
        }

        ZipDeliveryHudText.Value := BuildZipDeliveryHud(stage, detail)
    }
}

BuildZipDeliveryHud(stage := "idle", detail := "") {
    title := "HUD ENTREGA ZIP — " ZipStageLabel(stage)

    if (detail != "") {
        title .= " — " detail
    }

    return title "`r`n"
        . ZipHudToken(stage, ["detected", "stabilizing"], "01 Recebido") " | " ZipHudToken(stage, ["extracting"], "02 Unzip") "`r`n"
        . ZipHudToken(stage, ["collecting", "planning"], "03 Paths") " | " ZipHudToken(stage, ["copying"], "04 Copy") "`r`n"
        . ZipHudToken(stage, ["manifest"], "05 Manifest") " | " ZipHudToken(stage, ["vscode", "vscode_skip", "vscode_on", "vscode_off"], "06 VSCode") "`r`n"
        . ZipHudToken(stage, ["done", "failed", "idle"], "07 Entrega")
}

ZipHudToken(activeStage, keys, label) {
    active := false

    for key in keys {
        if (activeStage = key) {
            active := true
            break
        }
    }

    return active ? ">> " label : "   " label
}

ZipHudLine(activeStage, keys, label) {
    active := false

    for key in keys {
        if (activeStage = key) {
            active := true
            break
        }
    }

    marker := active ? ">> " : "   "
    suffix := active ? "  [agora]" : ""

    return marker label suffix "`r`n"
}

ZipStageLabel(stage) {
    if (stage = "detected") {
        return "ZIP detectado"
    }

    if (stage = "stabilizing") {
        return "aguardando estabilizar"
    }

    if (stage = "extracting") {
        return "extraindo"
    }

    if (stage = "collecting") {
        return "lendo arquivos"
    }

    if (stage = "planning") {
        return "mapeando destinos"
    }

    if (stage = "copying") {
        return "implementando"
    }

    if (stage = "manifest") {
        return "preparando rollback"
    }

    if (stage = "vscode") {
        return "abrindo VSCode"
    }

    if (stage = "vscode_skip") {
        return "modo silencioso"
    }

    if (stage = "vscode_on") {
        return "modo revisão ligado"
    }

    if (stage = "vscode_off") {
        return "modo silencioso ligado"
    }

    if (stage = "done") {
        return "concluído"
    }

    if (stage = "failed") {
        return "falhou"
    }

    return "aguardando"
}

MakeOpenResultSkipped(reason := "Abertura de abas desabilitada.") {
    return {
        closeAttempted: false,
        closedTabs: false,
        batches: 0,
        runOk: true,
        skipped: true,
        error: reason
    }
}

GuiResize(guiObj, minMax, width, height) {
    global BannerText, WatcherText, ZipStatusText, ZipDeliveryHudText, InputEdit, ResultEdit, ConfigText
    global GuiContentMargin, GuiContentWidth, GuiMaxHeight

    if (minMax = -1) {
        return
    }

    ; Segurança para DPI/reflow: conserva proporção vertical e não passa de 620px de altura.
    contentWidth := width - (GuiContentMargin * 2)

    if (contentWidth > GuiContentWidth) {
        contentWidth := GuiContentWidth
    }

    if (contentWidth < 300) {
        contentWidth := 300
    }

    if (height > GuiMaxHeight) {
        height := GuiMaxHeight
    }

    BannerText.Move(, , contentWidth, 30)
    WatcherText.Move(, , contentWidth, 23)
    ZipStatusText.Move(, , contentWidth, 32)
    ZipDeliveryHudText.Move(, , contentWidth, 76)
    InputEdit.Move(, , contentWidth, 65)
    ResultEdit.Move(, , contentWidth, 80)
    ConfigText.Move(, , contentWidth, 70)
}

SetBanner(message, kind := "info") {
    global BannerText

    try {
        if (kind = "ok") {
            BannerText.Opt("c007000")
        } else if (kind = "warn") {
            BannerText.Opt("c9A5A00")
        } else if (kind = "error") {
            BannerText.Opt("cB00020")
        } else {
            BannerText.Opt("c555555")
        }

        BannerText.Value := message
    }
}

SetZipStatus(message, kind := "info") {
    global ZipStatusText, LastZipStatus

    LastZipStatus := message

    try {
        if (kind = "ok") {
            ZipStatusText.Opt("c007000")
        } else if (kind = "warn") {
            ZipStatusText.Opt("c9A5A00")
        } else if (kind = "error") {
            ZipStatusText.Opt("cB00020")
        } else {
            ZipStatusText.Opt("c555555")
        }

        ZipStatusText.Value := "ZIP — " message
    }
}

SetResult(message) {
    global ResultEdit

    try ResultEdit.Value := message
}

