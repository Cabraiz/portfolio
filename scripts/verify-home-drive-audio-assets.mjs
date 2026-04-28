// scripts/verify-home-drive-audio-assets.mjs

import { existsSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const MIN_AUDIO_FILE_SIZE_BYTES = 1024;

const REQUIRED_AUDIO_ASSETS = Object.freeze([
  "public/audio/home-drive/engine/engine-idle-loop.mp3",
]);

const ALLOWED_AUDIO_EXTENSIONS = new Set([".mp3", ".mpeg", ".wav", ".ogg", ".m4a"]);

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return "unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;

  return `${mb.toFixed(2)} MB`;
}

function validateAudioAsset(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath);
  const extension = extname(relativePath).toLowerCase();

  if (!existsSync(absolutePath)) {
    return {
      ok: false,
      path: relativePath,
      message: `Missing audio asset: ${relativePath}`,
    };
  }

  const stat = statSync(absolutePath);

  if (!stat.isFile()) {
    return {
      ok: false,
      path: relativePath,
      message: `Audio asset path is not a file: ${relativePath}`,
    };
  }

  if (!ALLOWED_AUDIO_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      path: relativePath,
      message: `Unsupported audio extension "${extension}" for ${relativePath}`,
    };
  }

  if (stat.size < MIN_AUDIO_FILE_SIZE_BYTES) {
    return {
      ok: false,
      path: relativePath,
      message: `Audio asset is suspiciously small: ${relativePath} (${formatBytes(
        stat.size,
      )})`,
    };
  }

  return {
    ok: true,
    path: relativePath,
    message: `OK: ${relativePath} (${formatBytes(stat.size)})`,
  };
}

function main() {
  const results = REQUIRED_AUDIO_ASSETS.map(validateAudioAsset);
  const failedResults = results.filter((result) => !result.ok);

  for (const result of results) {
    if (result.ok) {
      console.info(`[audio-assets] ${result.message}`);
      continue;
    }

    console.error(`[audio-assets] ${result.message}`);
  }

  if (failedResults.length > 0) {
    console.error(
      `[audio-assets] Failed validation for ${failedResults.length} audio asset(s).`,
    );
    process.exit(1);
  }

  console.info("[audio-assets] All HomeDrive audio assets are valid.");
}

main();
