import os
from datetime import datetime
from typing import List


# ============================================================
# COLETA ÚNICA PARA 1 ROOT
# - Lê o projeto agent-avaliador-de-cancelamento
# - Gera paths.txt, linhas.txt e tudo(timestamp).txt
# - Salva TUDO direto na pasta onde está este uniao.py
# ============================================================

# Configuração em uniao_config.py; filtros em uniao_filters.py; texto/saídas em uniao_text.py.
from uniao_config import (
    ALLOWED_EXTS,
    DEST_BASE,
    EMIT_SKIPPED_PLACEHOLDERS_IN_TUDO,
    INCLUDE_SKIPPED_IN_LINHAS,
    OUTPUTS_BASE,
    PROJECT_ROOT,
    SOURCE_ROOT,
    _norm_abs,
)
from uniao_filters import (
    _has_blocked_dir_suffix,
    _is_excluded_abs,
    _is_hard_excluded_dir_name,
    _is_hard_excluded_file_name,
    _load_ignore_rules,
    is_ignored,
)
from uniao_text import (
    clean_old_tudo_files,
    count_lines,
    make_header,
    read_text_relaxed,
    write_linhas_txt_single,
    write_paths_txt_single,
)

# Arquivo atual do script
SCRIPT_FILE_ABS = os.path.normcase(os.path.abspath(__file__))


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
