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
    global ProjectRoot

    roots := []
    projectFull := RTrim(GetFullPath(ProjectRoot), "\")
    roots.Push(projectFull)

    ; Roots úteis para colar paths curtos manualmente.
    ; Agora é dinâmico: pega todas as pastas diretas do ProjectRoot,
    ; sem lista fixa api/docs/scripts/etc.
    Loop Files projectFull "\*", "D" {
        lowerPath := StrLower(A_LoopFileFullPath)

        if (ShouldSkipPath(lowerPath)) {
            continue
        }

        roots.Push(GetFullPath(A_LoopFileFullPath))
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

