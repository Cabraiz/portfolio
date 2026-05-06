(() => {
  if (window.__CAMCROP_NO_ADMIN_INSTALLED__) return;
  window.__CAMCROP_NO_ADMIN_INSTALLED__ = true;

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
    configVersion: 9
  };

  let config = { ...DEFAULT_CONFIG };
  const activePipelines = new Set();

  function clampNumber(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, number));
  }

  function normalizeConfig(input) {
    const cfg = { ...DEFAULT_CONFIG, ...(input || {}) };
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
    cfg.configVersion = 9;

    return cfg;
  }

  function cloneConstraints(constraints) {
    if (constraints == null || typeof constraints !== "object") return constraints;
    if (Array.isArray(constraints)) return constraints.map(cloneConstraints);
    return Object.fromEntries(Object.entries(constraints).map(([key, value]) => [key, cloneConstraints(value)]));
  }

  function normalizeVideoConstraints(value) {
    if (value === true || value == null) return {};
    if (typeof value !== "object") return {};
    return value;
  }

  function applyHighQualityInputConstraints(videoConstraints, cfg) {
    // Ask the physical webcam for a high-quality frame. These are "ideal" values,
    // so Chrome/Edge can fall back if the device cannot provide 1080p.
    const idealWidth = Math.max(1280, Math.round(cfg.width || 1920));
    const idealHeight = Math.max(720, Math.round(cfg.height || 1080));
    const idealFps = Math.max(15, Math.min(60, Math.round(cfg.fps || 30)));

    videoConstraints.width = { ideal: idealWidth };
    videoConstraints.height = { ideal: idealHeight };
    videoConstraints.frameRate = { ideal: idealFps, max: idealFps };

    // Some browsers/cameras support this and it prevents hidden browser downscaling.
    videoConstraints.resizeMode = "none";
    return videoConstraints;
  }

  function buildInputConstraints(originalConstraints, cfg, ignoreChosenDevice = false) {
    const original = originalConstraints && typeof originalConstraints === "object" ? originalConstraints : { video: true };
    const constraints = cloneConstraints(original);
    constraints.audio = "audio" in original ? original.audio : false;

    const videoConstraints = applyHighQualityInputConstraints(normalizeVideoConstraints(constraints.video), cfg);
    if (cfg.deviceId && !ignoreChosenDevice) {
      videoConstraints.deviceId = { exact: cfg.deviceId };
    }

    constraints.video = videoConstraints;
    return constraints;
  }

  async function enumerateVideoInputs({ unlock = false } = {}) {
    let tempStream = null;
    try {
      if (unlock && navigator.mediaDevices?.getUserMedia) {
        tempStream = await originalGetUserMedia(buildInputConstraints({ video: true, audio: false }, normalizeConfig(config), true));
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          label: device.label || `Câmera ${index + 1}`
        }));
    } finally {
      if (tempStream) tempStream.getTracks().forEach((track) => track.stop());
    }
  }

  function waitForVideo(video) {
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Timeout ao iniciar webcam")), 10000);
      const done = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          window.clearTimeout(timeout);
          resolve();
        }
      };
      video.addEventListener("loadedmetadata", done, { once: true });
      video.addEventListener("canplay", done, { once: true });
      video.play().then(done).catch((error) => {
        window.clearTimeout(timeout);
        reject(error);
      });
    });
  }

  function mapVisualCropToSource(cfg) {
    let visualLeft = cfg.cropLeft;
    let visualRight = cfg.cropRight;
    const visualTop = cfg.cropTop;
    const visualBottom = cfg.cropBottom;

    // When mirrored, the visible left/right sides are swapped.
    if (cfg.mirror) {
      [visualLeft, visualRight] = [visualRight, visualLeft];
    }

    switch (cfg.rotate) {
      case 90:
        // Canvas positive rotation is visually clockwise here.
        // After 90°: visible top <- source left, right <- source top,
        // bottom <- source right, left <- source bottom.
        return {
          left: visualTop,
          right: visualBottom,
          top: visualRight,
          bottom: visualLeft
        };
      case 180:
        return {
          left: visualRight,
          right: visualLeft,
          top: visualBottom,
          bottom: visualTop
        };
      case 270:
        // After 270°: visible top <- source right, right <- source bottom,
        // bottom <- source left, left <- source top.
        return {
          left: visualBottom,
          right: visualTop,
          top: visualLeft,
          bottom: visualRight
        };
      case 0:
      default:
        return {
          left: visualLeft,
          right: visualRight,
          top: visualTop,
          bottom: visualBottom
        };
    }
  }

  function computeSourceRect(videoWidth, videoHeight, cfg) {
    const orientedCrop = mapVisualCropToSource(cfg);

    const left = Math.round(videoWidth * (orientedCrop.left / 100));
    const right = Math.round(videoWidth * (orientedCrop.right / 100));
    const top = Math.round(videoHeight * (orientedCrop.top / 100));
    const bottom = Math.round(videoHeight * (orientedCrop.bottom / 100));

    const baseSx = Math.min(videoWidth - 2, Math.max(0, left));
    const baseSy = Math.min(videoHeight - 2, Math.max(0, top));
    const sw = Math.max(2, videoWidth - left - right);
    const sh = Math.max(2, videoHeight - top - bottom);

    const maxShiftLeft = baseSx;
    const maxShiftRight = Math.max(0, videoWidth - (baseSx + sw));
    const maxShiftUp = baseSy;
    const maxShiftDown = Math.max(0, videoHeight - (baseSy + sh));

    const shiftX = cfg.moveX < 0
      ? Math.round((cfg.moveX / 100) * maxShiftLeft)
      : Math.round((cfg.moveX / 100) * maxShiftRight);

    const shiftY = cfg.moveY < 0
      ? Math.round((cfg.moveY / 100) * maxShiftUp)
      : Math.round((cfg.moveY / 100) * maxShiftDown);

    const sx = Math.max(0, Math.min(videoWidth - sw, baseSx + shiftX));
    const sy = Math.max(0, Math.min(videoHeight - sh, baseSy + shiftY));

    return { sx, sy, sw, sh };
  }

  function drawFrame(ctx, video, canvas, cfg) {
    const outW = canvas.width;
    const outH = canvas.height;
    const vw = video.videoWidth || outW;
    const vh = video.videoHeight || outH;
    const { sx, sy, sw, sh } = computeSourceRect(vw, vh, cfg);

    ctx.save();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, outW, outH);
    ctx.translate(outW / 2, outH / 2);

    if (cfg.mirror) ctx.scale(-1, 1);

    const radians = (cfg.rotate * Math.PI) / 180;
    ctx.rotate(radians);

    const rotatedPortrait = cfg.rotate === 90 || cfg.rotate === 270;
    const targetW = rotatedPortrait ? outH : outW;
    const targetH = rotatedPortrait ? outW : outH;

    // 0° / 180° keep the current "cover" behavior.
    // 90° / 270° switch to "contain" so the full rotated image stays visible,
    // centered with black side bands when needed.
    const scale = rotatedPortrait
      ? Math.min(targetW / sw, targetH / sh)
      : Math.max(targetW / sw, targetH / sh);
    const dw = sw * scale;
    const dh = sh * scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  function startPipeline(inputStream, cfg) {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.srcObject = inputStream;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(cfg.width);
    canvas.height = Math.round(cfg.height);
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

    let stopped = false;
    let rafId = 0;
    let lastDrawAt = 0;
    let lastWidth = canvas.width;
    let lastHeight = canvas.height;
    let outputVideoTrack = null;

    function applyLiveOutputSize(nextCfg) {
      const nextWidth = Math.round(nextCfg.width);
      const nextHeight = Math.round(nextCfg.height);
      if (nextWidth === lastWidth && nextHeight === lastHeight) return;

      canvas.width = nextWidth;
      canvas.height = nextHeight;
      lastWidth = nextWidth;
      lastHeight = nextHeight;

      if (outputVideoTrack && typeof outputVideoTrack.applyConstraints === "function") {
        outputVideoTrack.applyConstraints({
          width: nextWidth,
          height: nextHeight,
          frameRate: Math.round(nextCfg.fps)
        }).catch(() => {});
      }
    }

    const pipeline = {
      stop() {
        if (stopped) return;
        stopped = true;
        if (rafId) cancelAnimationFrame(rafId);
        inputStream.getTracks().forEach((track) => track.stop());
        activePipelines.delete(pipeline);
      },
      onConfigChanged(nextCfg) {
        applyLiveOutputSize(nextCfg);
      }
    };
    activePipelines.add(pipeline);

    const render = (now = performance.now()) => {
      if (stopped) return;

      const liveCfg = normalizeConfig(config);
      const targetFps = Math.max(5, Math.min(60, Math.round(liveCfg.fps)));
      const frameInterval = 1000 / targetFps;

      if (!lastDrawAt || now - lastDrawAt >= frameInterval) {
        applyLiveOutputSize(liveCfg);
        drawFrame(ctx, video, canvas, liveCfg);
        lastDrawAt = now;
      }

      rafId = requestAnimationFrame(render);
    };

    // Capture at a high ceiling and throttle drawing ourselves. This allows FPS,
    // width and height changes to respond without recreating the Teams camera stream.
    const outputStream = canvas.captureStream(60);
    inputStream.getAudioTracks().forEach((track) => outputStream.addTrack(track));

    outputVideoTrack = outputStream.getVideoTracks()[0];
    if (outputVideoTrack) {
      try {
        outputVideoTrack.contentHint = "detail";
      } catch (_) {}

      if (typeof outputVideoTrack.applyConstraints === "function") {
        outputVideoTrack.applyConstraints({
          width: Math.round(cfg.width),
          height: Math.round(cfg.height),
          frameRate: Math.round(cfg.fps)
        }).catch(() => {});
      }

      const originalStop = outputVideoTrack.stop.bind(outputVideoTrack);
      outputVideoTrack.stop = () => {
        pipeline.stop();
        originalStop();
      };
    }

    return waitForVideo(video).then(() => {
      render();
      return outputStream;
    });
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

  const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);

  async function camcropGetUserMedia(constraints) {
    const hasVideo = constraints && constraints.video;
    const cfg = normalizeConfig(config);

    if (!cfg.enabled || !hasVideo) {
      return originalGetUserMedia(constraints);
    }

    try {
      const inputConstraints = buildInputConstraints(constraints, cfg, false);
      const inputStream = await originalGetUserMedia(inputConstraints);
      return startPipeline(inputStream, cfg);
    } catch (error) {
      // DeviceIds are scoped per origin. If an old/stale selected camera fails,
      // retry with the camera requested by the site instead of breaking Teams/Meet.
      if (cfg.deviceId) {
        const fallbackCfg = { ...cfg, deviceId: "" };
        const fallbackConstraints = buildInputConstraints(constraints, fallbackCfg, true);
        const fallbackStream = await originalGetUserMedia(fallbackConstraints);
        return startPipeline(fallbackStream, fallbackCfg);
      }
      throw error;
    }
  }

  try {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: camcropGetUserMedia,
      configurable: true,
      writable: true
    });
  } catch (_) {
    navigator.mediaDevices.getUserMedia = camcropGetUserMedia;
  }

  if (navigator.getUserMedia) {
    navigator.getUserMedia = (constraints, success, error) => {
      camcropGetUserMedia(constraints).then(success).catch(error);
    };
  }

  window.addEventListener("message", async (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === "CAMCROP_CONFIG") {
      const previousConfig = config;
      config = normalizeConfig(event.data.config);
      activePipelines.forEach((pipeline) => {
        try {
          pipeline.onConfigChanged?.(config, previousConfig);
        } catch (_) {}
      });
      return;
    }

    if (event.data.type === "CAMCROP_PING") {
      window.postMessage({ type: "CAMCROP_PONG", requestId: event.data.requestId, ok: true }, "*");
      return;
    }

    if (event.data.type === "CAMCROP_ENUM_DEVICES") {
      const requestId = event.data.requestId;
      try {
        const devices = await enumerateVideoInputs({ unlock: Boolean(event.data.unlock) });
        window.postMessage({ type: "CAMCROP_ENUM_DEVICES_RESULT", requestId, ok: true, devices }, "*");
      } catch (error) {
        window.postMessage({
          type: "CAMCROP_ENUM_DEVICES_RESULT",
          requestId,
          ok: false,
          error: error?.message || String(error)
        }, "*");
      }
    }
  });

  // expose original enumerate only for diagnostics in this closure
  void originalEnumerateDevices;
  window.postMessage({ type: "CAMCROP_REQUEST_CONFIG" }, "*");

  window.addEventListener("beforeunload", () => {
    activePipelines.forEach((pipeline) => pipeline.stop());
  });
})();
