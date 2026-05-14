import csv
import io
import json
import re
import sys
import webbrowser
import zipfile
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

HOST = "127.0.0.1"
PORT = 9999

HTML = r"""
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Repos por período</title>
  <style>
    :root {
      --bg: #0d1117;
      --panel: #111827;
      --panel2: #0f172a;
      --border: #243044;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --accent2: #22c55e;
      --danger: #fb7185;
      --shadow: 0 18px 50px rgba(0,0,0,.35);
      --radius: 18px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at top left, rgba(56,189,248,.14), transparent 34rem), var(--bg);
      color: var(--text);
      min-height: 100vh;
    }
    .wrap { max-width: 1180px; margin: 0 auto; padding: 28px 18px 56px; }
    .hero { display: grid; grid-template-columns: 1.4fr .9fr; gap: 18px; align-items: stretch; }
    .card {
      background: linear-gradient(180deg, rgba(17,24,39,.96), rgba(15,23,42,.96));
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 22px;
    }
    h1 { margin: 0 0 10px; font-size: clamp(26px, 4vw, 44px); line-height: 1; letter-spacing: -.04em; }
    .sub { color: var(--muted); margin: 0; line-height: 1.55; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 18px; }
    .metric { background: rgba(15,23,42,.7); border: 1px solid var(--border); border-radius: 14px; padding: 14px; }
    .metric .n { font-size: 24px; font-weight: 750; }
    .metric .l { color: var(--muted); font-size: 13px; margin-top: 4px; }
    label { display: block; color: var(--muted); font-size: 13px; margin: 0 0 7px; }
    input, button, select {
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: #0b1220;
      color: var(--text);
      padding: 11px 12px;
      font: inherit;
      outline: none;
    }
    input:focus, select:focus { border-color: rgba(56,189,248,.75); box-shadow: 0 0 0 3px rgba(56,189,248,.12); }
    input[type=file] { padding: 9px; }
    button { cursor: pointer; background: linear-gradient(135deg, #0284c7, #0ea5e9); border: 0; font-weight: 700; }
    button.secondary { background: #0b1220; border: 1px solid var(--border); color: var(--text); }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .controls { display: grid; grid-template-columns: 1.3fr .8fr .8fr .8fr; gap: 12px; margin-top: 18px; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    .status { margin-top: 12px; color: var(--muted); min-height: 22px; font-size: 14px; }
    .status.ok { color: var(--accent2); }
    .status.err { color: var(--danger); }
    .section { margin-top: 18px; }
    .tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .tab { width: auto; padding: 9px 12px; border-radius: 999px; background: #0b1220; border: 1px solid var(--border); color: var(--muted); }
    .tab.active { color: #001018; background: var(--accent); border-color: var(--accent); }
    .table-wrap { overflow: auto; border: 1px solid var(--border); border-radius: 14px; background: rgba(3,7,18,.25); }
    table { border-collapse: collapse; width: 100%; min-width: 760px; }
    th, td { text-align: left; padding: 11px 12px; border-bottom: 1px solid rgba(36,48,68,.75); vertical-align: top; }
    th { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .06em; background: rgba(15,23,42,.7); position: sticky; top: 0; }
    td { font-size: 14px; }
    tr:hover td { background: rgba(56,189,248,.045); }
    .repo { font-weight: 700; }
    .pill { display: inline-flex; align-items: center; border: 1px solid var(--border); background: #0b1220; border-radius: 999px; padding: 3px 8px; color: var(--muted); font-size: 12px; white-space: nowrap; }
    .small { color: var(--muted); font-size: 12px; line-height: 1.5; }
    .empty { padding: 26px; text-align: center; color: var(--muted); }
    .search-row { display: grid; grid-template-columns: 1fr 220px; gap: 12px; margin-bottom: 12px; }
    @media (max-width: 860px) {
      .hero, .controls, .grid, .search-row { grid-template-columns: 1fr; }
      .actions { grid-template-columns: 1fr; }
      .card { padding: 17px; }
      table { min-width: 680px; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <div class="card">
        <h1>Repos por período</h1>
        <p class="sub">Carregue o Excel gerado com as três primeiras colunas: <b>Data</b>, <b>Pessoa</b>, <b>Repositorio</b>. Depois filtre por ano/mês para ver quais projetos foram usados.</p>
        <div class="controls">
          <div>
            <label>Arquivo .xlsx</label>
            <input id="file" type="file" accept=".xlsx" />
          </div>
          <div>
            <label>De</label>
            <input id="startMonth" type="month" value="2025-02" />
          </div>
          <div>
            <label>Até</label>
            <input id="endMonth" type="month" value="2026-08" />
          </div>
          <div>
            <label>Ordenação</label>
            <select id="sortMode">
              <option value="dateAsc">Histórico crescente</option>
              <option value="dateDesc">Histórico decrescente</option>
              <option value="repoAsc">Repositório A-Z</option>
              <option value="countDesc">Mais usados</option>
            </select>
          </div>
        </div>
        <div class="actions">
          <button id="loadBtn">Carregar Excel</button>
          <button id="exportBtn" class="secondary" disabled>Exportar filtrado CSV</button>
        </div>
        <div id="status" class="status">Aguardando arquivo.</div>
      </div>

      <div class="card">
        <div class="grid">
          <div class="metric"><div id="mRows" class="n">0</div><div class="l">linhas filtradas</div></div>
          <div class="metric"><div id="mRepos" class="n">0</div><div class="l">repos únicos</div></div>
          <div class="metric"><div id="mPeople" class="n">0</div><div class="l">pessoas</div></div>
          <div class="metric"><div id="mMonths" class="n">0</div><div class="l">meses</div></div>
        </div>
        <p class="small" style="margin-top:14px">Tudo roda localmente em <b>localhost:9999</b>. O arquivo não sai da máquina; o Python apenas lê o XLSX e devolve os dados para esta página.</p>
      </div>
    </section>

    <section class="card section">
      <div class="tabs">
        <button class="tab active" data-tab="repos">Repos únicos</button>
        <button class="tab" data-tab="history">Histórico</button>
        <button class="tab" data-tab="people">Por pessoa</button>
      </div>
      <div class="search-row">
        <input id="search" placeholder="Filtrar por repo, pessoa ou tipo..." />
        <select id="pageSize">
          <option value="50">50 linhas</option>
          <option value="100" selected>100 linhas</option>
          <option value="250">250 linhas</option>
          <option value="999999">Todas</option>
        </select>
      </div>
      <div id="output"></div>
    </section>
  </main>

<script>
const $ = (id) => document.getElementById(id);
let rawRows = [];
let filteredRows = [];
let currentTab = 'repos';

function setStatus(msg, kind='') {
  const el = $('status');
  el.textContent = msg;
  el.className = 'status ' + kind;
}

function ymOf(iso) {
  if (!iso || iso.length < 7) return '';
  return iso.slice(0, 7);
}

function fmtDate(iso, fallback) {
  if (fallback) return fallback;
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}${m[4] ? ' ' + m[4] + ':' + m[5] : ''}`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function applyFilter() {
  const start = $('startMonth').value || '0000-01';
  const end = $('endMonth').value || '9999-12';
  const q = ($('search').value || '').trim().toLowerCase();
  const sort = $('sortMode').value;

  filteredRows = rawRows.filter(r => {
    const ym = ymOf(r.date_iso);
    if (!ym || ym < start || ym > end) return false;
    if (!q) return true;
    return [r.repo, r.person, r.type, r.date_label].join(' ').toLowerCase().includes(q);
  });

  if (sort === 'dateAsc') filteredRows.sort((a,b) => (a.date_iso||'').localeCompare(b.date_iso||''));
  if (sort === 'dateDesc') filteredRows.sort((a,b) => (b.date_iso||'').localeCompare(a.date_iso||''));
  if (sort === 'repoAsc') filteredRows.sort((a,b) => (a.repo||'').localeCompare(b.repo||''));

  updateMetrics();
  render();
}

function repoSummary() {
  const map = new Map();
  for (const r of filteredRows) {
    if (!r.repo) continue;
    if (!map.has(r.repo)) map.set(r.repo, { repo: r.repo, count: 0, people: new Set(), first: '', last: '' });
    const x = map.get(r.repo);
    x.count++;
    if (r.person) x.people.add(r.person);
    if (r.date_iso) {
      if (!x.first || r.date_iso < x.first) x.first = r.date_iso;
      if (!x.last || r.date_iso > x.last) x.last = r.date_iso;
    }
  }
  let rows = [...map.values()].map(x => ({...x, peopleList: [...x.people].sort()}));
  if ($('sortMode').value === 'countDesc') rows.sort((a,b) => b.count - a.count || a.repo.localeCompare(b.repo));
  else rows.sort((a,b) => a.first.localeCompare(b.first) || a.repo.localeCompare(b.repo));
  return rows;
}

function peopleSummary() {
  const map = new Map();
  for (const r of filteredRows) {
    if (!r.person) continue;
    if (!map.has(r.person)) map.set(r.person, { person: r.person, count: 0, repos: new Set(), first: '', last: '' });
    const x = map.get(r.person);
    x.count++;
    if (r.repo) x.repos.add(r.repo);
    if (r.date_iso) {
      if (!x.first || r.date_iso < x.first) x.first = r.date_iso;
      if (!x.last || r.date_iso > x.last) x.last = r.date_iso;
    }
  }
  return [...map.values()].map(x => ({...x, repoList: [...x.repos].sort()})).sort((a,b) => a.person.localeCompare(b.person));
}

function updateMetrics() {
  const repos = unique(filteredRows.map(r => r.repo));
  const people = unique(filteredRows.map(r => r.person));
  const months = unique(filteredRows.map(r => ymOf(r.date_iso)).filter(Boolean));
  $('mRows').textContent = filteredRows.length;
  $('mRepos').textContent = repos.length;
  $('mPeople').textContent = people.length;
  $('mMonths').textContent = months.length;
  $('exportBtn').disabled = filteredRows.length === 0;
}

function limitRows(rows) {
  const n = Number($('pageSize').value || 100);
  return rows.slice(0, n);
}

function render() {
  const out = $('output');
  if (!rawRows.length) {
    out.innerHTML = '<div class="empty">Carregue um arquivo XLSX para começar.</div>';
    return;
  }
  if (!filteredRows.length) {
    out.innerHTML = '<div class="empty">Nenhuma linha encontrada no período/filtro.</div>';
    return;
  }
  if (currentTab === 'repos') return renderRepos(out);
  if (currentTab === 'people') return renderPeople(out);
  return renderHistory(out);
}

function renderRepos(out) {
  const rows = limitRows(repoSummary());
  out.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Repositório</th><th>Primeira data</th><th>Última data</th><th>Pessoas</th><th>Ocorrências</th></tr></thead><tbody>` +
    rows.map(r => `<tr><td class="repo">${escapeHtml(r.repo)}</td><td>${escapeHtml(fmtDate(r.first))}</td><td>${escapeHtml(fmtDate(r.last))}</td><td>${escapeHtml(r.peopleList.join('; '))}</td><td><span class="pill">${r.count}</span></td></tr>`).join('') +
    `</tbody></table></div>`;
}

function renderPeople(out) {
  const rows = limitRows(peopleSummary());
  out.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Pessoa</th><th>Repos únicos</th><th>Ocorrências</th><th>Primeira data</th><th>Última data</th><th>Repos</th></tr></thead><tbody>` +
    rows.map(r => `<tr><td class="repo">${escapeHtml(r.person)}</td><td>${r.repoList.length}</td><td><span class="pill">${r.count}</span></td><td>${escapeHtml(fmtDate(r.first))}</td><td>${escapeHtml(fmtDate(r.last))}</td><td>${escapeHtml(r.repoList.join('; '))}</td></tr>`).join('') +
    `</tbody></table></div>`;
}

function renderHistory(out) {
  const rows = limitRows(filteredRows);
  out.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Pessoa</th><th>Repositório</th><th>Tipo</th><th>Origem</th></tr></thead><tbody>` +
    rows.map(r => `<tr><td>${escapeHtml(fmtDate(r.date_iso, r.date_label))}</td><td>${escapeHtml(r.person)}</td><td class="repo">${escapeHtml(r.repo)}</td><td><span class="pill">${escapeHtml(r.type)}</span></td><td>${escapeHtml(r.source)}</td></tr>`).join('') +
    `</tbody></table></div>`;
}

function toCsv(rows) {
  const headers = ['Data','Pessoa','Repositorio','Tipo','Origem'];
  const lines = [headers.join(';')];
  for (const r of rows) {
    const vals = [fmtDate(r.date_iso, r.date_label), r.person, r.repo, r.type, r.source].map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"');
    lines.push(vals.join(';'));
  }
  return '\ufeff' + lines.join('\r\n');
}

$('loadBtn').addEventListener('click', async () => {
  const file = $('file').files[0];
  if (!file) { setStatus('Selecione um arquivo .xlsx primeiro.', 'err'); return; }
  const fd = new FormData();
  fd.append('file', file);
  setStatus('Lendo XLSX...');
  $('loadBtn').disabled = true;
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Falha ao ler arquivo.');
    rawRows = data.rows || [];
    setStatus(`Arquivo carregado: ${rawRows.length} linhas úteis.`, 'ok');
    applyFilter();
  } catch (err) {
    console.error(err);
    setStatus(err.message || String(err), 'err');
  } finally {
    $('loadBtn').disabled = false;
  }
});

$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([toCsv(filteredRows)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'repos-filtrados.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
});

for (const id of ['startMonth','endMonth','sortMode','search','pageSize']) $(id).addEventListener('input', applyFilter);
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentTab = btn.dataset.tab;
  render();
}));
render();
</script>
</body>
</html>
"""

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def col_to_index(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha()).upper()
    if not letters:
        return -1
    num = 0
    for ch in letters:
        num = num * 26 + (ord(ch) - ord("A") + 1)
    return num - 1


