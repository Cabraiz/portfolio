
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
    global ProjectRoot

    rel := NormalizeZipRelativePath(relativePath)

    if (rel = "") {
        return { found: false, target: "", score: 0, reason: "Path vazio." }
    }

    if (!IsSafeZipRelativePath(rel)) {
        return { found: false, target: "", score: 0, reason: "Path inseguro no ZIP: " rel }
    }

    projectFull := RTrim(GetFullPath(ProjectRoot), "\")
    candidates := []
    segments := StrSplit(rel, "\")

    ; 1) Path direto, mas só dá prioridade quando o primeiro segmento
    ;    já parece pertencer ao projeto. Isso evita criar:
    ;    ProjectRoot\qualquer-wrapper\scripts\x.ps1
    directScore := 88

    if (segments.Length = 1) {
        directScore := 105
    } else if (ProjectHasTopLevelSegment(segments[1])) {
        directScore := 125
    } else if (IsLikelyWrapperSegment(segments[1])) {
        directScore := 25
    } else {
        directScore := 55
    }

    AddCandidate(candidates, projectFull, rel, "path relativo direto calculado de forma segura", directScore)

    ; 2) Modo inteligente real:
    ;    tenta TODOS os sufixos possíveis do path. Assim não precisa cadastrar
    ;    api/docs/scripts/src/etc no AHK. Se existir ProjectRoot\scripts,
    ;    scripts\arquivo.ps1 ganha naturalmente de wrapper\scripts\arquivo.ps1.
    ;
    ;    Exemplos:
    ;      pacote\scripts\start.ps1          -> scripts\start.ps1
    ;      agent-x\api\main.py              -> api\main.py
    ;      qualquer\observability\p.yml     -> observability\p.yml
    Loop segments.Length - 1 {
        startIndex := A_Index + 1
        tail := JoinSegmentsFrom(segments, startIndex)

        if (tail = "") {
            continue
        }

        firstTailSegment := StrSplit(tail, "\")[1]
        baseScore := 70

        if (ProjectHasTopLevelSegment(firstTailSegment)) {
            baseScore := 132
        } else if (FileExist(projectFull "\" tail)) {
            baseScore := 138
        } else if (DirExist(GetDirName(projectFull "\" tail))) {
            baseScore := 118
        } else if (startIndex = segments.Length) {
            ; Último recurso: nome solto. Só deve vencer se for arquivo único já existente.
            baseScore := 35
        }

        AddCandidate(candidates, projectFull, tail, "encaixe genérico por sufixo: " tail, baseScore)
    }

    ; 3) Arquivo solto: privilegia arquivo existente único. Se não existir,
    ;    cria na raiz do projeto.
    if (segments.Length = 1) {
        existing := FindUniqueFileByNameIndexed(rel)
        if (existing.status = "found") {
            AddCandidate(candidates, GetDirName(existing.path), GetFileName(existing.path), "arquivo solto encontrado de forma única no projeto", 160)
        } else if (existing.status = "ambiguous") {
            return { found: false, target: "", score: 0, reason: "Arquivo solto ambíguo. Informe pastas no ZIP/path." }
        } else {
            AddCandidate(candidates, projectFull, rel, "arquivo solto aplicado na raiz do projeto", 95)
        }
    }

    if (candidates.Length = 0) {
        return { found: false, target: "", score: 0, reason: "Nenhum destino seguro foi inferido." }
    }

    best := SelectBestCandidate(candidates)

    if (!IsPathInsideProject(best.target)) {
        return { found: false, target: "", score: 0, reason: "Destino calculado ficou fora do projeto. Bloqueado por segurança." }
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

    for index, item in plan {
        try {
            SetZipHud("copying", "Aplicando " index "/" plan.Length ": " item.targetRelative, "info")
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
    if (openResult.HasOwnProp("skipped") && openResult.skipped) {
        report .= "  Abrir abas após aplicar ZIP: desligado/silencioso`r`n"
        report .= "  VSCode focado: não`r`n"
        report .= "  Motivo: " openResult.error "`r`n"
    } else {
        report .= "  Abrir abas após aplicar ZIP: ligado`r`n"
        report .= "  Fechar abas tentou: " (openResult.closeAttempted ? "sim" : "não") "`r`n"
        report .= "  Fechamento confirmado: " (openResult.closedTabs ? "sim" : "não") "`r`n"
        report .= "  Lotes enviados: " openResult.batches "`r`n"
        report .= "  Comando executado: " (openResult.runOk ? "sim" : "não") "`r`n"

        if (openResult.HasOwnProp("error") && openResult.error != "") {
            report .= "  Erro VSCode: " openResult.error "`r`n"
        }
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
    report .= "  O script só copia dentro do ProjectRoot, bloqueia path absoluto/UNC/.. e cria backup antes de overwrite.`r`n"
    report .= "  A inferência agora é genérica: remove wrappers, testa path direto e todos os sufixos possíveis do path.`r`n"

    return report
}


