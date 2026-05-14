from __future__ import annotations

import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
import zipfile
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from typing import Any, Iterable

HOST = "127.0.0.1"
PORT = 9998
APP_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = APP_DIR / "assets"
DOWNLOAD_CHUNK = 1024 * 256


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


def windows_temp_root() -> Path:
    """Use the real operating-system temp directory, e.g. %TEMP% on Windows."""
    try:
        root = Path(tempfile.gettempdir()) / "github-folder-downloader"
        root.mkdir(parents=True, exist_ok=True)
        return root
    except Exception:
        # Defensive fallback only if the OS temp directory is unavailable.
        fallback = APP_DIR / "runtime-temp"
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback


def open_folder(path: Path) -> None:
    """Open the extracted folder after a successful download."""
    try:
        resolved = path.resolve()
        if sys.platform.startswith("win"):
            os.startfile(str(resolved))  # type: ignore[attr-defined]
        elif sys.platform == "darwin":
            subprocess.Popen(["open", str(resolved)])
        else:
            subprocess.Popen(["xdg-open", str(resolved)])
    except Exception as exc:
        # Opening the folder is a convenience. Do not fail the completed download.
        print(f"Nao consegui abrir a pasta automaticamente: {exc}", file=sys.stderr)


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


def download_branch_zip(folder: GithubFolder, cache_dir: Path, token: str | None = None) -> Path:
    quoted_owner = urllib.parse.quote(folder.owner, safe="")
    quoted_repo = urllib.parse.quote(folder.repo, safe="")
    quoted_ref = urllib.parse.quote(folder.branch, safe="")
    url = f"https://api.github.com/repos/{quoted_owner}/{quoted_repo}/zipball/{quoted_ref}"

    zip_name = f"{clean_slug(folder.owner)}-{clean_slug(folder.repo)}-{clean_slug(folder.branch)}.zip"
    zip_path = cache_dir / zip_name

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "local-github-folder-downloader/1.2",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token.strip()}"

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as response, zip_path.open("wb") as fh:
            while True:
                chunk = response.read(DOWNLOAD_CHUNK)
                if not chunk:
                    break
                fh.write(chunk)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:500]
        raise DownloadError(f"Não consegui baixar o ZIP da branch. HTTP {exc.code}. Detalhe: {detail}") from exc
    except urllib.error.URLError as exc:
        raise DownloadError(f"Falha de rede ao baixar o ZIP da branch: {exc.reason}") from exc

    if not zip_path.exists() or zip_path.stat().st_size == 0:
        raise DownloadError("O ZIP baixado veio vazio.")
    return zip_path


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


def safe_extract_selected_folder(zip_path: Path, folder: GithubFolder, output_root: Path) -> DownloadResult:
    stamp = time.strftime("%Y%m%d-%H%M%S")
    folder_name = clean_slug(PurePosixPath(folder.folder_path).name, fallback=folder.repo)
    target = output_root / f"{stamp}-{clean_slug(folder.repo)}-{folder_name}"
    target.mkdir(parents=True, exist_ok=False)

    file_count = 0
    total_bytes = 0

    try:
        with zipfile.ZipFile(zip_path) as archive:
            for info in archive.infolist():
                if info.is_dir():
                    continue

                ok, inner_rel = is_inside_folder(info.filename, folder.folder_path)
                if not ok or inner_rel is None or str(inner_rel) in {"", "."}:
                    continue

                # PurePosixPath -> safe OS path. Reject traversal even if a malicious ZIP entry exists.
                rel_parts = [part for part in inner_rel.parts if part not in {"", "."}]
                if any(part == ".." for part in rel_parts):
                    continue

                destination = target.joinpath(*rel_parts)
                destination.parent.mkdir(parents=True, exist_ok=True)

                with archive.open(info) as src, destination.open("wb") as dst:
                    shutil.copyfileobj(src, dst, length=DOWNLOAD_CHUNK)

                file_count += 1
                total_bytes += info.file_size
    except zipfile.BadZipFile as exc:
        raise DownloadError("O arquivo baixado não é um ZIP válido.") from exc

    if file_count == 0:
        shutil.rmtree(target, ignore_errors=True)
        raise DownloadError(
            "A pasta não foi encontrada dentro da branch baixada. Confira se a URL aponta para uma pasta existente."
        )

    return DownloadResult(
        output_dir=target,
        zip_size=zip_path.stat().st_size,
        file_count=file_count,
        total_bytes=total_bytes,
        folder=folder,
    )


