#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations
import datetime as dt
import json, os, re, sys, tempfile, traceback, urllib.parse, zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent
APP_DIR = ROOT / "web"
PORT = 9999
NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

def xml_from_zip(zf: zipfile.ZipFile, path: str) -> ET.Element:
    with zf.open(path) as f:
        return ET.fromstring(f.read())

def norm_header(s: str) -> str:
    s = str(s or "").strip().lower()
    for a, b in {"á":"a","à":"a","ã":"a","â":"a","é":"e","ê":"e","í":"i","ó":"o","ô":"o","õ":"o","ú":"u","ç":"c"}.items():
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s)

def col_index(ref: str) -> int:
    letters = re.sub(r"[^A-Z]", "", str(ref).upper())
    n = 0
    for ch in letters:
        n = n * 26 + ord(ch) - ord("A") + 1
    return n

def safe(v) -> str:
    return "" if v is None else str(v).strip()

def read_shared_strings(zf: zipfile.ZipFile) -> List[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = xml_from_zip(zf, "xl/sharedStrings.xml")
    out = []
    for si in root.findall("main:si", NS):
        out.append("".join((t.text or "") for t in si.findall(".//main:t", NS)))
    return out

def read_date_style_ids(zf: zipfile.ZipFile) -> set[int]:
    builtins = {14,15,16,17,18,19,20,21,22,27,30,36,45,46,47,50,57}
    if "xl/styles.xml" not in zf.namelist():
        return set()
    root = xml_from_zip(zf, "xl/styles.xml")
    custom = set()
    numfmts = root.find("main:numFmts", NS)
    if numfmts is not None:
        for n in numfmts.findall("main:numFmt", NS):
            try: fmt_id = int(n.attrib.get("numFmtId", "0"))
            except ValueError: continue
            code = (n.attrib.get("formatCode", "") or "").lower()
            if any(tok in code for tok in ["yy", "yyyy", "dd", "mmm", "mmmm", "h:", "hh:", "ss"]):
                custom.add(fmt_id)
    date_ids = builtins | custom
    styles = set()
    cellxfs = root.find("main:cellXfs", NS)
    if cellxfs is not None:
        for i, xf in enumerate(cellxfs.findall("main:xf", NS)):
            try: fmt_id = int(xf.attrib.get("numFmtId", "0"))
            except ValueError: fmt_id = 0
            if fmt_id in date_ids:
                styles.add(i)
    return styles

def first_sheet_path(zf: zipfile.ZipFile) -> str:
    wb = xml_from_zip(zf, "xl/workbook.xml")
    rels = xml_from_zip(zf, "xl/_rels/workbook.xml.rels")
    sheet = wb.find("main:sheets/main:sheet", NS)
    if sheet is None:
        raise ValueError("Nenhuma aba encontrada no XLSX.")
    rid = sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    target = ""
    for rel in rels.findall("pkgrel:Relationship", NS):
        if rel.attrib.get("Id") == rid:
            target = rel.attrib.get("Target", "")
            break
    if not target:
        raise ValueError("Não consegui localizar a primeira aba.")
    if target.startswith("/"): return target.lstrip("/")
    if target.startswith("worksheets/"): return "xl/" + target
    if target.startswith("xl/"): return target
    return "xl/" + target

def excel_serial_to_datetime(value: float) -> Optional[dt.datetime]:
    try:
        return dt.datetime(1899, 12, 30) + dt.timedelta(days=float(value))
    except Exception:
        return None

def parse_date(value) -> Optional[dt.datetime]:
    s = safe(value)
    if not s: return None
    clean = s.strip().replace("Z", "").replace("T", " ")
    if re.fullmatch(r"\d+(\.\d+)?", clean):
        try:
            num = float(clean)
            if 20000 <= num <= 90000:
                return excel_serial_to_datetime(num)
        except Exception:
            pass
    for fmt in ["%d/%m/%Y %H:%M:%S","%d/%m/%Y %H:%M","%d/%m/%Y","%Y-%m-%d %H:%M:%S","%Y-%m-%d %H:%M","%Y-%m-%d","%m/%d/%Y %H:%M:%S","%m/%d/%Y %H:%M","%m/%d/%Y"]:
        try:
            return dt.datetime.strptime(clean[:19], fmt)
        except Exception:
            pass
    try:
        return dt.datetime.fromisoformat(clean)
    except Exception:
        return None

def cell_value(cell: ET.Element, shared: List[str], date_styles: set[int]):
    ctype = cell.attrib.get("t", "")
    style = cell.attrib.get("s", "")
    if ctype == "inlineStr":
        return "".join((t.text or "") for t in cell.findall(".//main:t", NS)).strip()
    v = cell.find("main:v", NS)
    if v is None or v.text is None: return ""
    raw = v.text
    if ctype == "s":
        try:
            idx = int(raw)
            return shared[idx] if 0 <= idx < len(shared) else ""
        except Exception:
            return ""
    if ctype == "b": return "TRUE" if raw == "1" else "FALSE"
    try:
        if style != "" and int(style) in date_styles:
            d = excel_serial_to_datetime(float(raw))
            if d: return d.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        pass
    return raw

def read_xlsx(path: Path) -> List[dict]:
    raw_rows = []
    with zipfile.ZipFile(path, "r") as zf:
        shared = read_shared_strings(zf)
        date_styles = read_date_style_ids(zf)
        sheet_path = first_sheet_path(zf)
        root = xml_from_zip(zf, sheet_path)
        sheet_data = root.find("main:sheetData", NS)
        if sheet_data is None: return []
        for row in sheet_data.findall("main:row", NS):
            row_num = int(row.attrib.get("r", "0") or "0")
            cells: Dict[int, object] = {}
            for c in row.findall("main:c", NS):
                col = col_index(c.attrib.get("r", ""))
                if col in (1,2,3):
                    cells[col] = cell_value(c, shared, date_styles)
            if cells:
                raw_rows.append((row_num, cells))
    if not raw_rows: return []
    start = 0
    first = raw_rows[0][1]
    if "data" in norm_header(first.get(1,"")) or "pessoa" in norm_header(first.get(2,"")) or norm_header(first.get(3,"")) in {"repositorio","repository","repo"}:
        start = 1
    rows = []
    for row_num, cells in raw_rows[start:]:
        d = parse_date(cells.get(1,""))
        person = safe(cells.get(2,""))
        repo = safe(cells.get(3,""))
        if not d or not repo:
            continue
        rows.append({
            "date": d.strftime("%Y-%m-%d"),
            "dateTime": d.strftime("%Y-%m-%d %H:%M:%S"),
            "month": d.strftime("%Y-%m"),
            "year": d.year,
            "person": person,
            "repo": repo,
            "row": row_num,
        })
    rows.sort(key=lambda r: (r["dateTime"], r["repo"].lower()))
    return rows

def json_response(h: BaseHTTPRequestHandler, status: int, payload: dict):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    h.send_response(status)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(data)))
    h.end_headers()
    h.wfile.write(data)

