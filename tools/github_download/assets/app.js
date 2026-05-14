const form = document.querySelector('#downloadForm');
const button = document.querySelector('#downloadButton');
const statusText = document.querySelector('#statusText');
const fileCount = document.querySelector('#fileCount');
const destination = document.querySelector('#destination');
const resultBox = document.querySelector('#resultBox');
const errorBox = document.querySelector('#errorBox');

const resultRepo = document.querySelector('#resultRepo');
const resultBranch = document.querySelector('#resultBranch');
const resultFolder = document.querySelector('#resultFolder');
const resultPath = document.querySelector('#resultPath');
const resultSize = document.querySelector('#resultSize');

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const setLoading = (loading) => {
  button.disabled = loading;
  button.classList.toggle('is-loading', loading);
  button.querySelector('.button-text').textContent = loading ? 'Baixando...' : 'Baixar pasta';
};

const showError = (message) => {
  errorBox.hidden = false;
  errorBox.textContent = message;
  resultBox.hidden = true;
  statusText.textContent = 'Erro';
};

const clearMessages = () => {
  errorBox.hidden = true;
  errorBox.textContent = '';
};

async function loadHealth() {
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    const data = await response.json();
    if (data.downloadsTemp) destination.textContent = data.downloadsTemp;
  } catch (_) {
    // The form still works; this is only informational.
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessages();
  setLoading(true);
  statusText.textContent = 'Conectando ao GitHub';
  fileCount.textContent = '—';

  const githubUrl = document.querySelector('#githubUrl').value.trim();
  if (!githubUrl) {
    setLoading(false);
    showError('Cole a URL de uma pasta do GitHub.');
    return;
  }
  const token = document.querySelector('#token').value.trim();

  try {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubUrl, token }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Falha ao baixar a pasta.');

    statusText.textContent = 'Concluído';
    fileCount.textContent = String(data.fileCount ?? '—');
    destination.textContent = data.outputDir;

    resultRepo.textContent = data.repo;
    resultBranch.textContent = data.branch;
    resultFolder.textContent = data.folderPath;
    resultPath.textContent = data.outputDir;
    resultSize.textContent = formatBytes(data.totalBytes);
    resultBox.hidden = false;
  } catch (error) {
    showError(error.message || String(error));
  } finally {
    setLoading(false);
  }
});

loadHealth();
