#Requires AutoHotkey v2.0
#SingleInstance Force

; ============================================================
; VSCode File Opener - AutoHotkey v2
; Versão corrigida: parser sem regex gigante com aspas internas
; ============================================================

AppName := "VSCode File Opener"

DefaultRoot := "C:\Users\Cabraiz\Documents\GitHub\portfolio"

; Base usada quando você cola:
;   domain/pedestrians/arquivo.ts
;   three/pedestrians/arquivo.tsx
DrivingRootRelative := "src\pages\Mateus\Home\components\mobile\game\driving"

; Base usada quando você cola:
;   game/driving/domain/...
MobileRootRelative := "src\pages\Mateus\Home\components\mobile"

CloseTabsBeforeOpen := true
CopyFoundFilesContentToClipboard := true
ClearInputAfterSuccessfulOpen := true

OpenBatchSize := 12

VSCodeWindowWaitMs := 2200
VSCodeCloseTabsDelayMs := 220
VSCodeOpenAfterCloseDelayMs := 160
VSCodeBatchDelayMs := 90

AppDataPath := EnvGet("APPDATA")
if (AppDataPath = "") {
    AppDataPath := A_ScriptDir
}

ConfigFile := AppDataPath "\vscode-file-opener.ini"

global CodeCommand := ""
global ProjectRoot := DefaultRoot

global MainGui
global BannerText
global InputEdit
global ResultEdit
global ConfigText

global IsProcessing := false
global FileNameIndexBuilt := false
global FileNameIndex := Map()

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

; ============================================================
; Configuração
; ============================================================

LoadConfig() {
    global ConfigFile, CodeCommand, ProjectRoot, DefaultRoot

    CodeCommand := IniRead(ConfigFile, "config", "codeCommand", "")
    ProjectRoot := IniRead(ConfigFile, "config", "projectRoot", DefaultRoot)
}

