Team Repo Usage Viewer

Objetivo:
Saber quais repositórios o time usa dentro de uma organização que tem mais de um projeto.

Entrada esperada em cada XLSX:
A = Data
B = Pessoa
C = Repositorio

Uso rápido:
1. Extraia o ZIP.
2. Execute run.cmd.
3. Abra http://localhost:9999.
4. Selecione vários .xlsx, um por projeto.

No seu Windows:
O run.cmd tenta primeiro:
py -3 server.py

Modo array/config:
1. Coloque os .xlsx dentro da pasta data/.
2. Edite data/projects.json.
3. Clique em "Carregar data/projects.json" na tela.

Resultado:
Repositorio | Projetos | Primeira data | Última data | Anos | Meses ativos

Regra de unique:
Se o mesmo repositório aparece 100 vezes, ele vira 1 linha.
Se aparece em dois projetos, continua 1 linha, com os dois projetos na coluna Projetos.
