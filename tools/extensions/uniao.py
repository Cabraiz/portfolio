import os
import glob
import fnmatch
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List


# ============================================================
# COLETA ÚNICA PARA 1 ROOT
# - Lê o projeto agent-avaliador-de-cancelamento
# - Gera paths.txt, linhas.txt e tudo(timestamp).txt
# - Salva TUDO direto na pasta onde está este uniao.py
# ============================================================

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

# Arquivo atual do script
SCRIPT_FILE_ABS = os.path.normcase(os.path.abspath(__file__))

# Exclui subárvores específicas por caminho absoluto
EXCLUDE_ABS_DIRS = {
    # Exemplo:
    # r"C:\Users\Cabraiz\Documents\GitHub\agent-avaliador-de-cancelamento\alguma_pasta_grande",
}


# ============================================================
# DUMPIGNORE INLINE
# ============================================================
INLINE_DUMPIGNORE_LINES = [
    # ---------- Saída deste script ----------
    "todos/",
    "paths.txt",
    "linhas.txt",
    "mirror_outputs/",

    # ---------- Segredos / ambiente ----------
    ".env",
    ".env.*",
    "*.pem",
    "*.key",
    "*.crt",
    "*.pfx",
    "*.p12",
    "id_rsa",
    "id_rsa.pub",
    "secrets/",
    "secret/",
    "credentials/",
    "credentials.json",
    "service-account*.json",

    # ---------- Node / Frontend / Backend JS ----------
    "node_modules/",
    ".next/",
    ".nuxt/",
    ".svelte-kit/",
    ".angular/",
    ".vite/",
    ".turbo/",
    ".parcel-cache/",
    ".yarn/cache/",
    ".yarn/unplugged/",
    ".yarn/install-state.gz",
    ".yarn/build-state.yml",
    ".pnpm-store/",
    ".pnp.cjs",
    ".pnp.data.json",

    "dist/",
    "build/",
    "out/",
    ".output/",
    "storybook-static/",
    "coverage/",
    ".cache/",

    "/reports/ts-sonar-report.json",

    # lockfiles
    "Pipfile.lock",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "npm-shrinkwrap.json",

    # ---------- Python ----------
    "__pycache__/",
    ".pytest_cache/",
    ".ruff_cache/",
    ".mypy_cache/",
    ".tox/",
    ".nox/",
    ".venv/",
    "venv/",
    ".eggs/",
    "*.egg-info/",
    ".coverage",
    "htmlcov/",
    ".hypothesis/",

    # ---------- Java / JVM ----------
    "target/",
    ".gradle/",
    ".idea/",
    "*.iml",

    # ---------- .NET ----------
    "bin/",
    "obj/",
    ".vs/",
    "*.user",
    "*.suo",

    # ---------- Flutter / Dart ----------
    ".dart_tool/",
    ".flutter-plugins",
    ".flutter-plugins-dependencies",
    ".packages",
    "build/",

    # ---------- Logs / temporários ----------
    "*.log",
    "*.tmp",
    "*.temp",
    "*.swp",
    "*.swo",

    # ---------- Artefatos comuns grandes ----------
    "*.map",
    "*.min.js",
    "*.min.css",

    "*.zip",
    "*.tar",
    "*.gz",
    "*.tgz",
    "*.7z",
    "*.rar",
    "*.iso",
    "*.dmg",

    # ---------- Mídia ----------
    "*.svg",
    "*.png",
    "*.jpg",
    "*.jpeg",
    "*.gif",
    "*.webp",
    "*.bmp",
    "*.tif",
    "*.tiff",
    "*.ico",
    "*.heic",

    "*.mp4",
    "*.mov",
    "*.mkv",
    "*.avi",
    "*.wmv",
    "*.flv",
    "*.webm",
    "*.m4v",

    "*.mp3",
    "*.wav",
    "*.flac",
    "*.aac",
    "*.ogg",
    "*.m4a",
    "*.wma",

    # ---------- Banco local / dumps ----------
    "*.sqlite",
    "*.sqlite3",
    "*.db",
    "*.dump",

    # ---------- OS ----------
    "Thumbs.db",
    ".DS_Store",

    # ---------- Git ----------
    ".git/",

    # ---------- Legacy ----------
    "*.legacy*/",
    "*.legacy*",

    # ---------- Pastas antigas ----------
    "*.old/",
]


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


