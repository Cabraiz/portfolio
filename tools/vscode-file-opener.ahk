#Requires AutoHotkey v2.0
#SingleInstance Force

; ============================================================
; VSCode File Opener + ZIP Auto Apply - AutoHotkey v2
; Fluxos:
;   1) Manual: cola paths e abre no VSCode.
;   2) Automático: detecta ZIP novo em Downloads com menos de 3MB,
;      extrai, infere o destino pelo encaixe dos folders internos,
;      copia/substitui no projeto, cria backup e abre arquivos no VSCode.
;   3) Rollback: botão para reverter o último ZIP aplicado.
;      - Arquivo sobrescrito volta do backup.
;      - Arquivo criado pelo ZIP é apagado.
; ============================================================

AppName := "VSCode File Opener + ZIP Auto Apply"

DefaultRoot := "C:\Users\Cabraiz\Documents\GitHub\portfolio"

; Base usada quando o path dentro do ZIP/texto começa em:
;   domain\...
;   three\...
;   driving\domain\...
DrivingRootRelative := "src\pages\Mateus\Home\components\mobile\game\driving"

; Base usada quando o path começa em:
;   game\driving\...
;   mobile\game\driving\...
MobileRootRelative := "src\pages\Mateus\Home\components\mobile"

CloseTabsBeforeOpen := true
CopyFoundFilesContentToClipboard := true
ClearInputAfterSuccessfulOpen := true

OpenBatchSize := 12

VSCodeWindowWaitMs := 2200
VSCodeCloseTabsDelayMs := 220
VSCodeOpenAfterCloseDelayMs := 160
VSCodeBatchDelayMs := 90

; ============================================================
; ZIP Watcher
; ============================================================

AutoZipWatcherEnabled := true
WatchIntervalMs := 1000
ZipStableMs := 1800
MaxAutoZipBytes := 3 * 1024 * 1024

; Por segurança, só processa ZIPs vistos depois que o script abre.
; Use o botão "Processar ZIP mais recente" para aplicar um ZIP já existente.
IgnoreExistingZipsOnStartup := true

DownloadsDir := GetDefaultDownloadsDir()

SupportedExtensionsRegex := "tsx?|jsx?|css|scss|sass|less|json|mdx?|html|ya?ml|xml|txt|env|svg|png|jpe?g|webp|gif|glb|gltf|mp3|wav|ogg|mp4|webm|ttf|otf|woff2?"

AppDataPath := EnvGet("APPDATA")
if (AppDataPath = "") {
    AppDataPath := A_ScriptDir
}

ConfigFile := AppDataPath "\vscode-file-opener.ini"
BackupRoot := AppDataPath "\vscode-file-opener-backups"
TempRoot := A_Temp "\vscode-file-opener-zip"

; ============================================================
; Globais
; ============================================================

global CodeCommand := ""
global ProjectRoot := DefaultRoot

global MainGui
global BannerText
global InputEdit
global ResultEdit
global ConfigText
global WatcherText
global ZipStatusText
global WatchToggleButton

global IsProcessing := false
global IsZipProcessing := false
global FileNameIndexBuilt := false
global FileNameIndex := Map()

global ZipSeen := Map()
global ZipStableMap := Map()
global LastProcessedZip := ""
global LastZipStatus := "Nenhum ZIP processado nesta sessão."

global LastApplyManifest := ""
global LastApplyBackupDir := ""
global LastApplyZip := ""

LoadConfig()

if (!FileExist(CodeCommand)) {
    DetectOrAskVSCode()
} else {
    NormalizeConfiguredVSCodeCommand()
}

if (!DirExist(ProjectRoot)) {
    AskProjectRoot()
}

BuildGui()

if (IgnoreExistingZipsOnStartup) {
    MarkExistingDownloadsZips()
}

StartZipWatcher()

; ============================================================
; Configuração
; ============================================================

LoadConfig() {
    global ConfigFile, CodeCommand, ProjectRoot, DefaultRoot, DownloadsDir
    global AutoZipWatcherEnabled, MaxAutoZipBytes

    CodeCommand := IniRead(ConfigFile, "config", "codeCommand", "")
    ProjectRoot := IniRead(ConfigFile, "config", "projectRoot", DefaultRoot)
    DownloadsDir := IniRead(ConfigFile, "config", "downloadsDir", DownloadsDir)
    AutoZipWatcherEnabled := IniRead(ConfigFile, "config", "autoZipWatcherEnabled", AutoZipWatcherEnabled ? "1" : "0") = "1"
    MaxAutoZipBytes := Integer(IniRead(ConfigFile, "config", "maxAutoZipBytes", String(MaxAutoZipBytes)))
}

SaveConfig() {
    global ConfigFile, CodeCommand, ProjectRoot, DownloadsDir, AutoZipWatcherEnabled, MaxAutoZipBytes

    IniWrite(CodeCommand, ConfigFile, "config", "codeCommand")
    IniWrite(ProjectRoot, ConfigFile, "config", "projectRoot")
    IniWrite(DownloadsDir, ConfigFile, "config", "downloadsDir")
    IniWrite(AutoZipWatcherEnabled ? "1" : "0", ConfigFile, "config", "autoZipWatcherEnabled")
    IniWrite(String(MaxAutoZipBytes), ConfigFile, "config", "maxAutoZipBytes")
}

GetInitialBrowseDir() {
    localAppDataPath := EnvGet("LOCALAPPDATA")
    programFilesPath := EnvGet("ProgramFiles")
    userProfilePath := EnvGet("USERPROFILE")

    if (localAppDataPath != "") {
        candidate := localAppDataPath "\Programs"

        if (DirExist(candidate)) {
            return candidate
        }
    }

    if (programFilesPath != "" && DirExist(programFilesPath)) {
        return programFilesPath
    }

    if (userProfilePath != "" && DirExist(userProfilePath)) {
        return userProfilePath
    }

    return A_ScriptDir
}

DetectOrAskVSCode() {
    global CodeCommand

    localAppDataPath := EnvGet("LOCALAPPDATA")
    programFilesPath := EnvGet("ProgramFiles")
    programFilesX86Path := EnvGet("ProgramFiles(x86)")

    candidates := []

    if (localAppDataPath != "") {
        candidates.Push(localAppDataPath "\Programs\Microsoft VS Code\bin\code.cmd")
        candidates.Push(localAppDataPath "\Programs\Microsoft VS Code\bin\code.exe")
        candidates.Push(localAppDataPath "\Programs\Microsoft VS Code Insiders\bin\code-insiders.cmd")
        candidates.Push(localAppDataPath "\Programs\Microsoft VS Code Insiders\bin\code-insiders.exe")
    }

    if (programFilesPath != "") {
        candidates.Push(programFilesPath "\Microsoft VS Code\bin\code.cmd")
        candidates.Push(programFilesPath "\Microsoft VS Code\bin\code.exe")
        candidates.Push(programFilesPath "\Microsoft VS Code Insiders\bin\code-insiders.cmd")
        candidates.Push(programFilesPath "\Microsoft VS Code Insiders\bin\code-insiders.exe")
    }

    if (programFilesX86Path != "") {
        candidates.Push(programFilesX86Path "\Microsoft VS Code\bin\code.cmd")
        candidates.Push(programFilesX86Path "\Microsoft VS Code\bin\code.exe")
        candidates.Push(programFilesX86Path "\Microsoft VS Code Insiders\bin\code-insiders.cmd")
        candidates.Push(programFilesX86Path "\Microsoft VS Code Insiders\bin\code-insiders.exe")
    }

    if (localAppDataPath != "") {
        candidates.Push(localAppDataPath "\Programs\Microsoft VS Code\Code.exe")
        candidates.Push(localAppDataPath "\Programs\Microsoft VS Code Insiders\Code - Insiders.exe")
    }

    if (programFilesPath != "") {
        candidates.Push(programFilesPath "\Microsoft VS Code\Code.exe")
        candidates.Push(programFilesPath "\Microsoft VS Code Insiders\Code - Insiders.exe")
    }

    if (programFilesX86Path != "") {
        candidates.Push(programFilesX86Path "\Microsoft VS Code\Code.exe")
        candidates.Push(programFilesX86Path "\Microsoft VS Code Insiders\Code - Insiders.exe")
    }

    for candidate in candidates {
        if (FileExist(candidate)) {
            CodeCommand := candidate
            SaveConfig()
            return
        }
    }

    AskVSCode()
}