def static_response(h: BaseHTTPRequestHandler, path: Path):
    if not path.exists() or not path.is_file():
        h.send_error(404); return
    ctype = {".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"application/javascript; charset=utf-8"}.get(path.suffix.lower(), "application/octet-stream")
    data = path.read_bytes()
    h.send_response(200); h.send_header("Content-Type", ctype); h.send_header("Content-Length", str(len(data))); h.end_headers(); h.wfile.write(data)

class Handler(BaseHTTPRequestHandler):
    server_version = "ReposTimelineLocal/2.0"
    def log_message(self, fmt, *args):
        sys.stdout.write("[HTTP] " + (fmt % args) + "\n")
    def do_GET(self):
        route = urllib.parse.urlparse(self.path).path
        if route in ("/", "/index.html"):
            return static_response(self, APP_DIR / "index.html")
        if route.startswith("/assets/"):
            safe = (APP_DIR / route.lstrip("/")).resolve()
            if not str(safe).startswith(str(APP_DIR.resolve())):
                self.send_error(403); return
            return static_response(self, safe)
        self.send_error(404)
    def do_POST(self):
        if urllib.parse.urlparse(self.path).path != "/api/analyze":
            self.send_error(404); return
        try:
            length = int(self.headers.get("Content-Length", "0") or "0")
            filename = urllib.parse.unquote(self.headers.get("X-Filename", "arquivo.xlsx") or "arquivo.xlsx")
            if length <= 0: return json_response(self, 400, {"ok": False, "error": "Arquivo vazio."})
            if not filename.lower().endswith(".xlsx"):
                return json_response(self, 400, {"ok": False, "error": "Envie um arquivo .xlsx."})
            body = self.rfile.read(length)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
                tmp.write(body); tmp_path = Path(tmp.name)
            try:
                rows = read_xlsx(tmp_path)
            finally:
                try: tmp_path.unlink(missing_ok=True)
                except Exception: pass
            months = sorted(set(r["month"] for r in rows))
            repos = sorted(set(r["repo"] for r in rows), key=lambda x: x.lower())
            return json_response(self, 200, {"ok": True, "filename": filename, "rows": rows, "months": months, "reposCount": len(repos), "rowsCount": len(rows), "minMonth": months[0] if months else "", "maxMonth": months[-1] if months else ""})
        except zipfile.BadZipFile:
            return json_response(self, 400, {"ok": False, "error": "XLSX inválido ou corrompido."})
        except Exception as exc:
            traceback.print_exc()
            return json_response(self, 500, {"ok": False, "error": str(exc)})

def main():
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print("\n============================================================")
    print(" Repos Excel Timeline Viewer")
    print("============================================================")
    print(f" Servidor: http://localhost:{PORT}")
    print(" Colunas esperadas: A=Data, B=Pessoa, C=Repositorio")
    print(" Pressione CTRL+C para encerrar.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrando servidor...")

if __name__ == "__main__":
    main()