def safe_name(name: str) -> str:
    bad = '<>:"/\\|?*'
    out = "".join("_" if c in bad else c for c in name).strip()
    return out or "root"


def _has_blocked_name_substring(name: str) -> bool:
    nl = name.lower()
    return any(sub in nl for sub in ALWAYS_EXCLUDE_NAME_SUBSTRINGS)


def _has_blocked_dir_suffix(name: str) -> bool:
    nl = name.lower().rstrip("/\\")
    return any(nl.endswith(suffix.lower()) for suffix in ALWAYS_EXCLUDE_DIR_NAME_SUFFIXES)


def _is_hard_excluded_dir_name(name: str) -> bool:
    nl = name.lower()

    if nl in EXCLUDE_DIRS_NORM:
        return True

    if _has_blocked_name_substring(name):
        return True

    if _has_blocked_dir_suffix(name):
        return True

    return False


def _is_hard_excluded_file_name(name: str) -> bool:
    return _has_blocked_name_substring(name)


def _is_excluded_abs(path_abs: str) -> bool:
    path_n = _norm_abs(path_abs)

    if any(_is_under(path_n, ex) for ex in EXCLUDE_ABS_DIRS_NORM):
        return True

    if any(_is_under(path_n, ex) for ex in RUNTIME_EXCLUDE_DIRS_NORM):
        return True

    return False


# =========================
# Ignore engine
# =========================
@dataclass(frozen=True)
class IgnoreRule:
    pattern: str
    negate: bool
    dir_only: bool
    anchored: bool
    has_slash: bool


def _parse_ignore_line(line: str) -> Optional[IgnoreRule]:
    s = (line or "").strip()

    if not s or s.startswith("#"):
        return None

    negate = False

    if s.startswith("!"):
        negate = True
        s = s[1:].lstrip()

    s = s.replace("\\", "/")

    dir_only = s.endswith("/")
    s = s.rstrip("/")

    anchored = s.startswith("/")

    if anchored:
        s = s.lstrip("/")

    if not s:
        return None

    has_slash = "/" in s

    return IgnoreRule(
        pattern=s,
        negate=negate,
        dir_only=dir_only,
        anchored=anchored,
        has_slash=has_slash,
    )


def _load_ignore_rules() -> List[IgnoreRule]:
    rules: List[IgnoreRule] = []

    for raw in INLINE_DUMPIGNORE_LINES:
        rule = _parse_ignore_line(raw)
        if rule:
            rules.append(rule)

    return rules


def _match_dir_rule(rel_parts: List[str], rule: IgnoreRule) -> bool:
    pat = rule.pattern

    if not pat:
        return False

    if not rule.has_slash:
        pat_l = pat.lower()
        return any(
            seg.lower() == pat_l or fnmatch.fnmatchcase(seg.lower(), pat_l)
            for seg in rel_parts
        )

    pat_parts = [p for p in pat.split("/") if p]

    if not pat_parts:
        return False

    if rule.anchored:
        if len(rel_parts) < len(pat_parts):
            return False

        return [p.lower() for p in rel_parts[:len(pat_parts)]] == [
            p.lower() for p in pat_parts
        ]

    rel_low = [p.lower() for p in rel_parts]
    pat_low = [p.lower() for p in pat_parts]
    length = len(pat_low)

    for i in range(0, len(rel_low) - length + 1):
        if rel_low[i:i + length] == pat_low:
            return True

    return False


def _match_file_rule(rel_parts: List[str], rel_posix: str, rule: IgnoreRule) -> bool:
    pat = rule.pattern

    if not pat:
        return False

    if not rule.has_slash:
        base = rel_parts[-1] if rel_parts else rel_posix
        return fnmatch.fnmatchcase(base.lower(), pat.lower())

    pat_norm = pat.lower()

    if rule.anchored:
        return fnmatch.fnmatchcase(rel_posix.lower(), pat_norm)

    for i in range(len(rel_parts)):
        suffix = "/".join(rel_parts[i:])
        if fnmatch.fnmatchcase(suffix.lower(), pat_norm):
            return True

    return False


