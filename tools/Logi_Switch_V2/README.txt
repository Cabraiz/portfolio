Logi EasySwitch AUTO WARMUP HOTFIRST

Versão pedida:
- sem opção de calibração manual;
- sem menu legado;
- warmup automático embutido;
- troca rápida com HotFirst;
- borda esquerda -> canal 2;
- borda direita -> canal 3;
- loop contínuo com trava até afastar da borda.

Menu:
1) Trocar para canal 1
2) Trocar para canal 2
3) Trocar para canal 3
4) Monitorar borda esquerda -> canal 2
5) Monitorar borda direita -> canal 3
Q) Sair

O que o warmup faz:
- Ao abrir o app, ele enumera os endpoints Logitech.
- Pré-monta em memória as filas de reports dos canais 1, 2 e 3.
- Na hora da borda, não precisa montar nada; só envia.
- A fila HOT vai primeiro: 09/1E, 0C/1C e alguns 0A iniciais.
- Depois vem fallback amplo, se ativado.

Arquivo único para ajustar:
  config\EdgeSwitch.config.ps1

Configs importantes:
  $AutoWarmupOnStart = $true
  $UsePreparedPayloadCache = $true
  $HotFirstEnabled = $true
  $SendFallbackBurstAfterHot = $true
  $HotDeviceIndexes = @(1, 2)
  $HotPairs = @("09/1E", "0C/1C", "0A/10", "0A/11", "0A/12", "0A/13")

Para tentar mais velocidade ainda:
  $SendFallbackBurstAfterHot = $false

Se parar de trocar, volte para:
  $SendFallbackBurstAfterHot = $true

Sem:
- binário externo
- internet
- clipboard
- transferência de arquivos
- startup
- serviço
