// src/pages/Mateus/Home/Elevator/HomeElevatorStandalonePage.tsx

import { useCallback, useEffect, useMemo, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import {
  getHomeElevatorExternalHomeUrl,
  isHomeElevatorStandaloneHost,
} from "../../../../App/appHostRouting";
import HomeElevatorGame from "../components/mobile/game/elevator/HomeElevatorGame";

function getBrowserDocument(): Document | null {
  if (typeof globalThis.document === "undefined") {
    return null;
  }

  return globalThis.document;
}

function getBrowserWindow(): Window | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  return globalThis.window;
}

export default function HomeElevatorStandalonePage() {
  const navigate = useNavigate();
  const isStandaloneHost = isHomeElevatorStandaloneHost();

  useEffect(() => {
    const browserDocument = getBrowserDocument();

    if (!browserDocument) {
      return undefined;
    }

    const html = browserDocument.documentElement;
    const { body } = browserDocument;

    const previousHtmlOverflow = html.style.overflow;
    const previousHtmlBackground = html.style.background;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyBackground = body.style.background;
    const previousBodyTouchAction = body.style.touchAction;

    html.style.overflow = "hidden";
    html.style.background = "#05070b";
    body.style.overflow = "hidden";
    body.style.background = "#05070b";
    body.style.touchAction = "none";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      html.style.background = previousHtmlBackground;
      body.style.overflow = previousBodyOverflow;
      body.style.background = previousBodyBackground;
      body.style.touchAction = previousBodyTouchAction;
    };
  }, []);

  const handleClose = useCallback(() => {
    if (isStandaloneHost) {
      const browserWindow = getBrowserWindow();

      if (browserWindow) {
        browserWindow.location.assign(getHomeElevatorExternalHomeUrl());
      }

      return;
    }

    navigate("/home", { replace: true });
  }, [isStandaloneHost, navigate]);

  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100dvh",
      minHeight: "100dvh",
      overflow: "hidden",
      background: "#05070b",
      touchAction: "none",
      overscrollBehavior: "none",
      zIndex: 0,
    };
  }, []);

  return (
    <main
      data-home-elevator-standalone="true"
      aria-label="Cabraiz Elevator"
      style={rootStyle}
    >
      <HomeElevatorGame onClose={handleClose} />
    </main>
  );
}