def is_ignored(rel_posix: str, is_dir: bool, rules: List[IgnoreRule]) -> bool:
    rel_posix = rel_posix.strip("/")

    if not rel_posix or rel_posix == ".":
        return False

    rel_parts = [p for p in rel_posix.split("/") if p]
    ignored = False

    for rule in rules:
        hit = False

        if rule.dir_only:
            if is_dir:
                hit = _match_dir_rule(rel_parts, rule)
            else:
                parent_parts = rel_parts[:-1]
                if parent_parts:
                    hit = _match_dir_rule(parent_parts, rule)
        else:
            if not is_dir:
                hit = _match_file_rule(rel_parts, rel_posix, rule)

        if hit:
            ignored = not rule.negate

    return ignored


# =========================
# Coleta de arquivos do root
# =========================
def collect_source_files_for_root(root: str) -> List[str]:
    collected: List[str] = []
    root_n = _norm_abs(root)

    if not os.path.isdir(root):
        print(f"[ERRO] SOURCE_ROOT invalido: {root}")
        return collected

    root_name = os.path.basename(os.path.normpath(root))

    if _has_blocked_dir_suffix(root_name):
        print(f"[INFO] SOURCE_ROOT ignorado porque termina com '.old': {root}")
        return collected

    if _is_excluded_abs(root_n):
        return collected

    rules = _load_ignore_rules()

    for dirpath, dirs, files in os.walk(root, topdown=True, followlinks=False):
        dirpath_n = _norm_abs(dirpath)

        if _is_excluded_abs(dirpath_n):
            dirs[:] = []
            continue

        rel_dir = os.path.relpath(dirpath, root).replace("\\", "/")

        if rel_dir == ".":
            rel_dir = ""

        pruned_dirs = []

        for d in dirs:
            if _is_hard_excluded_dir_name(d):
                continue

            rel_cand = f"{rel_dir}/{d}" if rel_dir else d

            if is_ignored(rel_cand, is_dir=True, rules=rules):
                continue

            cand_abs = os.path.join(dirpath, d)

            if _is_excluded_abs(cand_abs):
                continue

            pruned_dirs.append(d)

        dirs[:] = pruned_dirs

        for fn in files:
            full = os.path.join(dirpath, fn)
            full_n = _norm_abs(full)

            # Não inclui o próprio uniao.py no dump.
            if full_n == SCRIPT_FILE_ABS:
                continue

            if _is_hard_excluded_file_name(fn):
                continue

            if ALLOWED_EXTS is not None:
                ext = os.path.splitext(fn)[1].lower()
                if ext not in ALLOWED_EXTS:
                    continue

            rel_file = f"{rel_dir}/{fn}" if rel_dir else fn

            if is_ignored(rel_file, is_dir=False, rules=rules):
                continue

            if _is_excluded_abs(full_n):
                continue

            collected.append(full)

    collected.sort(
        key=lambda p: os.path.relpath(p, root).replace("\\", "/").lower()
    )

    return collected


# =========================
# Texto vs binário
# =========================
def _looks_like_text_bytes(chunk: bytes) -> bool:
    if not chunk:
        return True

    nul_count = chunk.count(b"\x00")
    nul_ratio = nul_count / max(1, len(chunk))

    if nul_ratio > 0.2:
        try:
            chunk.decode("utf-16")
            return True
        except Exception:
            return False

    suspicious = 0

    for b in chunk:
        if b in (9, 10, 13):
            continue

        if b < 32 or b == 127:
            suspicious += 1

    return (suspicious / len(chunk)) <= 0.10


def is_probably_text(path: str) -> bool:
    try:
        with open(path, "rb") as f:
            chunk = f.read(BINARY_CHUNK)

        return _looks_like_text_bytes(chunk)
    except OSError:
        return False


def read_text_relaxed(path: str):
    try:
        if not is_probably_text(path):
            return None, "binario_heuristica"

        with open(path, "rb") as f:
            data = f.read(MAX_BYTES_PER_FILE + 1)

        truncated = len(data) > MAX_BYTES_PER_FILE

        if truncated:
            data = data[:MAX_BYTES_PER_FILE]

        try:
            text = data.decode("utf-8")
            enc = "utf-8"
        except UnicodeDecodeError:
            try:
                text = data.decode("utf-16")
                enc = "utf-16"
            except Exception:
                text = data.decode("latin-1", errors="replace")
                enc = "latin-1_replace"

        if truncated:
            text += "\n\n# [TRUNCADO por limite de tamanho]\n"

        return text, f"ok_{enc}"

    except (OSError, PermissionError) as e:
        return None, f"erro_leitura_{type(e).__name__}"


