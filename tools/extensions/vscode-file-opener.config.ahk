; ============================================================
; Configuração
; ============================================================

LoadConfig() {
    global ConfigFile, CodeCommand, ProjectRoot, DefaultRoot, DownloadsDir
    global AutoZipWatcherEnabled, MaxAutoZipBytes, OpenTabsAfterZipApply

    CodeCommand := IniRead(ConfigFile, "config", "codeCommand", "")
    ProjectRoot := IniRead(ConfigFile, "config", "projectRoot", DefaultRoot)
    DownloadsDir := IniRead(ConfigFile, "config", "downloadsDir", DownloadsDir)
    AutoZipWatcherEnabled := IniRead(ConfigFile, "config", "autoZipWatcherEnabled", AutoZipWatcherEnabled ? "1" : "0") = "1"
    OpenTabsAfterZipApply := IniRead(ConfigFile, "config", "openTabsAfterZipApply", OpenTabsAfterZipApply ? "1" : "0") = "1"
    MaxAutoZipBytes := Integer(IniRead(ConfigFile, "config", "maxAutoZipBytes", String(MaxAutoZipBytes)))
}

SaveConfig() {
    global ConfigFile, CodeCommand, ProjectRoot, DownloadsDir, AutoZipWatcherEnabled, MaxAutoZipBytes, OpenTabsAfterZipApply

    IniWrite(CodeCommand, ConfigFile, "config", "codeCommand")
    IniWrite(ProjectRoot, ConfigFile, "config", "projectRoot")
    IniWrite(DownloadsDir, ConfigFile, "config", "downloadsDir")
    IniWrite(AutoZipWatcherEnabled ? "1" : "0", ConfigFile, "config", "autoZipWatcherEnabled")
    IniWrite(OpenTabsAfterZipApply ? "1" : "0", ConfigFile, "config", "openTabsAfterZipApply")
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

