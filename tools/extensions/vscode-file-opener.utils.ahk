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
