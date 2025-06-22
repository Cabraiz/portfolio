import { CSSProperties } from "react";

export const navbarStyles = {
  container: {
    backdropFilter: "blur(6px)",
    boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 9999,
    position: "fixed",
    width: "100%",
    top: 0,
    left: 0,
  } as CSSProperties,

  navLink: {
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: 100,
    letterSpacing: 1.3,
    cursor: "pointer",
    userSelect: "none",
    transition: "all 0.25s ease-in-out",
    paddingBottom: "10px",
    position: "relative",
    fontSize: "1.5vw",
  } as CSSProperties,

  navLinkActive: {
    color: "rgba(255, 255, 255, 0.9)",
  } as CSSProperties,

  navLinkHover: {
    color: "rgba(255, 255, 255, 0.9)",
  } as CSSProperties,

  underline: {
    position: "absolute",
    bottom: "-8px",
    height: "3px",
    backgroundColor: "white",
    borderRadius: "3px",
    transition: "all 300ms ease-in-out",
  } as CSSProperties,

  borderGradient: {
    borderStyle: "solid",
    borderImage:
      "linear-gradient(to left, #ffffff00 -20%, #ffffff33 60%, #ffffffbd 80%, #ffffffbd 86%, #ffffff33 92%, #ffffff00 100%) 100% 0 100% 0/0.3vh 0 0.3vh 0 stretch",
  } as CSSProperties,
};
