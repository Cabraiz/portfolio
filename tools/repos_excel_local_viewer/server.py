#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from xml.etree import ElementTree as ET
import datetime as dt
import json, os, re, sys, tempfile, traceback, urllib.parse, zipfile

ROOT = Path(__file__).resolve().parent
APP = ROOT / "web"
DATA = ROOT / "data"
PORT = 9999

NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/package/2006/relationships",
}

def norm(s):
    s = (s or "").strip().lower()
    tr = str.maketrans("áàãâéêíóôõúç", "aaaaeeiooouc")
    return re.sub(r"\s+", " ", s.translate(tr))

def text(v):
    return "" if v is None else str(v).strip()

def xml(z, path):
    with z.open(path) as f:
        return ET.fromstring(f.read())

def col_idx(ref):
    letters = re.sub(r"[^A-Z]", "", ref.upper())
    n = 0
    for ch in letters:
        n = n * 26 + ord(ch) - 64
    return n

def shared_strings(z):
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    root = xml(z, "xl/sharedStrings.xml")
    out = []
    for si in root.findall("m:si", NS):
        out.append("".join(t.text or "" for t in si.findall(".//m:t", NS)))
    return out

def date_style_ids(z):
    if "xl/styles.xml" not in z.namelist():
        return set()
    builtins = {14,15,16,17,18,19,20,21,22,27,30,36,45,46,47,50,57}
    root = xml(z, "xl/styles.xml")
    custom = set()
    numfmts = root.find("m:numFmts", NS)
    if numfmts is not None:
        for nf in numfmts.findall("m:numFmt", NS):
            code = (nf.attrib.get("formatCode") or "").lower()
            if any(x in code for x in ["yy", "yyyy", "dd", "mmm", "mmmm", "h:", "hh:", "ss"]):
                try:
                    custom.add(int(nf.attrib.get("numFmtId", "0")))
                except ValueError:
                    pass
    ids = builtins | custom
    out = set()
    xfs = root.find("m:cellXfs", NS)
    if xfs is not None:
        for i, xf in enumerate(xfs.findall("m:xf", NS)):
            try:
                if int(xf.attrib.get("numFmtId", "0")) in ids:
                    out.add(i)
            except ValueError:
                pass
    return out

def first_sheet(z):
    wb = xml(z, "xl/workbook.xml")
    rels = xml(z, "xl/_rels/workbook.xml.rels")
    sheet = wb.find("m:sheets/m:sheet", {"m":"http://schemas.openxmlformats.org/spreadsheetml/2006/main"})
    if sheet is None:
        raise ValueError("Nenhuma aba encontrada no XLSX.")
    rid = sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    target = ""
    for rel in rels.findall("r:Relationship", NS):
        if rel.attrib.get("Id") == rid:
            target = rel.attrib.get("Target","")
            break
    if not target:
        raise ValueError("Não consegui localizar a primeira aba.")
    if target.startswith("/"):
        return target[1:]
    if target.startswith("xl/"):
        return target
    if target.startswith("worksheets/"):
        return "xl/" + target
    return "xl/" + target

def excel_date(n):
    try:
        return dt.datetime(1899, 12, 30) + dt.timedelta(days=float(n))
    except Exception:
        return None

def parse_date(v):
    s = text(v)
    if not s:
        return None
    s = s.replace("T", " ").replace("Z", "").strip()
    if re.fullmatch(r"\d+(\.\d+)?", s):
        try:
            f = float(s)
            if 20000 <= f <= 90000:
                return excel_date(f)
        except Exception:
            pass
    for fmt in ("%d/%m/%Y %H:%M:%S","%d/%m/%Y %H:%M","%d/%m/%Y",
                "%Y-%m-%d %H:%M:%S","%Y-%m-%d %H:%M","%Y-%m-%d",
                "%m/%d/%Y %H:%M:%S","%m/%d/%Y %H:%M","%m/%d/%Y"):
        try:
            return dt.datetime.strptime(s[:19], fmt)
        except Exception:
            pass
    try:
        return dt.datetime.fromisoformat(s)
    except Exception:
        return None

def cell_value(c, ss, ds):
    typ = c.attrib.get("t","")
    sid = c.attrib.get("s","")
    if typ == "inlineStr":
        return "".join(t.text or "" for t in c.findall(".//m:t", NS)).strip()
    v = c.find("m:v", NS)
    if v is None or v.text is None:
        return ""
    raw = v.text
    if typ == "s":
        try:
            i = int(raw)
            return ss[i] if 0 <= i < len(ss) else ""
        except Exception:
            return ""
    try:
        if sid != "" and int(sid) in ds:
            d = excel_date(float(raw))
            if d:
                return d.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        pass
    return raw

def project_id(name):
    s = norm(name)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "projeto"

def read_xlsx(path, project, pid, org):
    rows = []
    with zipfile.ZipFile(path, "r") as z:
        ss = shared_strings(z)
        ds = date_style_ids(z)
        root = xml(z, first_sheet(z))
        data = root.find("m:sheetData", NS)
        raw_rows = []
        if data is None:
            return []
        for row in data.findall("m:row", NS):
            rn = int(row.attrib.get("r", "0") or "0")
            vals = {}
            for c in row.findall("m:c", NS):
                ci = col_idx(c.attrib.get("r", ""))
                if ci in (1,2,3):
                    vals[ci] = cell_value(c, ss, ds)
            if vals:
                raw_rows.append((rn, vals))
    if not raw_rows:
        return []
    start = 0
    first = raw_rows[0][1]
    if ("data" in norm(text(first.get(1))) or "pessoa" in norm(text(first.get(2))) or
        "repo" in norm(text(first.get(3))) or "repositorio" in norm(text(first.get(3)))):
        start = 1
    for rn, vals in raw_rows[start:]:
        d = parse_date(vals.get(1, ""))
        repo = text(vals.get(3, ""))
        if not d or not repo:
            continue
        rows.append({
            "organization": org,
            "project": project,
            "projectId": pid,
            "date": d.strftime("%Y-%m-%d"),
            "dateTime": d.strftime("%Y-%m-%d %H:%M:%S"),
            "month": d.strftime("%Y-%m"),
            "year": d.year,
            "person": text(vals.get(2, "")),
            "repo": repo,
            "row": rn,
        })
    rows.sort(key=lambda x: (x["dateTime"], x["project"].lower(), x["repo"].lower()))
    return rows