def read_xml(zf: zipfile.ZipFile, name: str):
    return ET.fromstring(zf.read(name))


def read_shared_strings(zf: zipfile.ZipFile):
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = read_xml(zf, "xl/sharedStrings.xml")
    values = []
    for si in root.findall("main:si", NS):
        parts = []
        for t in si.findall(".//main:t", NS):
            parts.append(t.text or "")
        values.append("".join(parts))
    return values


def first_sheet_path(zf: zipfile.ZipFile):
    # Geralmente é sheet1.xml; se houver workbook rels, resolve corretamente a primeira aba.
    if "xl/workbook.xml" in zf.namelist() and "xl/_rels/workbook.xml.rels" in zf.namelist():
        workbook = read_xml(zf, "xl/workbook.xml")
        first_sheet = workbook.find("main:sheets/main:sheet", NS)
        if first_sheet is not None:
            rel_id = first_sheet.attrib.get("{%s}id" % NS["rel"])
            rels = read_xml(zf, "xl/_rels/workbook.xml.rels")
            for rel in rels.findall("pkgrel:Relationship", NS):
                if rel.attrib.get("Id") == rel_id:
                    target = rel.attrib.get("Target", "")
                    if target.startswith("/"):
                        target = target.lstrip("/")
                    elif not target.startswith("xl/"):
                        target = "xl/" + target
                    return target.replace("//", "/")
    return "xl/worksheets/sheet1.xml"


