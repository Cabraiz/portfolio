#Requires AutoHotkey v2.0
#SingleInstance Force

; ============================================================
; VSCode File Opener + ZIP Auto Apply - AutoHotkey v2
; Versão: generic-smart para qualquer projeto dentro do ProjectRoot
; Correção: aceita .ps1/.py/.sh e resolve paths por sufixo, sem cadastrar folders
; Fluxos:
;   1) Manual: cola paths e abre no VSCode.
;   2) Automático: detecta ZIP novo em Downloads com menos de 3MB,
;      extrai, infere o destino pelo encaixe dos folders internos,
;      copia/substitui no projeto e cria backup.
;      Por padrão, NÃO abre/foca VSCode após aplicar o ZIP.
;   3) Rollback: botão para reverter o último ZIP aplicado.
;      - Arquivo sobrescrito volta do backup.
;      - Arquivo criado pelo ZIP é apagado.
; ============================================================

AppName := "VSCode File Opener + ZIP Auto Apply Inteligente"

; ============================================================
; GUI 9:16
; ============================================================

; Janela HUD em formato vertical 9:16, com altura máxima de 620px.
; 620 * 9 / 16 = 349px de largura aproximada.
; A organização é em blocos compactos e botões em grade vertical.
GuiAspectWidth := 9
GuiAspectHeight := 16
GuiMaxHeight := 620
GuiInitialHeight := GuiMaxHeight
GuiInitialWidth := Round(GuiInitialHeight * GuiAspectWidth / GuiAspectHeight)
GuiContentMargin := 10
GuiContentWidth := GuiInitialWidth - (GuiContentMargin * 2)

DefaultRoot := "C:\Users\Cabraiz\Documents\GitHub\agent-avaliador-de-cancelamento"

; Compatibilidade antiga: não usado no modo agent-avaliador.
DrivingRootRelative := ""
MobileRootRelative := ""

CloseTabsBeforeOpen := true
CopyFoundFilesContentToClipboard := true
ClearInputAfterSuccessfulOpen := true

; Default false: ZIP aplica arquivos em modo silencioso, sem focar VSCode.
; Use o botão "Abrir abas ZIP" para alternar para true quando quiser revisar as abas abertas.
OpenTabsAfterZipApply := false

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

SupportedExtensionsRegex := "tsx?|jsx?|css|scss|sass|less|json|mdx?|html|ya?ml|xml|txt|env|pyw?|ps1|psm1|psd1|sh|bash|zsh|bat|cmd|sql|toml|ini|cfg|conf|properties|lock|svg|png|jpe?g|webp|gif|glb|gltf|mp3|wav|ogg|mp4|webm|ttf|otf|woff2?"

AppDataPath := EnvGet("APPDATA")
if (AppDataPath = "") {
    AppDataPath := A_ScriptDir
}

ConfigFile := AppDataPath "\vscode-file-opener-inteligente.ini"
BackupRoot := AppDataPath "\vscode-file-opener-inteligente-backups"
TempRoot := A_Temp "\vscode-file-opener-inteligente-zip"

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
global ZipDeliveryHudText
global WatchToggleButton
global ZipOpenTabsToggleButton

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

#Include %A_ScriptDir%\vscode-file-opener.config.ahk
#Include %A_ScriptDir%\vscode-file-opener.gui.ahk
#Include %A_ScriptDir%\vscode-file-opener.input.ahk
#Include %A_ScriptDir%\vscode-file-opener.zip-watcher.ahk
#Include %A_ScriptDir%\vscode-file-opener.zip-plan.ahk
#Include %A_ScriptDir%\vscode-file-opener.rollback.ahk
#Include %A_ScriptDir%\vscode-file-opener.parser.ahk
#Include %A_ScriptDir%\vscode-file-opener.vscode.ahk
#Include %A_ScriptDir%\vscode-file-opener.paths.ahk
#Include %A_ScriptDir%\vscode-file-opener.utils.ahk