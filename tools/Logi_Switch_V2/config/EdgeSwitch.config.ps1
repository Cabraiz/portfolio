# config\EdgeSwitch.config.ps1
# Arquivo único para ajustar bordas, velocidade e warmup.
# Não mexa nos outros arquivos se só quiser mudar comportamento.

# ESQUERDA -> canal 2
$LeftEdgeTargetChannel = 2
$LeftEdgeWidthPixels = 2
$LeftEdgeDwellMilliseconds = 0
$LeftEdgeCooldownMilliseconds = 1500
$LeftEdgePollMilliseconds = 5
$LeftEdgeRequireLeaveAndReturn = $true
$LeftEdgeVerbose = $false

# DIREITA -> canal 3
$RightEdgeTargetChannel = 3
$RightEdgeWidthPixels = 2
$RightEdgeDwellMilliseconds = 0
$RightEdgeCooldownMilliseconds = 1500
$RightEdgePollMilliseconds = 5
$RightEdgeRequireLeaveAndReturn = $true
$RightEdgeVerbose = $false

# TRAVA CONTÍNUA PÓS-TROCA
# Continua monitorando. Depois de disparar, só rearma quando afastar X pixels.
$StopMonitoringAfterSwitch = $false
$RearmDistancePixels = 80

# WARMUP AUTOMÁTICO
# true = ao abrir, já enumera dispositivos e pré-monta os reports dos canais 1/2/3.
$AutoWarmupOnStart = $true

# true = na hora da troca usa filas já preparadas em memória.
$UsePreparedPayloadCache = $true

# HOT FIRST
# true = antes do burst amplo, envia os candidatos mais prováveis.
# Isso tende a fazer a mudança física acontecer quase instantaneamente.
$HotFirstEnabled = $true

# true = depois dos candidatos quentes, ainda envia fallback amplo para compatibilidade.
# A troca física normalmente já acontece no HotFirst; o fallback só garante.
$SendFallbackBurstAfterHot = $true

# DeviceIndex que entra na fila quente.
# No seu receiver, DeviceIndex 1 já apareceu como candidato forte.
$HotDeviceIndexes = @(1, 2)

# Pares quentes.
# A V2 que funcionou começou com 09/1E e 0C/1C; por isso eles ficam primeiro.
$HotPairs = @("09/1E", "0C/1C", "0A/10", "0A/11", "0A/12", "0A/13")

# Delay entre pacotes HID.
# 0 = mais rápido. Se ficar instável, tente 1 ou 2.
$SwitchInterPacketDelayMilliseconds = 0

# Envio em lote: abre HID uma vez e manda tudo.
$UseBulkSend = $true
$UseSetOutputReport = $true
$UseWriteFile = $true

# Até qual DeviceIndex testar no fallback.
$MaxDeviceIndex = 8

# Mapeamento de valor de canal observado no seu teste:
# Canal 1 = 0x00
# Canal 2 = 0x01
# Canal 3 = 0x02
$Channel1Value = 0x00
$Channel2Value = 0x01
$Channel3Value = 0x02