def cell_value(cell, shared_strings):
    typ = cell.attrib.get("t", "")
    if typ == "inlineStr":
        texts = [t.text or "" for t in cell.findall(".//main:t", NS)]
        return "".join(texts)

    v = cell.find("main:v", NS)
    if v is None or v.text is None:
        return ""

    raw = v.text
    if typ == "s":
        try:
            return shared_strings[int(raw)]
        except Exception:
            return raw
    if typ == "b":
        return "TRUE" if raw == "1" else "FALSE"
    return raw


def excel_serial_to_datetime(value: str):
    try:
        n = float(str(value).strip().replace(",", "."))
    except Exception:
        return None
    # Datas do Excel no sistema 1900. Base 1899-12-30 preserva comportamento comum do Excel.
    if n < 1 or n > 80000:
        return None
    return datetime(1899, 12, 30) + timedelta(days=n)


def parse_date(value):
    if value is None:
        return "", ""
    s = str(value).strip()
    if not s:
        return "", ""

    dt = excel_serial_to_datetime(s)
    if dt:
        return dt.strftime("%Y-%m-%dT%H:%M:%S"), dt.strftime("%d/%m/%Y %H:%M")

    s2 = s.replace("Z", "").strip()
    s2 = re.sub(r"[.](\d+)$", "", s2)
    formats = [
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(s2[:19] if "%S" in fmt and len(s2) >= 19 else s2, fmt)
            label = dt.strftime("%d/%m/%Y %H:%M") if (dt.hour or dt.minute or dt.second) else dt.strftime("%d/%m/%Y")
            return dt.strftime("%Y-%m-%dT%H:%M:%S"), label
        except Exception:
            pass

    # Tentativa com ISO parcial com timezone offset removido.
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})", s2)
    if m:
        dt = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5)))
        return dt.strftime("%Y-%m-%dT%H:%M:%S"), dt.strftime("%d/%m/%Y %H:%M")

    return "", s