def count_lines(text: str) -> int:
    if not text:
        return 0

    return len(text.splitlines())


def make_header(root_label: str, rel_path_from_root: str) -> str:
    return f"# === {root_label}/{rel_path_from_root} ===\n"


# =========================
# paths.txt
# =========================
def _tree_insert(tree, rel_path):
    parts = rel_path.replace("\\", "/").split("/")
    node = tree

    for d in parts[:-1]:
        node = node.setdefault(d, {"__files__": []})

    node.setdefault("__files__", []).append(parts[-1])


def _tree_emit(node, prefix=""):
    lines = []

    dirs = sorted([k for k in node.keys() if k != "__files__"])
    files = sorted(node.get("__files__", []))
    items = [(d, True) for d in dirs] + [(f, False) for f in files]

    for i, (name, is_dir) in enumerate(items):
        last = i == len(items) - 1
        connector = "└── " if last else "├── "

        lines.append(prefix + connector + (name + "/" if is_dir else name))

        if is_dir:
            new_prefix = prefix + ("    " if last else "│   ")
            lines.extend(_tree_emit(node[name], new_prefix))

    return lines


def build_pruned_tree_lines(root_label, rel_paths):
    if not rel_paths:
        return [
            root_label + "/",
            "└── (nenhum arquivo foi encontrado)",
        ]

    tree = {"__files__": []}

    for rp in rel_paths:
        _tree_insert(tree, rp)

    top = [root_label + "/"]
    top.extend(_tree_emit(tree))

    return top


def write_paths_txt_single(root_label: str, rel_paths: list, out_path: str):
    lines = build_pruned_tree_lines(root_label, rel_paths)

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"[paths] {out_path}")


# =========================
# linhas.txt
# =========================
def write_linhas_txt_single(stats: list, ts: str, out_path: str, root_label: str):
    ranked = sorted(stats, key=lambda s: (-s["lines"], s["rel"].lower()))

    total_files = len(ranked)
    total_lines = sum(s["lines"] for s in ranked)

    by_ext = {}

    for s in ranked:
        by_ext.setdefault(s["ext"], {"files": 0, "lines": 0})
        by_ext[s["ext"]]["files"] += 1
        by_ext[s["ext"]]["lines"] += s["lines"]

    idx_w = max(2, len(str(total_files)))
    lines_w = max(5, len(str(max((s["lines"] for s in ranked), default=0))))
    status_w = 4

    out = []

    out.append("# Ranking de linhas por arquivo (ordem decrescente)")
    out.append(f"# Root: {root_label}")
    out.append(f"# Gerado em: {ts}")
    out.append("")
    out.append(f"# Total de arquivos: {total_files}")
    out.append(f"# Total de linhas:   {total_lines}")
    out.append("")
    out.append("# Totais por extensao:")

    for ext in sorted(by_ext.keys()):
        out.append(
            f"# - {ext or '(sem_ext)'}: "
            f"{by_ext[ext]['files']} arquivos | "
            f"{by_ext[ext]['lines']} linhas"
        )

    out.append("")
    out.append("# idx  linhas  stat  arquivo")
    out.append("# ---- ------  ----  ------")

    for i, s in enumerate(ranked, start=1):
        out.append(
            f"{str(i).rjust(idx_w)}  "
            f"{str(s['lines']).rjust(lines_w)}  "
            f"{s['status'][:status_w].ljust(status_w)}  "
            f"{s['rel']}"
        )

    out.append("")

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(out))

    print(f"[linhas] {out_path}")


# =========================
# limpeza dos tudo(...)
# =========================
def clean_old_tudo_files(todos_dir, pattern="tudo(*).txt"):
    to_delete = glob.glob(os.path.join(todos_dir, pattern))

    for path in to_delete:
        try:
            os.remove(path)
            print(f"[limpeza] Removido: {path}")
        except OSError as e:
            print(f"[erro] Falha ao remover {path}: {e}")


