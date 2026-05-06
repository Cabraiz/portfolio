const DEFAULT_CONFIG = {
  enabled: true,
  deviceId: "",
  rotate: 0,
  mirror: false,
  cropLeft: 0,
  cropRight: 0,
  cropTop: 0,
  cropBottom: 0,
  moveX: 0,
  moveY: 0,
  width: 1920,
  height: 1080,
  fps: 30,
  configVersion: 8
};

const $ = (id) => document.getElementById(id);
const fields = {
  enabled: $("enabled"),
  cameraSelect: $("cameraSelect"),
  rotate: $("rotate"),
  mirror: $("mirror"),
  cropLeft: $("cropLeft"),
  cropRight: $("cropRight"),
  cropTop: $("cropTop"),
  cropBottom: $("cropBottom"),
  moveX: $("moveX"),
  moveY: $("moveY"),
  width: $("width"),
  height: $("height"),
  fps: $("fps")
};

let currentConfig = { ...DEFAULT_CONFIG };
let saveTimer = null;

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function normalizeConfig(input) {
  const cfg = { ...DEFAULT_CONFIG, ...(input || {}) };
  const incomingVersion = Number(input?.configVersion || 0);
  cfg.enabled = Boolean(cfg.enabled);
  cfg.deviceId = typeof cfg.deviceId === "string" ? cfg.deviceId : "";
  cfg.rotate = [0, 90, 180, 270].includes(Number(cfg.rotate)) ? Number(cfg.rotate) : 0;
  cfg.mirror = Boolean(cfg.mirror);
  cfg.cropLeft = clampNumber(cfg.cropLeft, 0, 45);
  cfg.cropRight = clampNumber(cfg.cropRight, 0, 45);
  cfg.cropTop = clampNumber(cfg.cropTop, 0, 45);
  cfg.cropBottom = clampNumber(cfg.cropBottom, 0, 45);
  cfg.moveX = clampNumber(cfg.moveX, -100, 100);
  cfg.moveY = clampNumber(cfg.moveY, -100, 100);
  cfg.width = clampNumber(cfg.width, 320, 3840);
  cfg.height = clampNumber(cfg.height, 240, 2160);
  cfg.fps = clampNumber(cfg.fps, 5, 60);
  cfg.configVersion = 8;

  // Upgrade older saved settings that were 720p by default.
  // The old 1280x720 canvas made the 90° letterboxed image too small
  // and Teams/WebRTC could make it look pixelated for the other person.
  if (incomingVersion < 8 && cfg.width === 1280 && cfg.height === 720) {
    cfg.width = 1920;
    cfg.height = 1080;
  }

  return cfg;
}

function setStatus(text) {
  $("status").textContent = text;
}

function setHookStatus(text) {
  $("hookStatus").textContent = text;
}

function renderRangeValues() {
  $("cropLeftValue").textContent = `${fields.cropLeft.value}%`;
  $("cropRightValue").textContent = `${fields.cropRight.value}%`;
  $("cropTopValue").textContent = `${fields.cropTop.value}%`;
  $("cropBottomValue").textContent = `${fields.cropBottom.value}%`;
  $("moveXValue").textContent = `${Number(fields.moveX.value) > 0 ? "+" : ""}${fields.moveX.value}%`;
  $("moveYValue").textContent = `${Number(fields.moveY.value) > 0 ? "+" : ""}${fields.moveY.value}%`;
}

function renderForm() {
  fields.enabled.checked = currentConfig.enabled;
  fields.cameraSelect.value = currentConfig.deviceId;
  fields.rotate.value = String(currentConfig.rotate);
  fields.mirror.checked = currentConfig.mirror;
  fields.cropLeft.value = String(currentConfig.cropLeft);
  fields.cropRight.value = String(currentConfig.cropRight);
  fields.cropTop.value = String(currentConfig.cropTop);
  fields.cropBottom.value = String(currentConfig.cropBottom);
  fields.moveX.value = String(currentConfig.moveX);
  fields.moveY.value = String(currentConfig.moveY);
  fields.width.value = String(currentConfig.width);
  fields.height.value = String(currentConfig.height);
  fields.fps.value = String(currentConfig.fps);
  renderRangeValues();
}