def parse_xlsx_first_three_columns(data: bytes):
    rows_out = []
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        if "[Content_Types].xml" not in zf.namelist():
            raise ValueError("Arquivo não parece ser um .xlsx válido.")
        shared = read_shared_strings(zf)
        sheet_path = first_sheet_path(zf)
        if sheet_path not in zf.namelist():
            raise ValueError("Não encontrei a primeira planilha dentro do XLSX.")
        root = read_xml(zf, sheet_path)
        sheet_data = root.find("main:sheetData", NS)
        if sheet_data is None:
            return []

        raw_rows = []
        for row in sheet_data.findall("main:row", NS):
            vals = ["", "", ""]
            for cell in row.findall("main:c", NS):
                ref = cell.attrib.get("r", "")
                idx = col_to_index(ref)
                if 0 <= idx <= 2:
                    vals[idx] = cell_value(cell, shared)
            if any(str(x).strip() for x in vals):
                raw_rows.append(vals)

    # Remove cabeçalho se as 3 primeiras colunas parecerem Data/Pessoa/Repositorio.
    start_idx = 0
    if raw_rows:
        header = [str(x).strip().lower() for x in raw_rows[0]]
        if len(header) >= 3 and "data" in header[0] and "pessoa" in header[1] and ("repo" in header[2] or "reposit" in header[2]):
            start_idx = 1

    for vals in raw_rows[start_idx:]:
        date_iso, date_label = parse_date(vals[0])
        person = str(vals[1]).strip()
        repo = str(vals[2]).strip()
        if not person and not repo:
            continue
        rows_out.append({
            "date_iso": date_iso,
            "date_label": date_label,
            "person": person,
            "repo": repo,
            "type": "LINHA_EXCEL",
            "source": "colunas A/B/C",
        })
    return rows_out


