; ============================================================
; Path utils
; ============================================================

NormalizeZipRelativePath(path) {
    global ProjectRoot

    path := NormalizeSlashes(path)
    path := RegExReplace(path, "^\.\\", "")
    path := RegExReplace(path, "^\\+", "")
    path := RegExReplace(path, "\\+", "\")
    path := Trim(path, "\")

    if (path = "") {
        return ""
    }

    ; Remove a pasta raiz do projeto quando o ZIP vem assim:
    ; agent-avaliador-de-cancelamento\api\...
    ; qualquer-wrapper\agent-avaliador-de-cancelamento\api\...
    ; qualquer-wrapper\x\agent-avaliador-de-cancelamento\api\...
    projectName := StrLower(GetFileName(RTrim(GetFullPath(ProjectRoot), "\")))

    if (projectName != "") {
        segments := StrSplit(path, "\")

        for index, segment in segments {
            if (StrLower(segment) = projectName) {
                if (segments.Length > index) {
                    return JoinSegmentsFrom(segments, index + 1)
                }

                return ""
            }
        }
    }

    return path
}

NormalizeSlashes(path) {
    path := StrReplace(path, "/", "\")
    path := RegExReplace(path, "\\+", "\")
    return path
}

IsSafeZipRelativePath(path) {
    path := NormalizeSlashes(path)

    if (path = "") {
        return false
    }

    ; Bloqueia caminho absoluto Windows, UNC e traversal.
    if (RegExMatch(path, "i)^[a-z]:\\")) {
        return false
    }

    if (StartsWith(path, "\\")) {
        return false
    }

    if (InStr(path, ":")) {
        return false
    }

    if (RegExMatch("\" path "\", "\\\.\.($|\\)")) {
        return false
    }

    return true
}

ProjectHasTopLevelSegment(segmentName) {
    global ProjectRoot

    if (segmentName = "") {
        return false
    }

    projectFull := RTrim(GetFullPath(ProjectRoot), "\")
    candidate := projectFull "\" segmentName

    return DirExist(candidate) || FileExist(candidate)
}

IsLikelyWrapperSegment(segmentName) {
    global ProjectRoot

    lower := StrLower(segmentName)
    projectName := StrLower(GetFileName(RTrim(GetFullPath(ProjectRoot), "\")))

    if (projectName != "" && InStr(lower, projectName)) {
        return true
    }

    ; Nomes típicos de pasta wrapper gerada por ZIP/export do ChatGPT/GitHub.
    return (
        InStr(lower, "patch") ||
        InStr(lower, "update") ||
        InStr(lower, "bundle") ||
        InStr(lower, "output") ||
        InStr(lower, "artifact") ||
        InStr(lower, "generated") ||
        InStr(lower, "chatgpt") ||
        InStr(lower, "zip")
    )
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

    SplitPath(path, &fileName)
    lowerName := StrLower(fileName)

    ; Extensões comuns de código/config/scripts.
    if (RegExMatch(path, "i)\.(" SupportedExtensionsRegex ")$")) {
        return true
    }

    ; Arquivos importantes sem extensão ou com nome especial.
    for exactName in [
        "dockerfile",
        "containerfile",
        "makefile",
        "procfile",
        "license",
        "licence",
        "notice",
        "readme",
        ".gitignore",
        ".gitattributes",
        ".dockerignore",
        ".editorconfig",
        ".npmrc",
        ".python-version",
        ".node-version",
        ".nvmrc"
    ] {
        if (lowerName = exactName) {
            return true
        }
    }

    ; Exemplos: Dockerfile.dev, Makefile.local, .env.example.
    if (RegExMatch(lowerName, "i)^(dockerfile|containerfile|makefile)(\.|$)")) {
        return true
    }

    if (RegExMatch(lowerName, "i)^\.env\.(example|sample|template|local\.example)$")) {
        return true
    }

    return false
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

