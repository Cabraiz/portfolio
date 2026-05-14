# GitHub Folder Downloader

Aplicação local em Python para baixar **somente uma pasta** de um repositório GitHub, usando uma URL no formato:

```txt
https://github.com/owner/repository/tree/branch/caminho/da/pasta
```

Ela baixa temporariamente o ZIP da branch, extrai apenas a pasta informada e salva no temp real do sistema operacional. No Windows, isso normalmente fica em:

```txt
%TEMP%\github-folder-downloader
```

Não precisa digitar o nome do usuário do Windows. O app usa `tempfile.gettempdir()`, que aponta para o temp real do usuário atual.

## Como rodar

1. Extraia o ZIP deste projeto.
2. Dê duplo clique em `run.cmd`.
3. O navegador abre somente o localhost:

```txt
http://127.0.0.1:9998
```

## O que o botão faz

O botão **Baixar pasta** não navega para o GitHub. Ele chama a API local `POST /api/download`; quem conversa com o GitHub é o servidor Python local.

Quando o download e a extração terminam com sucesso, o app abre automaticamente a pasta final no Explorer.

## Dependências

Nenhuma dependência externa de Python. O projeto usa apenas biblioteca padrão.

A interface usa Google Fonts no navegador. Sem internet, ela usa fontes do sistema.

## Repositórios privados

Para repositório privado ou limite de API, há um campo opcional de token na interface. O token não é salvo em arquivo; ele é usado somente na requisição local atual.

## Observações

- A URL precisa apontar para `/tree/<branch>/<pasta>`.
- O app não copia o repositório inteiro para o destino final.
- O cache temporário fica em `%TEMP%\github-folder-downloader\_cache`.
- A porta fixa é `9998`.