def parse_multipart_file(body: bytes, content_type: str):
    m = re.search(r"boundary=([^;]+)", content_type or "")
    if not m:
        raise ValueError("Upload inválido: boundary não encontrado.")
    boundary = m.group(1).strip().strip('"').encode("utf-8")
    sep = b"--" + boundary
    for part in body.split(sep):
        if b"filename=" not in part:
            continue
        part = part.strip(b"\r\n")
        if part.endswith(b"--"):
            part = part[:-2]
        head, _, content = part.partition(b"\r\n\r\n")
        if not content:
            continue
        return content.rstrip(b"\r\n")
    raise ValueError("Arquivo não encontrado no upload.")


class Handler(BaseHTTPRequestHandler):
    server_version = "ReposExcelLocal/1.0"

    def log_message(self, fmt, *args):
        sys.stdout.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def send_json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            data = HTML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        path = urlparse(self.path).path
        if path != "/api/upload":
            self.send_json(404, {"ok": False, "error": "endpoint não encontrado"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0:
                raise ValueError("Upload vazio.")
            body = self.rfile.read(length)
            content_type = self.headers.get("Content-Type", "")
            file_data = parse_multipart_file(body, content_type)
            rows = parse_xlsx_first_three_columns(file_data)
            self.send_json(200, {"ok": True, "rows": rows, "count": len(rows)})
        except Exception as exc:
            self.send_json(400, {"ok": False, "error": str(exc)})


def main():
    addr = (HOST, PORT)
    httpd = ThreadingHTTPServer(addr, Handler)
    url = f"http://localhost:{PORT}"
    print("Servidor local iniciado")
    print(f"URL: {url}")
    print("Pressione CTRL+C para parar.")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")


if __name__ == "__main__":
    main()
