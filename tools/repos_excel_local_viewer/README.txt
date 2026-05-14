Repos Excel Local Viewer
========================

Objetivo
--------
Rodar um servidor local na porta 9999 para analisar um arquivo .xlsx com as 3 primeiras colunas:

A: Data
B: Pessoa
C: Repositorio

Ele permite escolher uma range de ano/mes, por exemplo 2025-02 ate 2026-08, e visualizar:
- Repositorios unicos usados no periodo
- Historico cronologico
- Resumo por pessoa
- Exportacao CSV filtrada

Como rodar
----------
1. Extraia o ZIP.
2. Dê duplo clique em run.cmd.
3. Abra, se nao abrir sozinho:
   http://localhost:9999
4. Selecione seu arquivo .xlsx.
5. Escolha o periodo por ano/mes.

Dependencias
------------
Nao precisa instalar Flask, pandas, openpyxl ou npm.
Usa somente Python padrao.

Requisitos
----------
Python 3 instalado no Windows.

Observacoes
-----------
- O arquivo nao sai da maquina. Tudo roda localmente.
- O leitor XLSX considera a primeira aba do arquivo.
- Se a primeira linha tiver Data/Pessoa/Repositorio, ela e tratada como cabecalho e ignorada.
- Datas aceitas:
  13/05/2026 18:16
  13/05/2026
  2026-05-13T18:16:00Z
  numero serial do Excel
