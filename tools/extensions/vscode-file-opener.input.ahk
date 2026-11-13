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

