// Acesso ao navegador e ajustes de rolagem do app no celular

import { useEffect, useState } from "react";

import { getLenisScrollSettings } from "../features/scroll/getLenisScrollSettings";
import type {
  LenisScrollSettings,
  ScrollHardwareInfo,
  ScrollViewport,
} from "../features/scroll/lenisScrollProfiles";

/** Se alguma parte da seção do Início está visível na tela. */
function useHomeSectionOnScreen(activeSectionId: string): boolean {
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    let observer: IntersectionObserver | null = null;
    let frameId = 0;
    let attempts = 0;

    const attach = () => {
      const home = document.getElementById("home");
      if (!home) {
        // A seção monta depois do primeiro quadro (rota carregada sob demanda).
        if (attempts++ < 120) frameId = requestAnimationFrame(attach);
        return;
      }
      observer = new IntersectionObserver(
        ([entry]) => setOnScreen(Boolean(entry?.isIntersecting)),
        // Encostar na borda da tela não conta como visível.
        { threshold: 0, rootMargin: "-1px 0px -1px 0px" }
      );
      observer.observe(home);
    };
    attach();

    return () => {
      cancelAnimationFrame(frameId);
      observer?.disconnect();
    };
  }, [activeSectionId]);

  return onScreen;
}

function getBrowserWindow(): Window | null {
  if (globalThis.window === undefined) {
    return null;
  }

  return globalThis.window;
}

function getBrowserNavigator(): Navigator | null {
  if (globalThis.navigator === undefined) {
    return null;
  }

  return globalThis.navigator;
}

function getBrowserDocument(): Document | null {
  if (globalThis.document === undefined) {
    return null;
  }

  return globalThis.document;
}

function getViewportInfo(): ScrollViewport {
  const browserWindow = getBrowserWindow();

  if (!browserWindow) {
    return {
      width: 390,
      height: 844,
    };
  }

  return {
    width: browserWindow.innerWidth,
    height: browserWindow.innerHeight,
  };
}

function getHardwareInfo(): ScrollHardwareInfo {
  const browserNavigator = getBrowserNavigator();

  if (!browserNavigator) {
    return {};
  }

  const nav = browserNavigator as Navigator & { deviceMemory?: number };

  return {
    deviceMemoryGb: nav.deviceMemory ?? null,
    hardwareConcurrency: nav.hardwareConcurrency ?? null,
  };
}

function getPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function buildSmoothSettings(): LenisScrollSettings {
  return getLenisScrollSettings({
    viewport: getViewportInfo(),
    hardware: getHardwareInfo(),
    prefersReducedMotion: getPrefersReducedMotion(),
    platform: "mobile",
  });
}

export {
  buildSmoothSettings,
  getBrowserDocument,
  getBrowserWindow,
  getPrefersReducedMotion,
  useHomeSectionOnScreen,
};