function readForm() {
  return normalizeConfig({
    enabled: fields.enabled.checked,
    deviceId: fields.cameraSelect.value,
    rotate: Number(fields.rotate.value),
    mirror: fields.mirror.checked,
    cropLeft: Number(fields.cropLeft.value),
    cropRight: Number(fields.cropRight.value),
    cropTop: Number(fields.cropTop.value),
    cropBottom: Number(fields.cropBottom.value),
    moveX: Number(fields.moveX.value),
    moveY: Number(fields.moveY.value),
    width: Number(fields.width.value),
    height: Number(fields.height.value),
    fps: Number(fields.fps.value)
  });
}

function saveConfigDebounced() {
  currentConfig = readForm();
  renderRangeValues();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    chrome.storage.local.set({ camcropConfig: currentConfig }, () => setStatus("Salvo. Reative a câmera na reunião."));
  }, 120);
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs && tabs[0] ? tabs[0] : null;
}

async function sendToActiveTab(message) {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error("Aba ativa não encontrada");
  return chrome.tabs.sendMessage(tab.id, message, { frameId: 0 });
}

function renderCameraOptions(cameras) {
  const previousValue = currentConfig.deviceId;
  fields.cameraSelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Usar câmera escolhida no Teams/Meet";
  fields.cameraSelect.appendChild(defaultOption);

  cameras.forEach((camera, index) => {
    const option = document.createElement("option");
    option.value = camera.deviceId;
    option.textContent = camera.label || `Câmera ${index + 1}`;
    fields.cameraSelect.appendChild(option);
  });

  const stillExists = Array.from(fields.cameraSelect.options).some((option) => option.value === previousValue);
  fields.cameraSelect.value = stillExists ? previousValue : "";
  currentConfig.deviceId = fields.cameraSelect.value;
  chrome.storage.local.set({ camcropConfig: currentConfig });
}

async function checkHook() {
  try {
    const response = await sendToActiveTab({ type: "CAMCROP_POPUP_PING" });
    if (response?.ok) {
      setHookStatus("ativo nesta aba");
      return true;
    }
    setHookStatus("não ativo nesta aba");
    return false;
  } catch (error) {
    setHookStatus("aba não suportada");
    return false;
  }
}

async function loadDevicesFromActivePage({ unlock = false } = {}) {
  setStatus(unlock ? "Pedindo permissão na aba..." : "Listando câmeras da aba...");
  const response = await sendToActiveTab({ type: "CAMCROP_POPUP_ENUM_DEVICES", unlock });

  if (!response?.ok) {
    throw new Error(response?.error || "Não foi possível listar câmeras");
  }

  renderCameraOptions(response.devices || []);
  setStatus(`${(response.devices || []).length} câmera(s) na aba`);
}

async function unlockAndLoadDevices() {
  try {
    const ok = await checkHook();
    if (!ok) {
      setStatus("Abra Teams/Meet/Zoom Web e recarregue a aba");
      return;
    }
    await loadDevicesFromActivePage({ unlock: true });
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Permissão negada/bloqueada");
  }
}

function bindEvents() {
  Object.values(fields).forEach((element) => {
    element.addEventListener("input", saveConfigDebounced);
    element.addEventListener("change", saveConfigDebounced);
  });

  $("unlockCamera").addEventListener("click", unlockAndLoadDevices);

  $("reset").addEventListener("click", () => {
    currentConfig = { ...DEFAULT_CONFIG };
    renderForm();
    chrome.storage.local.set({ camcropConfig: currentConfig }, () => setStatus("Resetado. Reative a câmera."));
  });
}

chrome.storage.local.get(["camcropConfig"], async (result) => {
  currentConfig = normalizeConfig(result.camcropConfig);
  chrome.storage.local.set({ camcropConfig: currentConfig });
  renderForm();
  bindEvents();

  const hookOk = await checkHook();
  if (!hookOk) {
    setStatus("Abra ou recarregue uma reunião web");
    return;
  }

  try {
    await loadDevicesFromActivePage({ unlock: false });
  } catch (_) {
    setStatus("Clique para permitir/listar");
  }
});
