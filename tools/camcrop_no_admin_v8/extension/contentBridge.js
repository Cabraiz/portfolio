(() => {
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

  let currentConfig = { ...DEFAULT_CONFIG };
  const pending = new Map();

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

  function postConfig() {
    window.postMessage({ type: "CAMCROP_CONFIG", config: currentConfig }, "*");
  }

  function requestFromPage(type, payload = {}, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const timeout = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error("A página não respondeu ao CamCrop. Recarregue a aba."));
      }, timeoutMs);

      pending.set(requestId, { resolve, reject, timeout });
      window.postMessage({ type, requestId, ...payload }, "*");
    });
  }

  chrome.storage.local.get(["camcropConfig"], (result) => {
    currentConfig = normalizeConfig(result.camcropConfig);
    postConfig();
    setTimeout(postConfig, 200);
    setTimeout(postConfig, 1000);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.camcropConfig) return;
    currentConfig = normalizeConfig(changes.camcropConfig.newValue);
    postConfig();
  });

  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === "CAMCROP_REQUEST_CONFIG") {
      postConfig();
      return;
    }

    if (event.data.type === "CAMCROP_PONG" || event.data.type === "CAMCROP_ENUM_DEVICES_RESULT") {
      const request = pending.get(event.data.requestId);
      if (!request) return;
      clearTimeout(request.timeout);
      pending.delete(event.data.requestId);
      request.resolve(event.data);
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) return false;

    if (message.type === "CAMCROP_POPUP_PING") {
      requestFromPage("CAMCROP_PING", {}, 2500)
        .then((result) => sendResponse(result))
        .catch((error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (message.type === "CAMCROP_POPUP_ENUM_DEVICES") {
      requestFromPage("CAMCROP_ENUM_DEVICES", { unlock: Boolean(message.unlock) }, 10000)
        .then((result) => sendResponse(result))
        .catch((error) => sendResponse({ ok: false, error: error.message, devices: [] }));
      return true;
    }

    return false;
  });
})();
