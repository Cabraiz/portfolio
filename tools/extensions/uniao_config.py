# Configuração do uniao.py: edite aqui o PROJECT_ROOT, limites e filtros.
import os


# === ROOT DO PROJETO QUE SERÁ LIDO ===
PROJECT_ROOT = r"C:\Users\Cabraiz\Documents\GitHub\agent-avaliador-de-cancelamento"

# Sem seleção de subpasta.
# Sempre começa na raiz do projeto acima.
SOURCE_ROOT = PROJECT_ROOT

# Pasta onde está este uniao.py.
# A saída será gerada diretamente aqui.
DEST_BASE = os.path.dirname(os.path.abspath(__file__))

# Saída final:
# uniao_qwen\paths.txt
# uniao_qwen\linhas.txt
# uniao_qwen\todos\tudo(...).txt
OUTPUTS_BASE = DEST_BASE

# None = aceita qualquer extensão textual não ignorada.
# Exemplo para limitar depois:
# ALLOWED_EXTS = {".py", ".ts", ".tsx", ".js", ".json", ".md", ".yml", ".yaml"}
ALLOWED_EXTS = None

# Limites / segurança
MAX_BYTES_PER_FILE = 512 * 1024  # 512 KB por arquivo no tudo.txt
BINARY_CHUNK = 4096              # bytes usados para heurística texto/binário

# Flags
EMIT_SKIPPED_PLACEHOLDERS_IN_TUDO = False
INCLUDE_SKIPPED_IN_LINHAS = False

# Hard-block por substring no nome de arquivos e pastas
ALWAYS_EXCLUDE_NAME_SUBSTRINGS = {
    ".legacy",
}

# Hard-block por sufixo SOMENTE no nome de pastas
ALWAYS_EXCLUDE_DIR_NAME_SUFFIXES = {
    ".old",
}

# Ignora ambientes, caches, builds e pastas comuns
EXCLUDE_DIRS = {
    "__pycache__",
    ".venv",
    "venv",
    ".git",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",

    "node_modules",
    "dist",
    "build",
    "out",
    ".next",
    ".turbo",
    "coverage",
    ".cache",

    ".gradle",
    "target",
    "bin",
    "obj",
    ".dart_tool",

    # pasta onde ficam os tudo(...)
    "todos",

    # versões antigas de saída, caso existam
    "mirror_outputs",
}

EXCLUDE_DIRS_NORM = {d.lower() for d in EXCLUDE_DIRS}

# Exclui subárvores específicas por caminho absoluto
EXCLUDE_ABS_DIRS = {
    # Exemplo:
    # r"C:\Users\Cabraiz\Documents\GitHub\agent-avaliador-de-cancelamento\alguma_pasta_grande",
}


def _norm_abs(p: str) -> str:
    return os.path.normcase(os.path.abspath(os.path.normpath(p)))


def _is_under(path_abs: str, parent_abs: str) -> bool:
    try:
        return os.path.commonpath([path_abs, parent_abs]) == parent_abs
    except ValueError:
        return False


EXCLUDE_ABS_DIRS_NORM = {_norm_abs(p) for p in EXCLUDE_ABS_DIRS}
DEST_BASE_NORM = _norm_abs(DEST_BASE)
SOURCE_ROOT_NORM = _norm_abs(SOURCE_ROOT)


# Se o uniao.py estiver dentro do projeto lido, exclui a pasta do próprio utilitário.
# Isso evita jogar uniao.py, paths.txt, linhas.txt e todos/ dentro do dump.
RUNTIME_EXCLUDE_DIRS_NORM = set()

if DEST_BASE_NORM != SOURCE_ROOT_NORM and _is_under(DEST_BASE_NORM, SOURCE_ROOT_NORM):
    RUNTIME_EXCLUDE_DIRS_NORM.add(DEST_BASE_NORM)
