// Crop e desenho do frame (funções puras do pageHook.js).
// Roda antes do pageHook.js no mesmo mundo (MAIN): ordem definida no manifest.json.
(() => {
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

  window.__CAMCROP_NO_ADMIN_CROP__ = { drawFrame };
})();
