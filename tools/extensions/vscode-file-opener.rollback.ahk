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
    global OpenTabsAfterZipApply

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

    openResult := MakeOpenResultSkipped("Modo silencioso ZIP: rollback não abriu abas porque abrir abas ZIP está OFF.")

    if (OpenTabsAfterZipApply && openAfterRevert.Length > 0) {
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
    if (openResult.HasOwnProp("skipped") && openResult.skipped) {
        report .= "  Abrir abas após rollback: desligado/silencioso`r`n"
        report .= "  VSCode focado: não`r`n"
        report .= "  Motivo: " openResult.error "`r`n"
    } else {
        report .= "  Abrir abas após rollback: ligado`r`n"
        report .= "  Fechar abas tentou: " (openResult.closeAttempted ? "sim" : "não") "`r`n"
        report .= "  Fechamento confirmado: " (openResult.closedTabs ? "sim" : "não") "`r`n"
        report .= "  Lotes enviados: " openResult.batches "`r`n"
        report .= "  Comando executado: " (openResult.runOk ? "sim" : "não") "`r`n"

        if (openResult.HasOwnProp("error") && openResult.error != "") {
            report .= "  Erro VSCode: " openResult.error "`r`n"
        }
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