SaveConfig() {
    global ConfigFile, CodeCommand, ProjectRoot

    IniWrite(CodeCommand, ConfigFile, "config", "codeCommand")
    IniWrite(ProjectRoot, ConfigFile, "config", "projectRoot")
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

    ; Preferir CLI do VSCode.
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

    ; Fallback para executável visual.
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

    ; Se o INI antigo guardou Code.exe, tenta trocar para bin\code.cmd.
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

; ============================================================
; GUI
; ============================================================

BuildGui() {
    global MainGui, BannerText, InputEdit, ResultEdit, ConfigText, AppName

    MainGui := Gui("+Resize +AlwaysOnTop", AppName)
    MainGui.SetFont("s10", "Segoe UI")

    MainGui.AddText("xm ym w900", "Cole os paths abaixo. O app mostra STATUS, ERRO ou AVISO acima da caixa antes e depois de processar.")

    BannerText := MainGui.AddText("xm y+8 w900 h30 +Border c555555", "AGUARDANDO — cole paths e pressione Ctrl+V, Ctrl+Enter ou clique em Abrir agora.")

    MainGui.AddText(
        "xm y+8 w900 c777777",
        "Aceita: src/..., domain/..., three/..., game/driving/... e nomes de arquivos soltos."
    )

    InputEdit := MainGui.AddEdit("xm y+10 w900 h245 WantTab -Wrap")

    openButton := MainGui.AddButton("xm y+10 w150 h34 Default", "Abrir agora")
    openButton.OnEvent("Click", QueueProcessInput)

    pasteButton := MainGui.AddButton("x+8 yp w150 h34", "Colar e abrir")
    pasteButton.OnEvent("Click", PasteClipboardAndQueue)

    chooseCodeButton := MainGui.AddButton("x+8 yp w150 h34", "Escolher VSCode")
    chooseCodeButton.OnEvent("Click", ChooseVSCodeClicked)

    chooseRootButton := MainGui.AddButton("x+8 yp w150 h34", "Escolher projeto")
    chooseRootButton.OnEvent("Click", ChooseProjectRootClicked)

    clearButton := MainGui.AddButton("x+8 yp w130 h34", "Limpar tudo")
    clearButton.OnEvent("Click", ClearAll)

    MainGui.AddText("xm y+14 w900", "Resultado / diagnóstico:")
    ResultEdit := MainGui.AddEdit("xm y+6 w900 h145 ReadOnly -Wrap")

    ConfigText := MainGui.AddText("xm y+10 w900 c555555", "")

    RefreshConfigText()
    SetBanner("AGUARDANDO — cole paths e pressione Ctrl+V, Ctrl+Enter ou clique em Abrir agora.", "info")

    MainGui.OnEvent("Size", GuiResize)
    MainGui.OnEvent("Close", (*) => ExitApp())

    MainGui.Show("w940 h610")

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
    global ConfigText, CodeCommand, ProjectRoot
    global CloseTabsBeforeOpen, CopyFoundFilesContentToClipboard, OpenBatchSize
    global DrivingRootRelative, MobileRootRelative

    closeMode := CloseTabsBeforeOpen ? "ligado" : "desligado"
    copyMode := CopyFoundFilesContentToClipboard ? "ligado" : "desligado"

    ConfigText.Value :=
        "VSCode: " CodeCommand "`n"
        . "Projeto: " ProjectRoot "`n"
        . "Base domain/three: " DrivingRootRelative "`n"
        . "Base game/driving: " MobileRootRelative "`n"
        . "Fechar abas antes: " closeMode " | Copiar conteúdo: " copyMode " | Lote: " OpenBatchSize
}

GuiResize(guiObj, minMax, width, height) {
    global BannerText, InputEdit, ResultEdit, ConfigText

    if (minMax = -1) {
        return
    }

    margin := 20
    contentWidth := width - margin * 2

    inputHeight := height - 370

    if (inputHeight < 170) {
        inputHeight := 170
    }

    resultY := inputHeight + 172
    resultHeight := 145

    BannerText.Move(, , contentWidth)
    InputEdit.Move(, , contentWidth, inputHeight)
    ResultEdit.Move(, resultY, contentWidth, resultHeight)
    ConfigText.Move(, height - 98, contentWidth)
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

SetResult(message) {
    global ResultEdit

    try ResultEdit.Value := message
}

#HotIf WinActive("VSCode File Opener")
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
        SetBanner("ERRO — processamento interrompido. Veja o diagnóstico abaixo.", "error")
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
; Parser corrigido
; Não usa regex gigante com aspas internas.
; ============================================================

ExtractTokens(text) {
    tokens := []
    normalizedText := StrReplace(text, "/", "\")

    for rawLine in StrSplit(normalizedText, "`n", "`r") {
        line := NormalizeToken(rawLine)

        if (line = "") {
            continue
        }

        ; Caso comum: uma linha inteira é o path.
        if (LooksLikeFileToken(line)) {
            tokens.Push(line)
            continue
        }

        ; Fallback: quando a linha possui texto + path.
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
    if (token = "") {
        return false
    }

    ; Precisa terminar em extensão conhecida.
    if (!RegExMatch(token, "i)\.(tsx?|jsx?|css|scss|sass|less|json|mdx?|html|ya?ml|xml|txt|env|svg|png|jpe?g|webp|gif|glb|gltf|mp3|wav|ogg|mp4|webm)$")) {
        return false
    }

    ; Aceita path absoluto, path relativo com barra ou nome de arquivo solto.
    if (RegExMatch(token, "i)^[A-Z]:\\")) {
        return true
    }

    if (InStr(token, "\")) {
        return true
    }

    if (RegExMatch(token, "i)^[A-Za-z0-9_.-]+\.(tsx?|jsx?|css|scss|sass|less|json|mdx?|html|ya?ml|xml|txt|env|svg|png|jpe?g|webp|gif|glb|gltf|mp3|wav|ogg|mp4|webm)$")) {
        return true
    }

    return false
}

NormalizeToken(token) {
    quote := Chr(34)

    token := Trim(token)
    token := RegExReplace(token, "^\s*[-*•]+\s*", "")
    token := RegExReplace(token, "^\s*\d+[\.\)]\s*", "")
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

        ; Evita busca recursiva pesada para paths com pasta.
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
; Clipboard e relatório
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

; ============================================================
; Utils
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
    shell := ComObject("Scripting.FileSystemObject")

    if (DirExist(path)) {
        return shell.GetFolder(path).Path
    }

    if (FileExist(path)) {
        return shell.GetFile(path).Path
    }

    return path
}
