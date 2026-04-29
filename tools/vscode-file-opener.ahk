#Requires AutoHotkey v2.0
#SingleInstance Force

AppName := "VSCode File Opener"

AppDataPath := EnvGet("APPDATA")
if (AppDataPath = "") {
    AppDataPath := A_ScriptDir
}

ConfigFile := AppDataPath "\vscode-file-opener.ini"

DefaultRoot := "C:\Users\Cabraiz\Documents\GitHub\portfolio"

global CodeCommand := ""
global ProjectRoot := DefaultRoot

global MainGui
global InputEdit
global ResultEdit
global StatusText

LoadConfig()

if (!FileExist(CodeCommand)) {
    DetectOrAskVSCode()
}

if (!DirExist(ProjectRoot)) {
    AskProjectRoot()
}

BuildGui()

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

    ; Preferir Code.exe evita flash de CMD.
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

    ; Fallback para code.cmd/code.exe dentro de bin.
    if (localAppDataPath != "") {
        candidates.Push(localAppDataPath "\Programs\Microsoft VS Code\bin\code.exe")
        candidates.Push(localAppDataPath "\Programs\Microsoft VS Code\bin\code.cmd")
        candidates.Push(localAppDataPath "\Programs\Microsoft VS Code Insiders\bin\code-insiders.exe")
        candidates.Push(localAppDataPath "\Programs\Microsoft VS Code Insiders\bin\code-insiders.cmd")
    }

    if (programFilesPath != "") {
        candidates.Push(programFilesPath "\Microsoft VS Code\bin\code.exe")
        candidates.Push(programFilesPath "\Microsoft VS Code\bin\code.cmd")
        candidates.Push(programFilesPath "\Microsoft VS Code Insiders\bin\code-insiders.exe")
        candidates.Push(programFilesPath "\Microsoft VS Code Insiders\bin\code-insiders.cmd")
    }

    if (programFilesX86Path != "") {
        candidates.Push(programFilesX86Path "\Microsoft VS Code\bin\code.exe")
        candidates.Push(programFilesX86Path "\Microsoft VS Code\bin\code.cmd")
        candidates.Push(programFilesX86Path "\Microsoft VS Code Insiders\bin\code-insiders.exe")
        candidates.Push(programFilesX86Path "\Microsoft VS Code Insiders\bin\code-insiders.cmd")
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

AskVSCode(*) {
    global CodeCommand, AppName

    selected := FileSelect(
        1,
        GetInitialBrowseDir(),
        "Selecione Code.exe, code.exe ou code.cmd do VSCode",
        "VSCode (*.exe; *.cmd)"
    )

    if (selected = "") {
        MsgBox("Nenhum VSCode selecionado. O app será fechado.", AppName, "Iconx")
        ExitApp()
    }

    CodeCommand := selected
    SaveConfig()
}

AskProjectRoot(*) {
    global ProjectRoot, AppName

    selected := DirSelect(ProjectRoot, 3, "Selecione a pasta raiz do projeto")

    if (selected = "") {
        MsgBox("Nenhuma pasta selecionada. O app será fechado.", AppName, "Iconx")
        ExitApp()
    }

    ProjectRoot := selected
    SaveConfig()
}

BuildGui() {
    global MainGui, InputEdit, ResultEdit, StatusText
    global AppName

    MainGui := Gui("+Resize +AlwaysOnTop", AppName)
    MainGui.SetFont("s10", "Segoe UI")

    MainGui.AddText("xm ym w760", "Cole qualquer texto aqui. Ao dar Ctrl+V, o app abre os arquivos, limpa a caixa e copia o conteúdo encontrado.")
    MainGui.AddText("xm y+4 w760 c777777", "Depois de processar, o clipboard passa a conter o conteúdo acumulado dos arquivos encontrados.")

    InputEdit := MainGui.AddEdit("xm y+10 w760 h240 WantTab -Wrap")

    openButton := MainGui.AddButton("xm y+10 w170 h34 Default", "Abrir agora")
    openButton.OnEvent("Click", ProcessInput)

    chooseCodeButton := MainGui.AddButton("x+8 yp w160 h34", "Escolher VSCode")
    chooseCodeButton.OnEvent("Click", ChooseVSCodeClicked)

    chooseRootButton := MainGui.AddButton("x+8 yp w170 h34", "Escolher projeto")
    chooseRootButton.OnEvent("Click", ChooseProjectRootClicked)

    clearButton := MainGui.AddButton("x+8 yp w120 h34", "Limpar tudo")
    clearButton.OnEvent("Click", ClearAll)

    MainGui.AddText("xm y+14 w760", "Resultado:")
    ResultEdit := MainGui.AddEdit("xm y+6 w760 h120 ReadOnly -Wrap")

    StatusText := MainGui.AddText("xm y+10 w760 c555555", "")

    RefreshStatus()

    MainGui.OnEvent("Size", GuiResize)
    MainGui.OnEvent("Close", (*) => ExitApp())

    MainGui.Show("w800 h520")

    KeepWindowReady()
}

ChooseVSCodeClicked(*) {
    AskVSCode()
    RefreshStatus()
    KeepWindowReady()
}

ChooseProjectRootClicked(*) {
    AskProjectRoot()
    RefreshStatus()
    KeepWindowReady()
}

RefreshStatus() {
    global StatusText, CodeCommand, ProjectRoot

    StatusText.Value := "VSCode: " CodeCommand "`nProjeto: " ProjectRoot
}

GuiResize(guiObj, minMax, width, height) {
    global InputEdit, ResultEdit, StatusText

    if (minMax = -1) {
        return
    }

    margin := 20
    inputHeight := height - 280

    if (inputHeight < 160) {
        inputHeight := 160
    }

    resultY := inputHeight + 120
    resultHeight := 110

    InputEdit.Move(, , width - margin * 2, inputHeight)
    ResultEdit.Move(, resultY, width - margin * 2, resultHeight)
    StatusText.Move(, height - 46, width - margin * 2)
}

#HotIf WinActive("VSCode File Opener")
^v::{
    Send("^v")
    SetTimer(ProcessInput, -180)
}

^Enter::{
    ProcessInput()
}
#HotIf

ProcessInput(*) {
    global InputEdit, ResultEdit

    raw := InputEdit.Value

    if (Trim(raw) = "") {
        KeepWindowReady()
        return
    }

    tokens := ExtractTokens(raw)

    openedFilesMap := Map()
    notFound := []
    ambiguous := []

    for token in tokens {
        result := ResolveToken(token)

        if (result.status = "found") {
            key := StrLower(result.path)

            if (!openedFilesMap.Has(key)) {
                openedFilesMap[key] := result.path
            }
        } else if (result.status = "ambiguous") {
            ambiguous.Push(token)
        } else {
            notFound.Push(token)
        }
    }

    filesToOpen := []

    for _, filePath in openedFilesMap {
        filesToOpen.Push(filePath)
    }

    clipboardResult := { copied: false, files: 0, chars: 0 }

    if (filesToOpen.Length > 0) {
        OpenFilesInVSCode(filesToOpen)
        clipboardResult := CopyFoundFilesToClipboard(filesToOpen)
    }

    ; Sempre limpa a caixa principal, mesmo quando não encontra nada.
    InputEdit.Value := ""

    report := ""
    report .= "Arquivos abertos: " filesToOpen.Length "`r`n"

    if (filesToOpen.Length > 0) {
        for filePath in filesToOpen {
            report .= "  OK: " filePath "`r`n"
        }
    }

    if (clipboardResult.copied) {
        report .= "`r`nClipboard:`r`n"
        report .= "  Conteúdo copiado para Ctrl+V: " clipboardResult.files " arquivo(s), " clipboardResult.chars " caracteres.`r`n"
    } else if (filesToOpen.Length > 0) {
        report .= "`r`nClipboard:`r`n"
        report .= "  Nenhum conteúdo foi copiado. Verifique permissão/leitura dos arquivos.`r`n"
    }

    if (notFound.Length > 0) {
        report .= "`r`nNão encontrados: " notFound.Length "`r`n"

        for token in UniqueArray(notFound) {
            report .= "  X: " token "`r`n"
        }
    }

    if (ambiguous.Length > 0) {
        report .= "`r`nAmbíguos, mais de um arquivo com o mesmo nome: " ambiguous.Length "`r`n"

        for token in UniqueArray(ambiguous) {
            report .= "  ?: " token "`r`n"
        }
    }

    if (tokens.Length = 0) {
        report := "Nenhum path ou nome de arquivo detectado.`r`nA caixa foi limpa."
    }

    ResultEdit.Value := report

    KeepWindowReady()

    SetTimer(KeepWindowReady, -350)
    SetTimer(KeepWindowReady, -900)
}

ClearAll(*) {
    global InputEdit, ResultEdit

    InputEdit.Value := ""
    ResultEdit.Value := ""
    KeepWindowReady()
}

KeepWindowReady(*) {
    global MainGui, InputEdit

    try MainGui.Opt("+AlwaysOnTop")
    try WinSetAlwaysOnTop(1, "ahk_id " MainGui.Hwnd)
    try WinActivate("ahk_id " MainGui.Hwnd)
    try InputEdit.Focus()
}

ExtractTokens(text) {
    tokens := []

    pattern := "i)([A-Z]:[\\/][^\r\n]+?\.(?:tsx?|jsx?|css|scss|json|md|html|yml|yaml)|src[\\/][^\s]+|[\w.-]+\.(?:tsx?|jsx?|css|scss|json|md|html|yml|yaml))"

    pos := 1

    while (pos := RegExMatch(text, pattern, &match, pos)) {
        token := NormalizeToken(match[0])

        if (token != "") {
            tokens.Push(token)
        }

        pos += StrLen(match[0])
    }

    return UniqueArray(tokens)
}

NormalizeToken(token) {
    quote := Chr(34)

    token := Trim(token)
    token := Trim(token, quote . "'")
    token := RegExReplace(token, "[,;:\)\]\}\.]+$", "")
    token := Trim(token, quote . "'")
    token := StrReplace(token, "/", "\")

    return Trim(token)
}

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

ResolveToken(token) {
    global ProjectRoot

    token := NormalizeToken(token)

    if (token = "") {
        return { status: "not_found", path: "" }
    }

    root := RTrim(ProjectRoot, "\")
    rootLower := StrLower(root)

    if (RegExMatch(token, "i)^[A-Z]:\\")) {
        if (!FileExist(token)) {
            return { status: "not_found", path: "" }
        }

        full := GetFullPath(token)

        if (StartsWith(StrLower(full), rootLower)) {
            return { status: "found", path: full }
        }

        return { status: "not_found", path: "" }
    }

    if (InStr(token, "\")) {
        candidate := root "\" token

        if (FileExist(candidate)) {
            return { status: "found", path: GetFullPath(candidate) }
        }

        return { status: "not_found", path: "" }
    }

    return FindUniqueFileByName(root, token)
}

FindUniqueFileByName(root, fileName) {
    found := ""
    count := 0
    targetName := StrLower(fileName)

    Loop Files root "\*", "FR" {
        fullPath := A_LoopFileFullPath
        lowerPath := StrLower(fullPath)

        if (
            InStr(lowerPath, "\node_modules\") ||
            InStr(lowerPath, "\.git\") ||
            InStr(lowerPath, "\dist\") ||
            InStr(lowerPath, "\build\") ||
            InStr(lowerPath, "\coverage\") ||
            InStr(lowerPath, "\.vite\") ||
            InStr(lowerPath, "\.next\") ||
            InStr(lowerPath, "\out\") ||
            RegExMatch(lowerPath, "\\[^\\]+\.old\\")
        ) {
            continue
        }

        if (StrLower(A_LoopFileName) = targetName) {
            count += 1
            found := fullPath

            if (count > 1) {
                return { status: "ambiguous", path: "" }
            }
        }
    }

    if (count = 1) {
        return { status: "found", path: found }
    }

    return { status: "not_found", path: "" }
}

OpenFilesInVSCode(files) {
    global CodeCommand, ProjectRoot

    root := RTrim(ProjectRoot, "\")

    args := "-r " Quote(root)

    for filePath in files {
        args .= " " Quote(filePath)
    }

    commandLower := StrLower(CodeCommand)

    ; Se for .cmd/.bat, executa via cmd.exe escondido.
    ; Isso evita a janela preta piscando.
    if (
        EndsWith(commandLower, ".cmd") ||
        EndsWith(commandLower, ".bat")
    ) {
        innerCommand := Quote(CodeCommand) " " args
        command := Quote(A_ComSpec) " /d /c " Quote(innerCommand)

        Run(command, root, "Hide")
        return
    }

    ; Se for .exe, executa diretamente.
    command := Quote(CodeCommand) " " args
    Run(command, root)
}

CopyFoundFilesToClipboard(files) {
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
