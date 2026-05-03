// src/App/appHostRouting.ts

export const HOME_DRIVE_STANDALONE_HOSTNAME = "drive.cabraiz.com";
export const HOME_DRIVE_PRIMARY_HOSTNAME = "cabraiz.com";
export const HOME_DRIVE_ROUTE_PATH = "/drive";
export const HOME_DRIVE_HOME_PATH = "/home";

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

export function normalizeHomeDrivePathname(
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

export function isHomeDriveStandaloneHostname(
  hostname: string | null | undefined,
): boolean {
  return normalizeHostname(hostname) === HOME_DRIVE_STANDALONE_HOSTNAME;
}

export function isHomeDrivePrimaryHostname(
  hostname: string | null | undefined,
): boolean {
  return normalizeHostname(hostname) === HOME_DRIVE_PRIMARY_HOSTNAME;
}

export function isHomeDriveLocalDebugHostname(
  hostname: string | null | undefined,
): boolean {
  return LOCALHOST_HOSTNAMES.has(normalizeHostname(hostname));
}

export function isHomeDriveStandaloneHost(): boolean {
  const location = getBrowserLocation();

  return isHomeDriveStandaloneHostname(location?.hostname);
}

export function isHomeDriveRoutePath(
  pathname: string | null | undefined,
): boolean {
  return normalizeHomeDrivePathname(pathname) === HOME_DRIVE_ROUTE_PATH;
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

export function getHomeDriveLandingRedirectPath(): string {
  return isHomeDriveStandaloneHost()
    ? HOME_DRIVE_ROUTE_PATH
    : HOME_DRIVE_HOME_PATH;
}

export function getHomeDriveExternalHomeUrl(): string {
  return `https://${HOME_DRIVE_PRIMARY_HOSTNAME}${HOME_DRIVE_HOME_PATH}`;
}