def send_json(h, status, payload):
    b = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    h.send_response(status)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Content-Length", str(len(b)))
    h.end_headers()
    h.wfile.write(b)

def send_file(h, path):
    if not path.exists() or not path.is_file():
        h.send_error(404); return
    typ = {
        ".html":"text/html; charset=utf-8",
        ".css":"text/css; charset=utf-8",
        ".js":"application/javascript; charset=utf-8",
        ".json":"application/json; charset=utf-8",
    }.get(path.suffix.lower(), "application/octet-stream")
    b = path.read_bytes()
    h.send_response(200)
    h.send_header("Content-Type", typ)
    h.send_header("Content-Length", str(len(b)))
    h.end_headers()
    h.wfile.write(b)

def load_config():
    cfg = DATA / "projects.json"
    if not cfg.exists():
        return {"ok": True, "organization": "", "projects": [], "rows": [], "warnings": ["data/projects.json não encontrado."]}
    raw = json.loads(cfg.read_text(encoding="utf-8"))
    org = text(raw.get("organization",""))
    items = raw.get("projects", [])
    if not isinstance(items, list):
        raise ValueError("'projects' precisa ser um array.")
    projects, rows, warnings = [], [], []
    for i, item in enumerate(items, 1):
        name = text(item.get("name", f"Projeto {i}"))
        file = text(item.get("file", ""))
        pid = text(item.get("id", "")) or project_id(name)
        if not file:
            warnings.append(f"{name}: campo file vazio.")
            continue
        p = (DATA / file).resolve()
        if not str(p).startswith(str(DATA.resolve())):
            warnings.append(f"{name}: caminho bloqueado.")
            continue
        if not p.exists():
            warnings.append(f"{name}: arquivo data/{file} não encontrado.")
            continue
        try:
            r = read_xlsx(p, name, pid, org)
            rows += r
            projects.append({"id": pid, "name": name, "file": file, "rowsCount": len(r)})
        except Exception as e:
            warnings.append(f"{name}: falha ao ler {file}: {e}")
    return {"ok": True, "organization": org, "projects": projects, "rows": rows, "warnings": warnings,
            "months": sorted({r["month"] for r in rows}), "rowsCount": len(rows)}

class Handler(BaseHTTPRequestHandler):
    server_version = "TeamRepoUnique/3.1"
    def log_message(self, fmt, *args):
        sys.stdout.write("[HTTP] " + (fmt % args) + "\n")
    def do_GET(self):
        route = urllib.parse.urlparse(self.path).path
        if route in ("/", "/index.html"):
            return send_file(self, APP/"index.html")
        if route == "/api/config":
            try: return send_json(self, 200, load_config())
            except Exception as e:
                traceback.print_exc(); return send_json(self, 500, {"ok": False, "error": str(e)})
        if route.startswith("/assets/"):
            p = (APP / route.lstrip("/")).resolve()
            if not str(p).startswith(str(APP.resolve())):
                self.send_error(403); return
            return send_file(self, p)
        self.send_error(404)
    def do_POST(self):
        route = urllib.parse.urlparse(self.path).path
        if route != "/api/analyze":
            self.send_error(404); return
        try:
            n = int(self.headers.get("Content-Length", "0") or "0")
            filename = urllib.parse.unquote(self.headers.get("X-Filename", "arquivo.xlsx"))
            org = urllib.parse.unquote(self.headers.get("X-Organization", ""))
            project = urllib.parse.unquote(self.headers.get("X-Project", "") or Path(filename).stem)
            pid = urllib.parse.unquote(self.headers.get("X-Project-Id", "") or project_id(project))
            if n <= 0:
                return send_json(self, 400, {"ok": False, "error": "Arquivo vazio."})
            if not filename.lower().endswith(".xlsx"):
                return send_json(self, 400, {"ok": False, "error": "Envie .xlsx."})
            body = self.rfile.read(n)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
                tmp.write(body)
                tmp_path = Path(tmp.name)
            try:
                rows = read_xlsx(tmp_path, project, pid, org)
            finally:
                tmp_path.unlink(missing_ok=True)
            return send_json(self, 200, {"ok": True, "filename": filename, "project": project, "projectId": pid,
                                         "organization": org, "rows": rows, "months": sorted({r["month"] for r in rows}),
                                         "rowsCount": len(rows)})
        except zipfile.BadZipFile:
            return send_json(self, 400, {"ok": False, "error": "XLSX inválido/corrompido."})
        except Exception as e:
            traceback.print_exc(); return send_json(self, 500, {"ok": False, "error": str(e)})

def main():
    os.chdir(ROOT)
    print("")
    print("============================================================")
    print(" Team Repo Usage Viewer")
    print("============================================================")
    print(f" Servidor: http://localhost:{PORT}")
    print(" Entrada XLSX: A=Data, B=Pessoa, C=Repositorio")
    print(" Suporta múltiplos projetos por upload ou data/projects.json")
    print(" CTRL+C para encerrar.")
    print("")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()

if __name__ == "__main__":
    main()
