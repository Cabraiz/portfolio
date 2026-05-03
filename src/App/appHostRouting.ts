// src/App/appHostRouting.ts

export const HOME_DRIVE_STANDALONE_HOSTNAME = "drive.cabraiz.com";
export const HOME_ELEVATOR_STANDALONE_HOSTNAME = "elevator.cabraiz.com";
export const HOME_PRIMARY_HOSTNAME = "cabraiz.com";
/**
 * Compatibilidade com o patch anterior do Drive.
 */
export const HOME_DRIVE_PRIMARY_HOSTNAME = HOME_PRIMARY_HOSTNAME;

export const HOME_DRIVE_ROUTE_PATH = "/drive";
export const HOME_ELEVATOR_ROUTE_PATH = "/elevator";
export const HOME_LANDING_PATH = "/home";
/**
 * Compatibilidade com o patch anterior do Drive.
 */
export const HOME_DRIVE_HOME_PATH = HOME_LANDING_PATH;

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

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

export function normalizeHomeGamePathname(
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

/**
 * Compatibilidade com o patch anterior do Drive.
 */
export const normalizeHomeDrivePathname = normalizeHomeGamePathname;

export function isHomeDriveStandaloneHostname(
  hostname: string | null | undefined,
): boolean {
  return normalizeHostname(hostname) === HOME_DRIVE_STANDALONE_HOSTNAME;
}

export function isHomeElevatorStandaloneHostname(
  hostname: string | null | undefined,
): boolean {
  return normalizeHostname(hostname) === HOME_ELEVATOR_STANDALONE_HOSTNAME;
}

export function isHomePrimaryHostname(
  hostname: string | null | undefined,
): boolean {
  return normalizeHostname(hostname) === HOME_PRIMARY_HOSTNAME;
}

/**
 * Compatibilidade com o patch anterior do Drive.
 */
export const isHomeDrivePrimaryHostname = isHomePrimaryHostname;

export function isHomeGameLocalDebugHostname(
  hostname: string | null | undefined,
): boolean {
  return LOCALHOST_HOSTNAMES.has(normalizeHostname(hostname));
}

/**
 * Compatibilidade com o patch anterior do Drive.
 */
export const isHomeDriveLocalDebugHostname = isHomeGameLocalDebugHostname;

export function isHomeDriveStandaloneHost(): boolean {
  const location = getBrowserLocation();

  return isHomeDriveStandaloneHostname(location?.hostname);
}

export function isHomeElevatorStandaloneHost(): boolean {
  const location = getBrowserLocation();

  return isHomeElevatorStandaloneHostname(location?.hostname);
}

export function isHomeGameStandaloneHost(): boolean {
  return isHomeDriveStandaloneHost() || isHomeElevatorStandaloneHost();
}

export function isHomeDriveRoutePath(
  pathname: string | null | undefined,
): boolean {
  return normalizeHomeGamePathname(pathname) === HOME_DRIVE_ROUTE_PATH;
}

export function isHomeElevatorRoutePath(
  pathname: string | null | undefined,
): boolean {
  return normalizeHomeGamePathname(pathname) === HOME_ELEVATOR_ROUTE_PATH;
}

export function isHomeGameRoutePath(
  pathname: string | null | undefined,
): boolean {
  const normalizedPathname = normalizeHomeGamePathname(pathname);

  return (
    normalizedPathname === HOME_DRIVE_ROUTE_PATH ||
    normalizedPathname === HOME_ELEVATOR_ROUTE_PATH
  );
}

export function isHomeDriveStandaloneRequest(): boolean {
  const location = getBrowserLocation();

  if (!location) {
    return false;
  }

  return (
    isHomeDriveStandaloneHostname(location.hostname) ||
    isHomeDriveRoutePath(location.pathname)
  );
}

export function isHomeElevatorStandaloneRequest(): boolean {
  const location = getBrowserLocation();

  if (!location) {
    return false;
  }

  return (
    isHomeElevatorStandaloneHostname(location.hostname) ||
    isHomeElevatorRoutePath(location.pathname)
  );
}

export function isHomeGameStandaloneRequest(): boolean {
  return isHomeDriveStandaloneRequest() || isHomeElevatorStandaloneRequest();
}

export function getHomeDriveLandingRedirectPath(): string {
  return isHomeDriveStandaloneHost()
    ? HOME_DRIVE_ROUTE_PATH
    : HOME_LANDING_PATH;
}

export function getHomeElevatorLandingRedirectPath(): string {
  return isHomeElevatorStandaloneHost()
    ? HOME_ELEVATOR_ROUTE_PATH
    : HOME_LANDING_PATH;
}

export function getHomeGameLandingRedirectPath(): string {
  if (isHomeDriveStandaloneHost()) {
    return HOME_DRIVE_ROUTE_PATH;
  }

  if (isHomeElevatorStandaloneHost()) {
    return HOME_ELEVATOR_ROUTE_PATH;
  }

  return HOME_LANDING_PATH;
}

export function getHomeDriveExternalHomeUrl(): string {
  return `https://${HOME_PRIMARY_HOSTNAME}${HOME_LANDING_PATH}`;
}

export function getHomeElevatorExternalHomeUrl(): string {
  return `https://${HOME_PRIMARY_HOSTNAME}${HOME_LANDING_PATH}`;
}
