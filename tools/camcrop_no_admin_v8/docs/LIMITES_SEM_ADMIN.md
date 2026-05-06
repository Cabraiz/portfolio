# Limites técnicos sem administrador

Este pacote evita OBS, driver e privilégio de administrador usando uma extensão de navegador.

A extensão intercepta chamadas de câmera feitas pela página e substitui o vídeo por um `canvas.captureStream()` com rotação, espelhamento e crop.

## Ponto essencial

Ela não registra uma câmera no Windows. Portanto, o sistema operacional não passa a ter uma nova webcam chamada CamCrop.

O Teams/Meet/Zoom Web continuam mostrando câmeras normais, como:

- HD Pro Webcam C920
- OBS Virtual Camera, se já existir instalada
- câmera integrada do notebook

O CamCrop transforma o stream por dentro do navegador.

## Por que a câmera às vezes não aparecia direito na v0.1

O `deviceId` da câmera é protegido por privacidade e pode mudar conforme a origem/site. Um `deviceId` lido dentro do popup da extensão pode não valer dentro de `teams.microsoft.com`.

Na v0.2, a lista de câmeras é pedida para a aba ativa do Teams/Meet/Zoom, então o ID passa a ser do próprio site.

## Quando precisa recarregar

Se o Teams já pegou a webcam antes da extensão carregar, a extensão não consegue alterar aquele stream antigo. Recarregue a aba ou desligue/ligue a câmera na reunião.


## Domínios suportados na v3

Inclui `meet.google.com`, `teams.microsoft.com`, `teams.live.com`, `teams.cloud.microsoft` e domínios web do Zoom.


## Observação da v4

Agora há controles de **Mover enquadramento** para facilitar o reposicionamento depois do crop.


## Novidade da v5

- Ao usar **90°** ou **270°**, o CamCrop agora mantém a imagem **inteira**, centralizada, com **faixas pretas automáticas** quando necessário, em vez de ampliar e cortar demais.


## Novidade da v6

- Os controles de **corte** agora seguem a **orientação visual atual** após girar a câmera. Ex.: ao usar **90°**, cortar **Baixo** corta o **baixo que você está vendo**, e não uma lateral da imagem original.


## Novidade da v7

- Corrigido o mapeamento do **corte em 90° e 270°**. Agora, ao girar **90°**, cortar **Baixo** corta realmente a **parte de baixo visível** da imagem, em vez da parte de cima.


## Novidade da v8

- Padrão de saída alterado de **1280x720** para **1920x1080**.
- A extensão agora solicita a câmera física com qualidade ideal maior, para evitar que o Teams/Meet receba uma fonte já reduzida.
- A trilha de vídeo gerada pelo canvas usa `contentHint = "detail"` para priorizar nitidez.
- Configurações antigas em 720p são migradas automaticamente para 1080p.
