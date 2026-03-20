import gsapLib from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type TickerCallback = (time: number) => void;
type ScrollTriggerVars = Parameters<typeof ScrollTrigger.create>[0];
type ScrollTriggerInstance = ReturnType<typeof ScrollTrigger.create>;

let runtimeInitialized = false;

function hasBrowserWindow(
  value: typeof globalThis,
): value is typeof globalThis & { window: Window } {
  return "window" in value && typeof value.window !== "undefined";
}

function getBrowserWindow(): Window | undefined {
  return hasBrowserWindow(globalThis) ? globalThis.window : undefined;
}

function registerGsapRuntime(): void {
  if (runtimeInitialized) {
    return;
  }

  gsapLib.registerPlugin(ScrollTrigger);
  runtimeInitialized = true;
}

function ensureRuntimeRegistered(): void {
  registerGsapRuntime();
}

export function ensureGsapRuntime(): Readonly<{
  gsap: typeof gsapLib;
  ScrollTrigger: typeof ScrollTrigger;
}> {
  ensureRuntimeRegistered();

  return {
    gsap: gsapLib,
    ScrollTrigger,
  };
}

export function createScrollTrigger(
  vars: ScrollTriggerVars,
): ScrollTriggerInstance {
  ensureRuntimeRegistered();
  return ScrollTrigger.create(vars);
}

export function updateScrollRuntime(): void {
  ensureRuntimeRegistered();

  if (!getBrowserWindow()) {
    return;
  }

  ScrollTrigger.update();
}

export function refreshScrollRuntime(): void {
  ensureRuntimeRegistered();

  if (!getBrowserWindow()) {
    return;
  }

  ScrollTrigger.refresh();
}

export function addGsapTicker(callback: TickerCallback): void {
  ensureRuntimeRegistered();
  gsapLib.ticker.add(callback);
}

export function removeGsapTicker(callback: TickerCallback): void {
  ensureRuntimeRegistered();
  gsapLib.ticker.remove(callback);
}

export function disableGsapLagSmoothing(): void {
  ensureRuntimeRegistered();
  gsapLib.ticker.lagSmoothing(0);
}

registerGsapRuntime();

export { default as gsap } from "gsap";
export { ScrollTrigger } from "gsap/ScrollTrigger";
export default ensureGsapRuntime;
