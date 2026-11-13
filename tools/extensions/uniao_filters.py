# Filtros de pastas/arquivos e motor de ignore do uniao.py.
import fnmatch
from dataclasses import dataclass
from typing import Optional, List

from uniao_config import (
    ALWAYS_EXCLUDE_DIR_NAME_SUFFIXES,
    ALWAYS_EXCLUDE_NAME_SUBSTRINGS,
    EXCLUDE_ABS_DIRS_NORM,
    EXCLUDE_DIRS_NORM,
    RUNTIME_EXCLUDE_DIRS_NORM,
    _is_under,
    _norm_abs,
)
from uniao_dumpignore import INLINE_DUMPIGNORE_LINES


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
