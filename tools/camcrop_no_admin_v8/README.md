# CamCrop No Admin v3 v0.2

Extensão para Chrome/Edge que transforma a webcam dentro do navegador, sem OBS, sem driver e sem permissão de administrador.

## O que mudou na v0.2

- A lista de câmeras agora é lida da aba ativa do Teams/Meet/Zoom Web.
- Corrigido o problema de `deviceId` inválido: IDs de câmera são diferentes entre o popup da extensão e o site.
- O popup mostra se o CamCrop está ativo na aba.
- Se a câmera selecionada falhar, o CamCrop tenta cair para a câmera escolhida pelo próprio site em vez de quebrar a chamada.

## Limite importante

Sem administrador, a extensão **não cria uma câmera nova no Windows**. Então o Teams/Meet/Zoom **não vão mostrar uma câmera chamada CamCrop**.

O fluxo correto é:

1. Instale a extensão.
2. Abra ou recarregue o Teams Web/Meet/Zoom Web.
3. No Teams/Meet, selecione uma câmera normal, como `HD Pro Webcam C920`.
4. Abra o popup do CamCrop.
5. Ative rotação/corte/espelhamento.
6. Desligue e ligue a câmera na reunião ou recarregue a aba.


## Correção v3

Esta versão adiciona suporte ao domínio `https://teams.live.com/*`.

Se o popup mostrar **aba não suportada**, a extensão não foi injetada naquela página e nenhuma rotação/corte será aplicado. Depois de atualizar a extensão:

1. remova a extensão antiga;
2. carregue a pasta `extension` da v3;
3. feche/reabra ou recarregue a aba do Teams;
4. entre novamente na reunião;
5. desligue e ligue a câmera se ela já estava ativa.

## Como instalar

1. Abra `chrome://extensions` ou `edge://extensions`.
2. Ative `Modo do desenvolvedor`.
3. Clique em `Carregar sem compactação`.
4. Selecione a pasta `extension`.
5. Abra/recarregue o Teams Web, Google Meet ou Zoom Web.

## Como usar no Teams Web

1. Entre na reunião pelo navegador.
2. No menu de câmera do Teams, escolha a câmera física, por exemplo `HD Pro Webcam C920`.
3. Clique no ícone da extensão CamCrop.
4. Clique em `Permitir e listar câmeras da aba`.
5. Em `Câmera de entrada`, escolha:
   - `Usar câmera escolhida no Teams/Meet`, ou
   - a câmera física listada pela aba.
6. Ajuste rotação/corte.
7. Desligue e ligue a câmera no Teams.

## Se não funcionar

- Recarregue a aba da reunião após instalar/atualizar a extensão.
- Feche e reabra o popup.
- Verifique se o popup mostra `Status: ativo nesta aba`.
- Se aparecer `aba não suportada`, você está em uma página onde a extensão não roda.
- Se a chamada já estava aberta antes de instalar a extensão, ela precisa ser recarregada.

## O que funciona

- Google Meet no navegador.
- Teams Web no navegador.
- Zoom Web no navegador.
- Página local de teste.

## O que não funciona sem administrador

- Teams desktop.
- Zoom desktop.
- Discord desktop.
- Criar câmera virtual nova no Windows.


## Novidade da v4

- Controle de **Mover enquadramento** (horizontal e vertical) para reposicionar a imagem depois do corte.


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


## Novidade da v9

- **Largura e altura agora são preservadas exatamente** quando você salva 1280x720, 1920x1080 ou outro valor válido.
- Removida a migração forçada que convertia 1280x720 para 1920x1080.
- Crop, mover, rotação, espelhar, largura e altura agora são enviados para a aba em **tempo real**, sem precisar apertar F5.
- O canvas redimensiona ao vivo; para troca de câmera física, alguns sites ainda podem exigir desligar/ligar a câmera dentro da reunião.
