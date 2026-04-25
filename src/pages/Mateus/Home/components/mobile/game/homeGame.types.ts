import type {
  AnchorHTMLAttributes,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

export type HomeGameOrbit = Readonly<{
  x?: number;
  y?: number;
  scale?: number;
  delayMs?: number;
  durationMs?: number;
}>;

export type ResolvedHomeGameOrbit = Readonly<{
  x: number;
  y: number;
  scale: number;
  delayMs: number;
  durationMs: number;
}>;

export type HomeGameCollectible = Readonly<{
  id?: string;
  label: string;
  ariaLabel?: string;
  icon?: ReactNode;
  href?: string;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
  rel?: AnchorHTMLAttributes<HTMLAnchorElement>["rel"];
  orbit?: HomeGameOrbit;
}>;

export type ResolvedHomeGameCollectible = Readonly<{
  id: string;
  label: string;
  ariaLabel?: string;
  icon: ReactNode;
  href?: string;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
  rel?: AnchorHTMLAttributes<HTMLAnchorElement>["rel"];
  orbit: ResolvedHomeGameOrbit;
}>;

export type HomeGameCollectHandlerEvent =
  ReactPointerEvent<HTMLButtonElement | HTMLAnchorElement>;

export type HomeGameCollectHandler = (
  item: ResolvedHomeGameCollectible,
  event: HomeGameCollectHandlerEvent,
) => void;

export type HomeGameRipple = Readonly<{
  id: string;
  x: number;
  y: number;
  size: number;
}>;

export type HomeGamePhase =
  | "idle"
  | "intro"
  | "playing"
  | "completed"
  | "exiting";