def run_download(raw_url: str, token: str | None = None) -> DownloadResult:
    output_root = windows_temp_root()
    cache_dir = output_root / "_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    folder = parse_github_tree_url(raw_url, token=token)
    zip_path = download_branch_zip(folder, cache_dir=cache_dir, token=token)
    return safe_extract_selected_folder(zip_path, folder=folder, output_root=output_root)


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    data = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(data)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(data)


def read_body(handler: BaseHTTPRequestHandler) -> dict[str, Any]:
    length = int(handler.headers.get("Content-Length", "0") or "0")
    if length <= 0:
        return {}
    raw = handler.rfile.read(length).decode("utf-8", "replace")
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise DownloadError("JSON inválido enviado pelo navegador.") from exc
    if not isinstance(payload, dict):
        raise DownloadError("Payload inválido.")
    return payload


class AppHandler(BaseHTTPRequestHandler):
    server_version = "GithubFolderDownloader/1.2"

    def log_message(self, format: str, *args: Any) -> None:
        # Keep the terminal readable.
        sys.stdout.write("[%s] %s\n" % (time.strftime("%H:%M:%S"), format % args))

    def do_GET(self) -> None:  # noqa: N802 - http.server naming
        clean_path = urllib.parse.urlparse(self.path).path
        if clean_path in {"/", "/index.html"}:
            return self.serve_file(APP_DIR / "index.html")
        if clean_path.startswith("/assets/"):
            relative = clean_path.removeprefix("/assets/").strip("/")
            return self.serve_file(PUBLIC_DIR / relative)
        if clean_path == "/api/health":
            return json_response(self, 200, {"ok": True, "port": PORT, "downloadsTemp": str(windows_temp_root())})
        return json_response(self, 404, {"ok": False, "error": "Rota não encontrada."})

    def do_POST(self) -> None:  # noqa: N802 - http.server naming
        clean_path = urllib.parse.urlparse(self.path).path
        if clean_path != "/api/download":
            return json_response(self, 404, {"ok": False, "error": "Rota não encontrada."})

        started = time.perf_counter()
        try:
            payload = read_body(self)
            raw_url = str(payload.get("githubUrl", ""))
            token = str(payload.get("token", "")).strip() or None
            result = run_download(raw_url, token=token)
            open_folder(result.output_dir)
            elapsed_ms = round((time.perf_counter() - started) * 1000)
            return json_response(
                self,
                200,
                {
                    "ok": True,
                    "outputDir": str(result.output_dir),
                    "fileCount": result.file_count,
                    "totalBytes": result.total_bytes,
                    "zipSize": result.zip_size,
                    "elapsedMs": elapsed_ms,
                    "repo": f"{result.folder.owner}/{result.folder.repo}",
                    "branch": result.folder.branch,
                    "folderPath": result.folder.folder_path,
                },
            )
        except DownloadError as exc:
            return json_response(self, 400, {"ok": False, "error": str(exc)})
        except Exception as exc:  # Defensive: return useful UI error without exposing tracebacks in browser.
            print("Erro inesperado:", repr(exc), file=sys.stderr)
            return json_response(self, 500, {"ok": False, "error": f"Erro inesperado: {exc}"})

    def serve_file(self, path: Path) -> None:
        try:
            resolved = path.resolve()
            base = APP_DIR.resolve()
            if base not in resolved.parents and resolved != base:
                return json_response(self, 403, {"ok": False, "error": "Acesso negado."})
            if not resolved.exists() or not resolved.is_file():
                return json_response(self, 404, {"ok": False, "error": "Arquivo não encontrado."})
            content_type = mimetypes.guess_type(str(resolved))[0] or "application/octet-stream"
            data = resolved.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)
        except BrokenPipeError:
            pass


def open_browser_once() -> None:
    time.sleep(0.7)
    try:
        webbrowser.open(f"http://{HOST}:{PORT}/")
    except Exception:
        pass


def main() -> None:
    os.chdir(APP_DIR)
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    threading.Thread(target=open_browser_once, daemon=True).start()
    print("====================================================")
    print(" GitHub Folder Downloader")
    print("====================================================")
    print(f"Servidor: http://{HOST}:{PORT}/")
    print(f"Destino:  {windows_temp_root()}")
    print("Feche esta janela ou pressione Ctrl+C para parar.")
    print("====================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrando...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
