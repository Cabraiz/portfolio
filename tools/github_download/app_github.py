# Tipos e chamadas da API do GitHub usados pelo app.py.
from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any


class DownloadError(Exception):
    """Expected application error returned to the UI."""


@dataclass(frozen=True)
class GithubFolder:
    owner: str
    repo: str
    branch: str
    folder_path: str
    original_url: str


@dataclass(frozen=True)
class DownloadResult:
    output_dir: Path
    zip_size: int
    file_count: int
    total_bytes: int
    folder: GithubFolder


def clean_slug(value: str, fallback: str = "download") -> str:
    value = urllib.parse.unquote(value).strip().replace("\\", "/")
    value = re.sub(r"[^\w.\-]+", "-", value, flags=re.UNICODE).strip("-._")
    return value[:80] or fallback


def request_json(url: str, token: str | None = None) -> Any:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "local-github-folder-downloader/1.2",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token.strip()}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            return json.loads(response.read().decode(charset))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:500]
        raise DownloadError(f"GitHub respondeu HTTP {exc.code}. Detalhe: {detail}") from exc
    except urllib.error.URLError as exc:
        raise DownloadError(f"Falha de rede ao falar com o GitHub: {exc.reason}") from exc


def list_branches(owner: str, repo: str, token: str | None = None) -> list[str]:
    branches: list[str] = []
    quoted_owner = urllib.parse.quote(owner, safe="")
    quoted_repo = urllib.parse.quote(repo, safe="")
    for page in range(1, 11):
        url = f"https://api.github.com/repos/{quoted_owner}/{quoted_repo}/branches?per_page=100&page={page}"
        payload = request_json(url, token=token)
        if not isinstance(payload, list):
            break
        if not payload:
            break
        for item in payload:
            name = item.get("name") if isinstance(item, dict) else None
            if isinstance(name, str) and name:
                branches.append(name)
        if len(payload) < 100:
            break
    return branches


def parse_github_tree_url(raw_url: str, token: str | None = None) -> GithubFolder:
    raw_url = (raw_url or "").strip()
    if not raw_url:
        raise DownloadError("Cole uma URL de pasta do GitHub.")

    parsed = urllib.parse.urlparse(raw_url)
    host = (parsed.netloc or "").lower()
    if host not in {"github.com", "www.github.com"}:
        raise DownloadError("A URL precisa ser do github.com e apontar para /tree/<branch>/<pasta>.")

    parts = [urllib.parse.unquote(part) for part in parsed.path.split("/") if part]
    if len(parts) < 5 or parts[2] != "tree":
        raise DownloadError("Use uma URL no formato: https://github.com/owner/repo/tree/branch/caminho/da/pasta")

    owner = parts[0]
    repo = parts[1].removesuffix(".git")
    tree_parts = parts[3:]

    branches = list_branches(owner, repo, token=token)
    matched_branch: str | None = None
    matched_len = 0

    # Branches can include slashes. Match the longest branch prefix against the URL path.
    for branch in sorted(branches, key=lambda name: len(name.split("/")), reverse=True):
        branch_parts = branch.split("/")
        if tree_parts[: len(branch_parts)] == branch_parts:
            matched_branch = branch
            matched_len = len(branch_parts)
            break

    if matched_branch is None:
        # Graceful fallback for public repos when branch listing is blocked/rate-limited.
        matched_branch = tree_parts[0]
        matched_len = 1

    folder_parts = tree_parts[matched_len:]
    if not folder_parts:
        raise DownloadError("A URL aponta para a raiz da branch. Informe uma pasta dentro da branch, não o repositório inteiro.")

    folder_path = "/".join(folder_parts).strip("/")
    return GithubFolder(owner=owner, repo=repo, branch=matched_branch, folder_path=folder_path, original_url=raw_url)


def is_inside_folder(member_path: str, wanted_folder: str) -> tuple[bool, PurePosixPath | None]:
    parts = member_path.split("/")
    if len(parts) < 2:
        return False, None
    relative_from_repo = "/".join(parts[1:]).strip("/")
    if not relative_from_repo:
        return False, None

    rel = PurePosixPath(relative_from_repo)
    wanted = PurePosixPath(wanted_folder.strip("/"))

    try:
        rel.relative_to(wanted)
    except ValueError:
        return False, None

    inside = rel.relative_to(wanted)
    if str(inside) in {"", "."}:
        return True, PurePosixPath("")
    return True, inside
