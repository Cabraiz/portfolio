# Leitura de texto, cabeçalhos, árvore do paths.txt, linhas.txt e limpeza do uniao.py.
import os
import glob

from uniao_config import BINARY_CHUNK, MAX_BYTES_PER_FILE


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