def process_root(root_dir: str):
    root_label = os.path.basename(os.path.normpath(root_dir)) or "root"

    # Saída direta na pasta do uniao.py
    out_dir = OUTPUTS_BASE
    todos_dir = os.path.join(out_dir, "todos")

    os.makedirs(todos_dir, exist_ok=True)

    clean_old_tudo_files(todos_dir)

    ts = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")

    tudo_path = os.path.join(todos_dir, f"tudo({ts}).txt")
    paths_path = os.path.join(out_dir, "paths.txt")
    linhas_path = os.path.join(out_dir, "linhas.txt")

    print("")
    print("============================================================")
    print(f"[ROOT] {root_label}")
    print(f"[SRC ] {root_dir}")
    print(f"[OUT ] {out_dir}")
    print("============================================================")

    files = collect_source_files_for_root(root_dir)

    rel_paths: List[str] = []
    stats: List[dict] = []

    skipped_total = 0
    ok_total = 0

    with open(tudo_path, "w", encoding="utf-8") as out:
        out.write("# === [SOURCES] ===\n\n")

        if not files:
            out.write(f"# (nenhum arquivo encontrado em {root_dir})\n")
        else:
            for full in files:
                rel = os.path.relpath(full, root_dir).replace("\\", "/")
                ext = os.path.splitext(full)[1].lower() or ""

                try:
                    size = os.path.getsize(full)
                except OSError:
                    size = -1

                text, note = read_text_relaxed(full)

                if text is None:
                    skipped_total += 1

                    if INCLUDE_SKIPPED_IN_LINHAS:
                        stats.append({
                            "rel": rel,
                            "full": full,
                            "ext": ext,
                            "lines": 0,
                            "status": "SKIP",
                            "note": note,
                            "size": size,
                        })

                    if EMIT_SKIPPED_PLACEHOLDERS_IN_TUDO:
                        out.write(make_header(root_label, rel))
                        out.write(
                            f"# [SKIPPED: {note}] "
                            f"ext={ext or '(sem_ext)'} size={size}\n\n"
                        )

                    continue

                ok_total += 1
                lc = count_lines(text)

                stats.append({
                    "rel": rel,
                    "full": full,
                    "ext": ext,
                    "lines": lc,
                    "status": "OK",
                    "note": note,
                    "size": size,
                })

                rel_paths.append(rel)

                out.write(make_header(root_label, rel))
                out.write(text)
                out.write("\n\n")

    print(f"[tudo] {tudo_path}")
    print(f"[info] OK={ok_total} | SKIP={skipped_total}")

    write_paths_txt_single(root_label, rel_paths, paths_path)

    if not INCLUDE_SKIPPED_IN_LINHAS:
        stats_for_linhas = [s for s in stats if s.get("status") == "OK"]
    else:
        stats_for_linhas = stats

    write_linhas_txt_single(stats_for_linhas, ts, linhas_path, root_label)


def main():
    if not os.path.isdir(PROJECT_ROOT):
        print(f"[ERRO] PROJECT_ROOT nao existe ou nao e pasta: {PROJECT_ROOT}")
        return

    if not os.path.isdir(SOURCE_ROOT):
        print(f"[ERRO] SOURCE_ROOT nao existe ou nao e pasta: {SOURCE_ROOT}")
        return

    os.makedirs(OUTPUTS_BASE, exist_ok=True)

    print(f"[info] PROJECT_ROOT = {PROJECT_ROOT}")
    print(f"[info] SOURCE_ROOT  = {SOURCE_ROOT}")
    print(f"[info] SCRIPT_DIR   = {DEST_BASE}")
    print(f"[info] OUTPUTS_BASE = {OUTPUTS_BASE}")
    print("[info] Modo: projeto inteiro, sem selecao de subpasta.")
    print("[info] Saida direta na pasta do uniao.py.")

    process_root(SOURCE_ROOT)

    print("")
    print("[OK] Finalizado.")
    print("")
    print("Arquivos gerados:")
    print(os.path.join(OUTPUTS_BASE, "paths.txt"))
    print(os.path.join(OUTPUTS_BASE, "linhas.txt"))
    print(os.path.join(OUTPUTS_BASE, "todos"))


if __name__ == "__main__":
    main()