NormalizeConfiguredVSCodeCommand() {
    global CodeCommand

    lower := StrLower(CodeCommand)

    if (EndsWith(lower, "\code.exe") && !InStr(lower, "\bin\")) {
        installDir := RegExReplace(CodeCommand, "\\Code\.exe$", "")
        cliCmd := installDir "\bin\code.cmd"
        cliExe := installDir "\bin\code.exe"

        if (FileExist(cliCmd)) {
            CodeCommand := cliCmd
            SaveConfig()
            return
        }

        if (FileExist(cliExe)) {
            CodeCommand := cliExe
            SaveConfig()
            return
        }
    }

    if (EndsWith(lower, "\code - insiders.exe") && !InStr(lower, "\bin\")) {
        installDir := RegExReplace(CodeCommand, "\\Code - Insiders\.exe$", "")
        cliCmd := installDir "\bin\code-insiders.cmd"
        cliExe := installDir "\bin\code-insiders.exe"

        if (FileExist(cliCmd)) {
            CodeCommand := cliCmd
            SaveConfig()
            return
        }

        if (FileExist(cliExe)) {
            CodeCommand := cliExe
            SaveConfig()
            return
        }
    }
}

AskVSCode(*) {
    global CodeCommand, AppName

    selected := FileSelect(
        1,
        GetInitialBrowseDir(),
        "Selecione code.cmd, code.exe ou Code.exe do VSCode",
        "VSCode (*.cmd; *.exe)"
    )

    if (selected = "") {
        MsgBox("Nenhum VSCode selecionado. O app será fechado.", AppName, "Iconx")
        ExitApp()
    }

    CodeCommand := selected
    NormalizeConfiguredVSCodeCommand()
    SaveConfig()
}

AskProjectRoot(*) {
    global ProjectRoot, AppName, FileNameIndexBuilt, FileNameIndex

    selected := DirSelect(ProjectRoot, 3, "Selecione a pasta raiz do projeto")

    if (selected = "") {
        MsgBox("Nenhuma pasta selecionada. O app será fechado.", AppName, "Iconx")
        ExitApp()
    }

    ProjectRoot := selected
    FileNameIndexBuilt := false
    FileNameIndex := Map()
    SaveConfig()
}

AskDownloadsDir(*) {
    global DownloadsDir, AppName, ZipSeen, ZipStableMap

    selected := DirSelect(DownloadsDir, 3, "Selecione a pasta Downloads a ser monitorada")

    if (selected = "") {
        MsgBox("Nenhuma pasta selecionada. Downloads não foi alterado.", AppName, "Icon!")
        return
    }

    DownloadsDir := selected
    ZipSeen := Map()
    ZipStableMap := Map()
    MarkExistingDownloadsZips()
    SaveConfig()
    RefreshConfigText()
    SetZipStatus("Watcher reiniciado para: " DownloadsDir, "info")
}

; ============================================================
; GUI
; ============================================================

BuildGui() {
    global MainGui, BannerText, InputEdit, ResultEdit, ConfigText, AppName
    global WatcherText, ZipStatusText, WatchToggleButton

    MainGui := Gui("+Resize +AlwaysOnTop", AppName)
    MainGui.SetFont("s10", "Segoe UI")

    MainGui.AddText("xm ym w960", "Cole paths manualmente ou deixe o app aberto: ZIP novo em Downloads com menos de 3MB será analisado e aplicado automaticamente.")

    BannerText := MainGui.AddText("xm y+8 w960 h30 +Border c555555", "AGUARDANDO — cole paths, pressione Ctrl+V/Ctrl+Enter ou baixe um ZIP pequeno em Downloads.")

    WatcherText := MainGui.AddText("xm y+8 w960 h24 +Border c555555", "WATCHER — inicializando...")
    ZipStatusText := MainGui.AddText("xm y+4 w960 h42 +Border c555555", "ZIP — nenhum ZIP processado nesta sessão.")

    MainGui.AddText(
        "xm y+8 w960 c777777",
        "Inferência ZIP: src/... -> raiz do projeto | domain/three/... -> game/driving | game/driving/... -> components/mobile | wrappers como portfolio/src são ignorados."
    )

    InputEdit := MainGui.AddEdit("xm y+10 w960 h215 WantTab -Wrap")

    openButton := MainGui.AddButton("xm y+10 w138 h34 Default", "Abrir paths")
    openButton.OnEvent("Click", QueueProcessInput)

    pasteButton := MainGui.AddButton("x+8 yp w138 h34", "Colar e abrir")
    pasteButton.OnEvent("Click", PasteClipboardAndQueue)

    processZipButton := MainGui.AddButton("x+8 yp w170 h34", "Processar ZIP recente")
    processZipButton.OnEvent("Click", ProcessLatestZipClicked)

    revertZipButton := MainGui.AddButton("x+8 yp w170 h34", "Reverter último ZIP")
    revertZipButton.OnEvent("Click", RevertLastApplyClicked)

    WatchToggleButton := MainGui.AddButton("x+8 yp w128 h34", "Watcher ON")
    WatchToggleButton.OnEvent("Click", ToggleZipWatcher)

    chooseCodeButton := MainGui.AddButton("xm y+8 w128 h34", "VSCode")
    chooseCodeButton.OnEvent("Click", ChooseVSCodeClicked)

    chooseRootButton := MainGui.AddButton("x+8 yp w128 h34", "Projeto")
    chooseRootButton.OnEvent("Click", ChooseProjectRootClicked)

    chooseDownloadsButton := MainGui.AddButton("x+8 yp w128 h34", "Downloads")
    chooseDownloadsButton.OnEvent("Click", AskDownloadsDir)

    backupFolderButton := MainGui.AddButton("x+8 yp w150 h34", "Abrir backup")
    backupFolderButton.OnEvent("Click", OpenBackupFolderClicked)

    clearButton := MainGui.AddButton("x+8 yp w82 h34", "Limpar")
    clearButton.OnEvent("Click", ClearAll)

    MainGui.AddText("xm y+14 w960", "Resultado / diagnóstico:")
    ResultEdit := MainGui.AddEdit("xm y+6 w960 h165 ReadOnly -Wrap")

    ConfigText := MainGui.AddText("xm y+10 w960 c555555", "")

    RefreshConfigText()
    RefreshWatcherText()
    SetBanner("AGUARDANDO — manual ou automático pronto.", "info")

    MainGui.OnEvent("Size", GuiResize)
    MainGui.OnEvent("Close", (*) => ExitApp())

    MainGui.Show("w1000 h700")

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
    global CloseTabsBeforeOpen, CopyFoundFilesContentToClipboard, OpenBatchSize
    global DrivingRootRelative, MobileRootRelative, MaxAutoZipBytes

    closeMode := CloseTabsBeforeOpen ? "ligado" : "desligado"
    copyMode := CopyFoundFilesContentToClipboard ? "ligado" : "desligado"
    maxMb := Round(MaxAutoZipBytes / 1024 / 1024, 2)

    ConfigText.Value :=
        "VSCode: " CodeCommand "`n"
        . "Projeto: " ProjectRoot "`n"
        . "Downloads monitorado: " DownloadsDir " | ZIP máximo: " maxMb " MB`n"
        . "Base domain/three: " DrivingRootRelative " | Base game/driving: " MobileRootRelative "`n"
        . "Fechar abas antes: " closeMode " | Copiar conteúdo manual: " copyMode " | Lote VSCode: " OpenBatchSize
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

GuiResize(guiObj, minMax, width, height) {
    global BannerText, WatcherText, ZipStatusText, InputEdit, ResultEdit, ConfigText

    if (minMax = -1) {
        return
    }

    margin := 20
    contentWidth := width - margin * 2

    inputHeight := height - 497

    if (inputHeight < 150) {
        inputHeight := 150
    }

    resultY := inputHeight + 294
    resultHeight := 165

    BannerText.Move(, , contentWidth)
    WatcherText.Move(, , contentWidth)
    ZipStatusText.Move(, , contentWidth)
    InputEdit.Move(, , contentWidth, inputHeight)
    ResultEdit.Move(, resultY, contentWidth, resultHeight)
    ConfigText.Move(, height - 118, contentWidth)
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

#HotIf WinActive("VSCode File Opener") || WinActive("VSCode File Opener + ZIP Auto Apply")
^v::{
    PasteClipboardAndQueue()
}

^Enter::{
    QueueProcessInput()
}
#HotIf

PasteClipboardAndQueue(*) {
    global InputEdit

    text := A_Clipboard

    if (Trim(text) = "") {
        SetBanner("AVISO — clipboard vazio. Nada foi processado.", "warn")
        SetResult("Clipboard vazio.`r`n")
        KeepWindowReady()
        return
    }

    InputEdit.Value := text
    QueueProcessInput()
}

QueueProcessInput(*) {
    global IsProcessing

    if (IsProcessing) {
        SetBanner("AVISO — ainda processando. Aguarde terminar antes de rodar de novo.", "warn")
        return
    }

    IsProcessing := true
    SetBanner("PROCESSANDO — lendo texto colado...", "info")
    SetResult("Processando...`r`n")

    SetTimer(ProcessInputWorker, -30)
}

ProcessInputWorker(*) {
    global IsProcessing

    try {
        ProcessInputCore()
    } catch as err {
        SetBanner("ERRO — processamento manual interrompido. Veja o diagnóstico abaixo.", "error")
        SetResult(FormatAhkError(err))
    }

    IsProcessing := false
}

ProcessInputCore() {
    global InputEdit, ClearInputAfterSuccessfulOpen

    raw := InputEdit.Value

    if (Trim(raw) = "") {
        SetBanner("AVISO — caixa vazia. Nada foi processado.", "warn")
        SetResult("A caixa de texto está vazia.`r`n")
        KeepWindowReady()
        return
    }

    SetBanner("PROCESSANDO — extraindo paths do texto...", "info")
    tokens := ExtractTokens(raw)

    if (tokens.Length = 0) {
        SetBanner("ERRO — nenhum path reconhecido. Input mantido para revisão.", "error")
        SetResult(
            "Nenhum path ou nome de arquivo detectado.`r`n`r`n"
            . "Cole linhas terminando em extensões como .ts, .tsx, .css, .json etc.`r`n"
            . "O input foi mantido para você revisar."
        )
        KeepWindowReady()
        return
    }

    SetBanner("PROCESSANDO — " tokens.Length " token(s) detectado(s). Resolvendo arquivos...", "info")

    resolved := []
    notFound := []
    ambiguous := []
    openedFilesMap := Map()

    for token in tokens {
        result := ResolveToken(token)

        if (result.status = "found") {
            key := StrLower(result.path)

            if (!openedFilesMap.Has(key)) {
                openedFilesMap[key] := result.path
                resolved.Push(result.path)
            }
        } else if (result.status = "ambiguous") {
            ambiguous.Push(token)
        } else {
            notFound.Push(token)
        }
    }

    if (resolved.Length = 0) {
        SetBanner("ERRO — 0 arquivo encontrado. Provável raiz errada ou path fora das bases configuradas.", "error")
        SetResult(BuildReport(tokens, resolved, notFound, ambiguous, { closeAttempted: false, closedTabs: false, batches: 0, runOk: false, error: "" }, { copied: false, files: 0, chars: 0 }))
        KeepWindowReady()
        return
    }

    SetBanner("PROCESSANDO — " resolved.Length " arquivo(s) encontrado(s). Abrindo no VSCode...", "info")
    openResult := OpenFilesInVSCode(resolved)

    clipboardResult := { copied: false, files: 0, chars: 0 }

    if (openResult.runOk) {
        SetBanner("PROCESSANDO — VSCode acionado. Copiando conteúdo para o clipboard...", "info")
        clipboardResult := CopyFoundFilesToClipboard(resolved)
    }

    SetResult(BuildReport(tokens, resolved, notFound, ambiguous, openResult, clipboardResult))

    if (!openResult.runOk) {
        SetBanner("ERRO — arquivos resolvidos, mas o comando do VSCode falhou.", "error")
        KeepWindowReady()
        return
    }

    if (notFound.Length > 0 || ambiguous.Length > 0) {
        SetBanner("AVISO — abriu " resolved.Length " arquivo(s), mas alguns tokens falharam.", "warn")
    } else {
        SetBanner("OK — abriu " resolved.Length " arquivo(s) no VSCode.", "ok")
    }

    if (ClearInputAfterSuccessfulOpen) {
        InputEdit.Value := ""
    }

    SetTimer(FocusVSCodeProjectWindow, -500)
}

ClearAll(*) {
    global InputEdit, ResultEdit

    InputEdit.Value := ""
    ResultEdit.Value := ""
    SetBanner("AGUARDANDO — caixa limpa.", "info")
    KeepWindowReady()
}

KeepWindowReady(*) {
    global MainGui, InputEdit

    try MainGui.Opt("+AlwaysOnTop")
    try WinSetAlwaysOnTop(1, "ahk_id " MainGui.Hwnd)
    try WinActivate("ahk_id " MainGui.Hwnd)
    try InputEdit.Focus()
}

ReleaseMainGuiAlwaysOnTop() {
    global MainGui

    try MainGui.Opt("-AlwaysOnTop")
    try WinSetAlwaysOnTop(0, "ahk_id " MainGui.Hwnd)
}

FormatAhkError(err) {
    message := "ERRO AHK capturado.`r`n`r`n"

    try message .= "Mensagem: " err.Message "`r`n"
    try message .= "Arquivo: " err.File "`r`n"
    try message .= "Linha: " err.Line "`r`n"
    try message .= "What: " err.What "`r`n"
    try message .= "Extra: " err.Extra "`r`n"

    return message
}

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

        result := ApplyZipToProject(zipPath)

        if (markSeen && signature != "") {
            ZipSeen[signature] := true
        }

        SetResult(result.report)

        if (result.success) {
            SetBanner("OK — ZIP aplicado. Arquivos copiados/substituídos e abertos no VSCode.", "ok")
            SetZipStatus("OK: " GetFileName(zipPath) " aplicado. " result.appliedCount " arquivo(s).", "ok")
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
    global TempRoot, ProjectRoot

    EnsureDir(TempRoot)

    zipName := GetNameNoExt(zipPath)
    stamp := FormatTime(A_Now, "yyyyMMdd-HHmmss")
    extractDir := TempRoot "\" stamp "-" SanitizePathPart(zipName)

    if (DirExist(extractDir)) {
        DirDelete(extractDir, true)
    }

    EnsureDir(extractDir)

    extractOk := ExtractZip(zipPath, extractDir)

    if (!extractOk) {
        return {
            success: false,
            appliedCount: 0,
            report: "Falha ao extrair ZIP:`r`n" zipPath "`r`n`r`nVerifique se PowerShell/Expand-Archive está disponível e se o ZIP não está corrompido."
        }
    }

    files := CollectExtractedFiles(extractDir)

    if (files.Length = 0) {
        return {
            success: false,
            appliedCount: 0,
            report: "ZIP extraído, mas nenhum arquivo compatível foi encontrado.`r`nZIP: " zipPath
        }
    }

    planResult := BuildZipApplyPlan(files)

    if (planResult.plan.Length = 0) {
        report := "Nenhum arquivo seguro para aplicar.`r`n`r`n"
        report .= BuildZipAnalysisReport(zipPath, extractDir, files, planResult, { applied: [], failed: [], backupDir: "" }, { closeAttempted: false, closedTabs: false, batches: 0, runOk: false, error: "" })

        return { success: false, appliedCount: 0, report: report }
    }

    applyResult := CopyPlannedFiles(planResult.plan, zipPath)

    if (applyResult.applied.Length > 0) {
        manifestPath := SaveApplyManifest(applyResult, zipPath)
        applyResult.manifest := manifestPath
    }

    openedFiles := []
    for item in applyResult.applied {
        openedFiles.Push(item.target)
    }

    openResult := { closeAttempted: false, closedTabs: false, batches: 0, runOk: false, error: "" }

    if (openedFiles.Length > 0) {
        openResult := OpenFilesInVSCode(openedFiles)
    }

    report := BuildZipAnalysisReport(zipPath, extractDir, files, planResult, applyResult, openResult)

    success := (applyResult.applied.Length > 0 && applyResult.failed.Length = 0 && openResult.runOk)

    return { success: success, appliedCount: applyResult.applied.Length, report: report }
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

BuildZipApplyPlan(files) {
    plan := []
    skipped := []
    targetSeen := Map()

    for item in files {
        targetInfo := ResolveZipRelativeTarget(item.relative)

        if (!targetInfo.found) {
            skipped.Push({ source: item.source, relative: item.relative, reason: targetInfo.reason })
            continue
        }

        key := StrLower(targetInfo.target)

        if (targetSeen.Has(key)) {
            skipped.Push({ source: item.source, relative: item.relative, reason: "Destino duplicado no ZIP: " targetInfo.target })
            continue
        }

        targetSeen[key] := true

        action := FileExist(targetInfo.target) ? "overwrite" : "create"

        plan.Push({
            source: item.source,
            sourceRelative: item.relative,
            target: targetInfo.target,
            targetRelative: GetRelativeProjectPath(targetInfo.target),
            action: action,
            confidence: targetInfo.score,
            reason: targetInfo.reason
        })
    }

    return { plan: plan, skipped: skipped }
}

ResolveZipRelativeTarget(relativePath) {
    global ProjectRoot, DrivingRootRelative, MobileRootRelative

    rel := NormalizeZipRelativePath(relativePath)

    if (rel = "") {
        return { found: false, target: "", score: 0, reason: "Path vazio." }
    }

    projectFull := RTrim(GetFullPath(ProjectRoot), "\")
    drivingRoot := projectFull "\" DrivingRootRelative
    mobileRoot := projectFull "\" MobileRootRelative

    candidates := []

    ; Maior confiança: o ZIP traz a árvore real do projeto ou algo acima dela.
    tail := TailFromSegment(rel, "src")
    if (tail != "") {
        AddCandidate(candidates, projectFull, tail, "achou segmento src no ZIP", 90)
    }

    tail := TailFromSequence(rel, ["pages", "Mateus"])
    if (tail != "") {
        AddCandidate(candidates, projectFull "\src", tail, "achou pages\\Mateus no ZIP", 82)
    }

    tail := TailFromSequence(rel, ["Home", "components", "mobile"])
    if (tail != "") {
        AddCandidate(candidates, projectFull "\src\pages\Mateus", tail, "achou Home\\components\\mobile no ZIP", 78)
    }

    tail := TailFromSequence(rel, ["components", "mobile"])
    if (tail != "") {
        AddCandidate(candidates, projectFull "\src\pages\Mateus\Home", tail, "achou components\\mobile no ZIP", 74)
    }

    tail := TailFromSequence(rel, ["mobile", "game", "driving"])
    if (tail != "") {
        AddCandidate(candidates, projectFull "\src\pages\Mateus\Home\components", tail, "achou mobile\\game\\driving no ZIP", 72)
    }

    tail := TailFromSequence(rel, ["game", "driving"])
    if (tail != "") {
        AddCandidate(candidates, mobileRoot, tail, "achou game\\driving no ZIP", 70)
    }

    tail := TailFromSegment(rel, "driving")
    if (tail != "") {
        AddCandidate(candidates, mobileRoot "\game", tail, "achou segmento driving no ZIP", 66)
    }

    ; Paths curtos que o ChatGPT costuma entregar: domain/..., three/...
    tail := TailFromSegment(rel, "domain")
    if (tail != "") {
        AddCandidate(candidates, drivingRoot, tail, "achou segmento domain no ZIP", 64)
    }

    tail := TailFromSegment(rel, "three")
    if (tail != "") {
        AddCandidate(candidates, drivingRoot, tail, "achou segmento three no ZIP", 64)
    }

    ; Outros paths comuns de src quando o ZIP vem já recortado.
    for firstSegment in ["components", "hooks", "data", "utils", "core", "shared", "styles", "assets", "pages"] {
        tail := TailFromSegment(rel, firstSegment)
        if (tail != "") {
            AddCandidate(candidates, projectFull "\src", tail, "achou segmento " firstSegment " e assumiu base src", 45)
        }
    }

    ; Se veio só nome de arquivo, só sobrescreve se existir um único arquivo com esse nome no projeto.
    if (!InStr(rel, "\")) {
        existing := FindUniqueFileByNameIndexed(rel)
        if (existing.status = "found") {
            AddCandidate(candidates, GetDirName(existing.path), GetFileName(existing.path), "arquivo solto encontrado de forma única no projeto", 88)
        } else if (existing.status = "ambiguous") {
            return { found: false, target: "", score: 0, reason: "Arquivo solto ambíguo. O ZIP precisa trazer pastas junto do arquivo." }
        }
    }

    if (candidates.Length = 0) {
        return { found: false, target: "", score: 0, reason: "Nenhum segmento compatível encontrado: src, game, driving, domain, three etc." }
    }

    best := SelectBestCandidate(candidates)

    if (!IsPathInsideProject(best.target)) {
        return { found: false, target: "", score: 0, reason: "Destino calculado ficou fora do projeto. Bloqueado por segurança." }
    }

    ; Score mínimo baixo porque arquivos novos podem não existir ainda.
    if (best.score < 55 && !FileExist(best.target) && !DirExist(GetDirName(best.target))) {
        return { found: false, target: "", score: best.score, reason: "Destino sem confiança suficiente: " best.target }
    }

    return { found: true, target: best.target, score: best.score, reason: best.reason }
}

AddCandidate(candidates, baseDir, tail, reason, baseScore) {
    if (baseDir = "" || tail = "") {
        return
    }

    target := RTrim(baseDir, "\") "\" LTrim(tail, "\")
    target := NormalizeSlashes(target)

    if (!IsPathInsideProject(target)) {
        return
    }

    score := baseScore + ScoreTargetCompatibility(target)
    candidates.Push({ target: target, score: score, reason: reason })
}

SelectBestCandidate(candidates) {
    dedup := Map()
    compact := []

    for candidate in candidates {
        key := StrLower(candidate.target)

        if (!dedup.Has(key)) {
            dedup[key] := candidate
            compact.Push(candidate)
            continue
        }

        old := dedup[key]
        if (candidate.score > old.score) {
            dedup[key] := candidate
        }
    }

    best := compact[1]

    for _, candidate in dedup {
        if (candidate.score > best.score) {
            best := candidate
        } else if (candidate.score = best.score && StrLen(candidate.target) < StrLen(best.target)) {
            best := candidate
        }
    }

    return best
}

ScoreTargetCompatibility(target) {
    score := 0

    if (FileExist(target)) {
        score += 120
    }

    targetDir := GetDirName(target)

    if (DirExist(targetDir)) {
        score += 55
    } else {
        score += ExistingAncestorScore(targetDir)
    }

    return score
}

ExistingAncestorScore(dirPath) {
    global ProjectRoot

    projectFull := RTrim(GetFullPath(ProjectRoot), "\")
    current := RTrim(dirPath, "\")
    score := 0

    while (current != "" && IsPathInsideProject(current)) {
        if (DirExist(current)) {
            distance := CountPathSegments(GetRelativePath(dirPath, current))

            if (distance <= 1) {
                score += 35
            } else if (distance <= 2) {
                score += 25
            } else if (distance <= 4) {
                score += 14
            } else {
                score += 6
            }

            break
        }

        if (StrLower(current) = StrLower(projectFull)) {
            break
        }

        current := GetDirName(current)
    }

    return score
}

CopyPlannedFiles(plan, zipPath) {
    global BackupRoot

    stamp := FormatTime(A_Now, "yyyyMMdd-HHmmss")
    backupDir := BackupRoot "\" stamp "-" SanitizePathPart(GetNameNoExt(zipPath))
    EnsureDir(backupDir)

    applied := []
    failed := []

    for item in plan {
        try {
            targetDir := GetDirName(item.target)
            EnsureDir(targetDir)

            backupPath := ""

            if (FileExist(item.target)) {
                backupPath := backupDir "\" GetRelativeProjectPath(item.target)
                EnsureDir(GetDirName(backupPath))
                FileCopy(item.target, backupPath, true)
            }

            FileCopy(item.source, item.target, true)

            applied.Push({
                source: item.source,
                sourceRelative: item.sourceRelative,
                target: item.target,
                targetRelative: item.targetRelative,
                action: item.action,
                confidence: item.confidence,
                reason: item.reason,
                backup: backupPath
            })
        } catch as err {
            failed.Push({ item: item, error: err.Message })
        }
    }

    return { applied: applied, failed: failed, backupDir: backupDir }
}

BuildZipAnalysisReport(zipPath, extractDir, files, planResult, applyResult, openResult) {
    report := "ZIP Auto Apply - diagnóstico`r`n"
    report .= "========================================`r`n"
    report .= "ZIP: " zipPath "`r`n"
    report .= "Tamanho: " FormatBytes(SafeFileGetSize(zipPath)) "`r`n"
    report .= "Extraído em: " extractDir "`r`n`r`n"

    report .= "Resumo:`r`n"
    report .= "  Arquivos compatíveis no ZIP: " files.Length "`r`n"
    report .= "  Planejados para copiar: " planResult.plan.Length "`r`n"
    report .= "  Aplicados: " applyResult.applied.Length "`r`n"
    report .= "  Falhas de cópia: " applyResult.failed.Length "`r`n"
    report .= "  Ignorados por segurança: " planResult.skipped.Length "`r`n"

    if (applyResult.backupDir != "") {
        report .= "  Backup: " applyResult.backupDir "`r`n"
    }

    if (applyResult.HasOwnProp("manifest") && applyResult.manifest != "") {
        report .= "  Reversão disponível: " applyResult.manifest "`r`n"
    }

    report .= "`r`nVSCode:`r`n"
    report .= "  Fechar abas tentou: " (openResult.closeAttempted ? "sim" : "não") "`r`n"
    report .= "  Fechamento confirmado: " (openResult.closedTabs ? "sim" : "não") "`r`n"
    report .= "  Lotes enviados: " openResult.batches "`r`n"
    report .= "  Comando executado: " (openResult.runOk ? "sim" : "não") "`r`n"

    if (openResult.HasOwnProp("error") && openResult.error != "") {
        report .= "  Erro VSCode: " openResult.error "`r`n"
    }

    if (applyResult.applied.Length > 0) {
        report .= "`r`nAplicados:`r`n"

        for applied in applyResult.applied {
            report .= "  " (applied.action = "overwrite" ? "OVERWRITE" : "CREATE") ": " applied.targetRelative "`r`n"
            report .= "    origem ZIP: " applied.sourceRelative "`r`n"
            report .= "    regra: " applied.reason " | score: " applied.confidence "`r`n"
        }
    }

    if (applyResult.failed.Length > 0) {
        report .= "`r`nFalhas:`r`n"

        for failed in applyResult.failed {
            report .= "  X: " failed.item.targetRelative "`r`n"
            report .= "     erro: " failed.error "`r`n"
        }
    }

    if (planResult.skipped.Length > 0) {
        report .= "`r`nIgnorados por segurança:`r`n"

        for skipped in planResult.skipped {
            report .= "  SKIP: " skipped.relative "`r`n"
            report .= "        motivo: " skipped.reason "`r`n"
        }
    }

    report .= "`r`nRegra de segurança:`r`n"
    report .= "  O script só copia se conseguir encaixar o arquivo em uma base conhecida do projeto ou achar um arquivo existente único.`r`n"
    report .= "  Se um arquivo novo for ignorado, o ZIP precisa trazer mais pastas no path interno.`r`n"

    return report
}


; ============================================================
; Rollback do último ZIP aplicado
; ============================================================

SaveApplyManifest(applyResult, zipPath) {
    global BackupRoot, LastApplyManifest, LastApplyBackupDir, LastApplyZip

    if (applyResult.applied.Length = 0 || applyResult.backupDir = "") {
        return ""
    }

    EnsureDir(applyResult.backupDir)
    EnsureDir(BackupRoot)

    manifestPath := applyResult.backupDir "\manifest.tsv"
    lastManifestPath := BackupRoot "\_last-apply.tsv"

    text := "zip`t" zipPath "`r`n"
    text .= "createdAt`t" A_Now "`r`n"
    text .= "backupDir`t" applyResult.backupDir "`r`n"
    text .= "action`ttarget`tbackup`tsourceRelative`r`n"

    for applied in applyResult.applied {
        backupPath := applied.backup
        if (backupPath = "") {
            backupPath := "-"
        }

        text .= applied.action "`t" applied.target "`t" backupPath "`t" applied.sourceRelative "`r`n"
    }

    try FileDelete(manifestPath)
    FileAppend(text, manifestPath, "UTF-8")

    try FileDelete(lastManifestPath)
    FileCopy(manifestPath, lastManifestPath, true)

    LastApplyManifest := manifestPath
    LastApplyBackupDir := applyResult.backupDir
    LastApplyZip := zipPath

    return manifestPath
}

RevertLastApplyClicked(*) {
    global BackupRoot, LastApplyManifest, LastApplyZip, AppName
    global IsZipProcessing, IsProcessing

    if (IsZipProcessing || IsProcessing) {
        SetZipStatus("Existe processamento em andamento. Reversão bloqueada até terminar.", "warn")
        return
    }

    manifestPath := LastApplyManifest

    if (manifestPath = "" || !FileExist(manifestPath)) {
        fallback := BackupRoot "\_last-apply.tsv"

        if (FileExist(fallback)) {
            manifestPath := fallback
        }
    }

    if (manifestPath = "" || !FileExist(manifestPath)) {
        SetZipStatus("Nenhum rollback disponível. Ainda não há ZIP aplicado com manifest.", "warn")
        SetResult("Nenhum rollback disponível.`r`n`r`nO botão só funciona depois que um ZIP foi aplicado por este script e um manifest.tsv foi criado no backup.")
        return
    }

    manifest := ReadApplyManifest(manifestPath)

    if (manifest.items.Length = 0) {
        SetZipStatus("Manifest de rollback vazio ou inválido.", "error")
        SetResult("Manifest encontrado, mas sem itens válidos:`r`n" manifestPath)
        return
    }

    msg := "Reverter o último ZIP aplicado?`n`n"
    msg .= "ZIP: " manifest.zip "`n"
    msg .= "Itens: " manifest.items.Length "`n`n"
    msg .= "A reversão vai restaurar arquivos sobrescritos pelo backup e apagar arquivos criados pelo ZIP."

    answer := MsgBox(msg, AppName, "YesNo Icon!")

    if (answer != "Yes") {
        SetZipStatus("Reversão cancelada pelo usuário.", "warn")
        return
    }

    result := RevertApplyManifest(manifestPath)
    SetResult(result.report)

    if (result.failed.Length = 0 && result.reverted.Length > 0) {
        SetBanner("OK — último ZIP revertido.", "ok")
        SetZipStatus("Rollback aplicado: " result.reverted.Length " item(ns) revertido(s).", "ok")
    } else if (result.reverted.Length > 0) {
        SetBanner("AVISO — rollback parcial. Veja o diagnóstico.", "warn")
        SetZipStatus("Rollback parcial: " result.reverted.Length " revertido(s), " result.failed.Length " falha(s).", "warn")
    } else {
        SetBanner("ERRO — rollback não conseguiu reverter itens.", "error")
        SetZipStatus("Rollback falhou. Veja o diagnóstico.", "error")
    }
}

ReadApplyManifest(manifestPath) {
    zip := ""
    createdAt := ""
    backupDir := ""
    items := []

    content := FileRead(manifestPath, "UTF-8")

    for rawLine in StrSplit(content, "`n", "`r") {
        line := Trim(rawLine, "`r`n")

        if (line = "") {
            continue
        }

        parts := StrSplit(line, "`t")

        if (parts.Length < 1) {
            continue
        }

        key := parts[1]

        if (key = "zip" && parts.Length >= 2) {
            zip := parts[2]
            continue
        }

        if (key = "createdAt" && parts.Length >= 2) {
            createdAt := parts[2]
            continue
        }

        if (key = "backupDir" && parts.Length >= 2) {
            backupDir := parts[2]
            continue
        }

        if (key = "action") {
            continue
        }

        if ((key = "overwrite" || key = "create") && parts.Length >= 4) {
            backupPath := parts[3]
            if (backupPath = "-") {
                backupPath := ""
            }

            items.Push({
                action: key,
                target: parts[2],
                backup: backupPath,
                sourceRelative: parts[4]
            })
        }
    }

    return { zip: zip, createdAt: createdAt, backupDir: backupDir, items: items, path: manifestPath }
}

RevertApplyManifest(manifestPath) {
    manifest := ReadApplyManifest(manifestPath)
    reverted := []
    failed := []
    openAfterRevert := []

    items := ReverseArray(manifest.items)

    for item in items {
        try {
            if (!IsPathInsideProject(item.target)) {
                throw Error("Destino fora do projeto. Bloqueado por segurança.")
            }

            if (item.action = "create") {
                if (FileExist(item.target)) {
                    FileDelete(item.target)
                    reverted.Push({ action: "delete_created", target: item.target, backup: item.backup, sourceRelative: item.sourceRelative })
                } else {
                    reverted.Push({ action: "already_absent", target: item.target, backup: item.backup, sourceRelative: item.sourceRelative })
                }

                continue
            }

            if (item.action = "overwrite") {
                if (item.backup = "" || !FileExist(item.backup)) {
                    throw Error("Backup não encontrado: " item.backup)
                }

                EnsureDir(GetDirName(item.target))
                FileCopy(item.backup, item.target, true)
                reverted.Push({ action: "restore_backup", target: item.target, backup: item.backup, sourceRelative: item.sourceRelative })
                openAfterRevert.Push(item.target)
                continue
            }

            throw Error("Ação desconhecida no manifest: " item.action)
        } catch as err {
            failed.Push({ item: item, error: err.Message })
        }
    }

    openResult := { closeAttempted: false, closedTabs: false, batches: 0, runOk: false, error: "" }

    if (openAfterRevert.Length > 0) {
        openResult := OpenFilesInVSCode(UniqueArray(openAfterRevert))
    }

    report := BuildRevertReport(manifest, reverted, failed, openResult)

    return { reverted: reverted, failed: failed, report: report, openResult: openResult }
}

BuildRevertReport(manifest, reverted, failed, openResult) {
    report := "ZIP Auto Apply - rollback`r`n"
    report .= "========================================`r`n"
    report .= "Manifest: " manifest.path "`r`n"
    report .= "ZIP original: " manifest.zip "`r`n"
    report .= "Backup: " manifest.backupDir "`r`n`r`n"

    report .= "Resumo:`r`n"
    report .= "  Itens no manifest: " manifest.items.Length "`r`n"
    report .= "  Revertidos: " reverted.Length "`r`n"
    report .= "  Falhas: " failed.Length "`r`n"

    report .= "`r`nVSCode:`r`n"
    report .= "  Fechar abas tentou: " (openResult.closeAttempted ? "sim" : "não") "`r`n"
    report .= "  Fechamento confirmado: " (openResult.closedTabs ? "sim" : "não") "`r`n"
    report .= "  Lotes enviados: " openResult.batches "`r`n"
    report .= "  Comando executado: " (openResult.runOk ? "sim" : "não") "`r`n"

    if (openResult.HasOwnProp("error") && openResult.error != "") {
        report .= "  Erro VSCode: " openResult.error "`r`n"
    }

    if (reverted.Length > 0) {
        report .= "`r`nRevertidos:`r`n"

        for item in reverted {
            if (item.action = "restore_backup") {
                report .= "  RESTORE: " GetRelativeProjectPath(item.target) "`r`n"
                report .= "    backup: " item.backup "`r`n"
            } else if (item.action = "delete_created") {
                report .= "  DELETE CREATED: " GetRelativeProjectPath(item.target) "`r`n"
            } else {
                report .= "  OK: " GetRelativeProjectPath(item.target) " já não existia.`r`n"
            }
        }
    }

    if (failed.Length > 0) {
        report .= "`r`nFalhas:`r`n"

        for failure in failed {
            report .= "  X: " GetRelativeProjectPath(failure.item.target) "`r`n"
            report .= "     erro: " failure.error "`r`n"
        }
    }

    report .= "`r`nObservação:`r`n"
    report .= "  Rollback não desfaz efeitos externos como npm install, build, git state ou mudanças feitas manualmente depois da aplicação do ZIP.`r`n"

    return report
}

OpenBackupFolderClicked(*) {
    global BackupRoot, LastApplyBackupDir

    folder := LastApplyBackupDir

    if (folder = "" || !DirExist(folder)) {
        folder := BackupRoot
    }

    if (!DirExist(folder)) {
        SetZipStatus("Ainda não existe pasta de backup.", "warn")
        return
    }

    try {
        Run("explorer.exe " Quote(folder))
        SetZipStatus("Backup aberto: " folder, "ok")
    } catch as err {
        SetZipStatus("Falha ao abrir backup: " err.Message, "error")
    }
}

; ============================================================
; Parser manual de paths
; ============================================================

ExtractTokens(text) {
    tokens := []
    normalizedText := StrReplace(text, "/", "\")

    for rawLine in StrSplit(normalizedText, "`n", "`r") {
        line := NormalizeToken(rawLine)

        if (line = "") {
            continue
        }

        if (LooksLikeFileToken(line)) {
            tokens.Push(line)
            continue
        }

        compactLine := RegExReplace(line, "\s+", "`n")

        for rawPart in StrSplit(compactLine, "`n", "`r") {
            part := NormalizeToken(rawPart)

            if (part = "") {
                continue
            }

            if (LooksLikeFileToken(part)) {
                tokens.Push(part)
            }
        }
    }

    return UniqueArray(tokens)
}

LooksLikeFileToken(token) {
    global SupportedExtensionsRegex

    if (token = "") {
        return false
    }

    if (!RegExMatch(token, "i)\.(" SupportedExtensionsRegex ")$")) {
        return false
    }

    if (RegExMatch(token, "i)^[A-Z]:\\")) {
        return true
    }

    if (InStr(token, "\")) {
        return true
    }

    if (RegExMatch(token, "i)^[A-Za-z0-9_.-]+\.(" SupportedExtensionsRegex ")$")) {
        return true
    }

    return false
}

NormalizeToken(token) {
    quote := Chr(34)

    token := Trim(token)
    token := RegExReplace(token, "^\s*[-*•]+\s*", "")
    token := RegExReplace(token, "^\s*\d+[\.)]\s*", "")
    token := RegExReplace(token, "i)^\s*(OK|X|FILE|END FILE|Criar|Alterar|CRIAR|ALTERAR)\s*:?\s*", "")
    token := Trim(token, " `t`r`n" . quote . "'")
    token := StrReplace(token, "/", "\")
    token := RegExReplace(token, "^\.\\", "")
    token := RegExReplace(token, "[,;:\)\]\}\.]+$", "")
    token := Trim(token, " `t`r`n" . quote . "'")

    return token
}

ResolveToken(token) {
    token := NormalizeToken(token)

    if (token = "") {
        return { status: "not_found", path: "" }
    }

    if (RegExMatch(token, "i)^[A-Z]:\\")) {
        if (FileExist(token)) {
            return { status: "found", path: GetFullPath(token) }
        }

        return { status: "not_found", path: "" }
    }

    roots := GetCandidateRoots()

    if (InStr(token, "\")) {
        direct := TryResolveRelativePath(token, roots)

        if (direct.status != "not_found") {
            return direct
        }

        zipTarget := ResolveZipRelativeTarget(token)
        if (zipTarget.found && FileExist(zipTarget.target)) {
            return { status: "found", path: zipTarget.target }
        }

        return { status: "not_found", path: "" }
    }

    return FindUniqueFileByNameIndexed(token)
}

GetCandidateRoots() {
    global ProjectRoot, DrivingRootRelative, MobileRootRelative

    roots := []
    projectFull := RTrim(GetFullPath(ProjectRoot), "\")
    roots.Push(projectFull)

    drivingRoot := projectFull "\" DrivingRootRelative

    if (DirExist(drivingRoot)) {
        roots.Push(GetFullPath(drivingRoot))
    }

    mobileRoot := projectFull "\" MobileRootRelative

    if (DirExist(mobileRoot)) {
        roots.Push(GetFullPath(mobileRoot))
    }

    srcRoot := projectFull "\src"

    if (DirExist(srcRoot)) {
        roots.Push(GetFullPath(srcRoot))
    }

    return UniqueArray(roots)
}

TryResolveRelativePath(token, roots) {
    for root in roots {
        candidate := RTrim(root, "\") "\" token

        if (FileExist(candidate)) {
            return { status: "found", path: GetFullPath(candidate) }
        }
    }

    return { status: "not_found", path: "" }
}

FindUniqueFileByNameIndexed(fileName) {
    global FileNameIndexBuilt, FileNameIndex

    if (!FileNameIndexBuilt) {
        BuildFileNameIndex()
    }

    key := StrLower(fileName)

    if (!FileNameIndex.Has(key)) {
        return { status: "not_found", path: "" }
    }

    matches := FileNameIndex[key]

    if (matches.Length = 1) {
        return { status: "found", path: matches[1] }
    }

    return { status: "ambiguous", path: "" }
}

BuildFileNameIndex() {
    global ProjectRoot, FileNameIndexBuilt, FileNameIndex

    SetBanner("PROCESSANDO — criando índice rápido de nomes de arquivos. Isso roda só uma vez por projeto...", "info")

    FileNameIndex := Map()
    root := RTrim(GetFullPath(ProjectRoot), "\")

    Loop Files root "\*", "FR" {
        fullPath := A_LoopFileFullPath
        lowerPath := StrLower(fullPath)

        if (ShouldSkipPath(lowerPath)) {
            continue
        }

        if (!IsSupportedFile(fullPath)) {
            continue
        }

        nameKey := StrLower(A_LoopFileName)

        if (!FileNameIndex.Has(nameKey)) {
            FileNameIndex[nameKey] := []
        }

        FileNameIndex[nameKey].Push(GetFullPath(fullPath))
    }

    FileNameIndexBuilt := true
}

ShouldSkipPath(lowerPath) {
    return (
        InStr(lowerPath, "\node_modules\") ||
        InStr(lowerPath, "\.git\") ||
        InStr(lowerPath, "\dist\") ||
        InStr(lowerPath, "\build\") ||
        InStr(lowerPath, "\coverage\") ||
        InStr(lowerPath, "\.vite\") ||
        InStr(lowerPath, "\.next\") ||
        InStr(lowerPath, "\out\") ||
        InStr(lowerPath, "\storybook-static\") ||
        InStr(lowerPath, "\.turbo\") ||
        RegExMatch(lowerPath, "\\[^\\]+\.old\\")
    )
}

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

; ============================================================
; Path utils
; ============================================================

NormalizeZipRelativePath(path) {
    path := NormalizeSlashes(path)
    path := RegExReplace(path, "^\.\\", "")
    path := RegExReplace(path, "^\\+", "")
    path := RegExReplace(path, "\\+", "\")

    ; Remove wrappers muito comuns criados por ferramentas.
    path := RegExReplace(path, "i)^(.+?)\\(src|pages|Home|components|mobile|game|driving|domain|three)\\", "$2\")

    return path
}

NormalizeSlashes(path) {
    path := StrReplace(path, "/", "\")
    path := RegExReplace(path, "\\+", "\")
    return path
}

TailFromSegment(path, segmentName) {
    segments := StrSplit(NormalizeSlashes(path), "\")
    wanted := StrLower(segmentName)

    for index, segment in segments {
        if (StrLower(segment) = wanted) {
            return JoinSegmentsFrom(segments, index)
        }
    }

    return ""
}

TailFromSequence(path, sequence) {
    segments := StrSplit(NormalizeSlashes(path), "\")
    seqLen := sequence.Length

    if (segments.Length < seqLen) {
        return ""
    }

    maxStart := segments.Length - seqLen + 1

    Loop maxStart {
        startIndex := A_Index
        matched := true

        Loop seqLen {
            if (StrLower(segments[startIndex + A_Index - 1]) != StrLower(sequence[A_Index])) {
                matched := false
                break
            }
        }

        if (matched) {
            return JoinSegmentsFrom(segments, startIndex)
        }
    }

    return ""
}

JoinSegmentsFrom(segments, startIndex) {
    result := ""

    Loop segments.Length - startIndex + 1 {
        idx := startIndex + A_Index - 1

        if (result != "") {
            result .= "\"
        }

        result .= segments[idx]
    }

    return result
}

CountPathSegments(path) {
    path := Trim(NormalizeSlashes(path), "\")

    if (path = "") {
        return 0
    }

    return StrSplit(path, "\").Length
}

GetRelativePath(fullPath, baseDir) {
    full := GetFullPath(fullPath)
    base := RTrim(GetFullPath(baseDir), "\")
    baseLower := StrLower(base "\")
    fullLower := StrLower(full)

    if (StartsWith(fullLower, baseLower)) {
        return SubStr(full, StrLen(base) + 2)
    }

    if (StrLower(full) = StrLower(base)) {
        return ""
    }

    return full
}

GetRelativeProjectPath(filePath) {
    global ProjectRoot

    rootFull := RTrim(GetFullPath(ProjectRoot), "\")
    fileFull := GetFullPath(filePath)

    rootPrefix := StrLower(rootFull "\")
    fileLower := StrLower(fileFull)

    if (StartsWith(fileLower, rootPrefix)) {
        return SubStr(fileFull, StrLen(rootFull) + 2)
    }

    return fileFull
}

IsPathInsideProject(path) {
    global ProjectRoot

    root := RTrim(StrLower(GetFullPath(ProjectRoot)), "\")
    full := StrLower(GetFullPath(path))

    return full = root || StartsWith(full, root "\")
}

GetDirName(path) {
    SplitPath(path, , &dir)
    return dir
}

GetFileName(path) {
    SplitPath(path, &name)
    return name
}

GetNameNoExt(path) {
    SplitPath(path, , , , &nameNoExt)
    return nameNoExt
}

GetDefaultDownloadsDir() {
    userProfilePath := EnvGet("USERPROFILE")

    if (userProfilePath != "") {
        candidate := userProfilePath "\Downloads"

        if (DirExist(candidate)) {
            return candidate
        }
    }

    return A_Desktop
}

IsSupportedFile(path) {
    global SupportedExtensionsRegex
    return RegExMatch(path, "i)\.(" SupportedExtensionsRegex ")$")
}

SafeFileGetSize(path) {
    try {
        return FileGetSize(path)
    } catch {
        return 0
    }
}

SafeFileGetTime(path) {
    try {
        return FileGetTime(path, "M")
    } catch {
        return ""
    }
}

EnsureDir(dirPath) {
    if (dirPath != "" && !DirExist(dirPath)) {
        DirCreate(dirPath)
    }
}

SanitizePathPart(value) {
    value := RegExReplace(value, "[<>:" Chr(34) "/\\|?*]", "_")
    value := RegExReplace(value, "\s+", "_")
    return value
}

PSEscape(value) {
    return "'" StrReplace(value, "'", "''") "'"
}

FormatBytes(bytes) {
    if (bytes >= 1024 * 1024) {
        return Round(bytes / 1024 / 1024, 2) " MB"
    }

    if (bytes >= 1024) {
        return Round(bytes / 1024, 1) " KB"
    }

    return bytes " B"
}

; ============================================================
; Generic utils
; ============================================================

UniqueArray(items) {
    seen := Map()
    unique := []

    for item in items {
        key := StrLower(item)

        if (!seen.Has(key)) {
            seen[key] := true
            unique.Push(item)
        }
    }

    return unique
}

JoinArray(items, separator) {
    result := ""

    for index, item in items {
        if (index > 1) {
            result .= separator
        }

        result .= item
    }

    return result
}

ReverseArray(items) {
    reversed := []

    Loop items.Length {
        index := items.Length - A_Index + 1
        reversed.Push(items[index])
    }

    return reversed
}

StartsWith(text, prefix) {
    return SubStr(text, 1, StrLen(prefix)) = prefix
}

EndsWith(text, suffix) {
    if (StrLen(suffix) > StrLen(text)) {
        return false
    }

    return SubStr(text, StrLen(text) - StrLen(suffix) + 1) = suffix
}

Quote(value) {
    return Chr(34) . value . Chr(34)
}

GetFullPath(path) {
    try {
        shell := ComObject("Scripting.FileSystemObject")

        if (DirExist(path)) {
            return shell.GetFolder(path).Path
        }

        if (FileExist(path)) {
            return shell.GetFile(path).Path
        }
    }

    return path
}
