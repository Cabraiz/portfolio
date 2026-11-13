// src/App/appHostRouting.ts
// O jogo de carro saiu do cabraiz.com e virou o repositório privado drive.cabraiz.com.
// Aqui fica só o elevador, o único jogo que ainda mora no site.

const HOME_ELEVATOR_STANDALONE_HOSTNAME = "elevator.cabraiz.com";
const HOME_PRIMARY_HOSTNAME = "cabraiz.com";

export const HOME_ELEVATOR_ROUTE_PATH = "/elevator";
const HOME_LANDING_PATH = "/home";

function getBrowserLocation(): Location | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }

  return globalThis.window.location;
}

function normalizeHostname(hostname: string | null | undefined): string {
  return (hostname ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
}

function normalizeHomeGamePathname(
  pathname: string | null | undefined,
): string {
  const trimmed = (pathname ?? "").trim();

  if (!trimmed) {
    return "/";
  }

  const withoutQuery = trimmed.split("?")[0] ?? "";
  const withoutHash = withoutQuery.split("#")[0] ?? "";
  const withLeadingSlash = withoutHash.startsWith("/")
    ? withoutHash
    : `/${withoutHash}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");

  if (collapsed !== "/" && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }

  return collapsed;
}

function isHomeElevatorStandaloneHostname(
  hostname: string | null | undefined,
): boolean {
  return normalizeHostname(hostname) === HOME_ELEVATOR_STANDALONE_HOSTNAME;
}

export function isHomeElevatorStandaloneHost(): boolean {
  const location = getBrowserLocation();

  return isHomeElevatorStandaloneHostname(location?.hostname);
}

export function isHomeGameStandaloneHost(): boolean {
  return isHomeElevatorStandaloneHost();
}

export function isHomeGameRoutePath(
  pathname: string | null | undefined,
): boolean {
  return normalizeHomeGamePathname(pathname) === HOME_ELEVATOR_ROUTE_PATH;
}

export function getHomeGameLandingRedirectPath(): string {
  return isHomeElevatorStandaloneHost()
    ? HOME_ELEVATOR_ROUTE_PATH
    : HOME_LANDING_PATH;
}

export function getHomeElevatorExternalHomeUrl(): string {
  return `https://${HOME_PRIMARY_HOSTNAME}${HOME_LANDING_PATH}`;
}
