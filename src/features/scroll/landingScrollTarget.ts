const LANDING_SCROLL_TARGET_ATTRIBUTE = "data-landing-scroll-target";

function getRootElement(): HTMLElement | null {
	return typeof document === "undefined" ? null : document.documentElement;
}

export function setPendingLandingScrollTarget(targetScrollTop: number): void {
	getRootElement()?.setAttribute(
		LANDING_SCROLL_TARGET_ATTRIBUTE,
		String(Math.max(0, Math.round(targetScrollTop)))
	);
}

export function readPendingLandingScrollTarget(): number | null {
	const value = getRootElement()?.getAttribute(LANDING_SCROLL_TARGET_ATTRIBUTE);
	const parsed = value === null ? Number.NaN : Number(value);

	return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

export function clearPendingLandingScrollTarget(
	expectedTarget?: number
): void {
	const root = getRootElement();

	if (!root) {
		return;
	}

	if (typeof expectedTarget === "number") {
		const currentTarget = readPendingLandingScrollTarget();
		if (currentTarget !== Math.max(0, Math.round(expectedTarget))) {
			return;
		}
	}

	root.removeAttribute(LANDING_SCROLL_TARGET_ATTRIBUTE);
}
