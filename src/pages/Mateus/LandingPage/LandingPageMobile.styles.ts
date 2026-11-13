// Estilos inline fixos do container e das seções da landing mobile.
import type { CSSProperties } from "react";

import { resolveLandingResponsiveSpacing } from "./landingLayout.tokens";

const containerStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  margin: 0,
  padding: 0,
  overflowX: "clip",
  overflowY: "visible",
  position: "relative",
  userSelect: "none",
};

const sectionBackground: CSSProperties = {
  backgroundImage: `
    radial-gradient(circle at top left, rgba(255, 215, 0, 0.12), transparent 60%),
    radial-gradient(circle at bottom right, rgba(255, 215, 0, 0.08), transparent 70%),
    linear-gradient(135deg, #0b0b0b 0%, #1a1a1a 50%, #0b0b0b 100%)
  `,
  backgroundAttachment: "scroll",
  backgroundBlendMode: "screen, overlay, normal",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};

const mobileSpacing = resolveLandingResponsiveSpacing("mobile");

const baseSectionStyle: CSSProperties = {
  ...sectionBackground,
  width: "100%",
  minWidth: 0,
  margin: 0,
  paddingTop: mobileSpacing.sectionPaddingBlockStart,
  paddingRight: mobileSpacing.sectionPaddingInline,
  paddingBottom: mobileSpacing.sectionPaddingBlockEnd,
  paddingLeft: mobileSpacing.sectionPaddingInline,
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  position: "relative",
  overflowX: "clip",
  overflowY: "visible",
  boxSizing: "border-box",
  userSelect: "none",
};

const baseContentContainerStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: "100%",
  minHeight: "100%",
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  flex: "1 1 auto",
  userSelect: "none",
};

const contentMeasurementWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: "100%",
  minHeight: "100%",
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  flex: "1 1 auto",
  userSelect: "none",
};

export {
  containerStyle,
  baseSectionStyle,
  baseContentContainerStyle,
  contentMeasurementWrapperStyle,
};
