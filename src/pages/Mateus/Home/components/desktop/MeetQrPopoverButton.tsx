import React, {
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
	type FocusEvent,
} from "react";
import { Image } from "react-bootstrap";
import { createPortal } from "react-dom";

import {
	MEET_QR_POPOVER_CTA_LABEL,
	MEET_QR_POPOVER_SUBTITLE,
	MEET_QR_POPOVER_TITLE,
	SOCIAL_ICONS,
	WHATSAPP_HREF,
	WHATSAPP_QR_ALT,
	WHATSAPP_QR_SRC,
} from "../../data/home.data";
import styles from "./MeetQrPopoverButton.module.css";

const HOVER_OPEN_DELAY_MS = 1000;
const HOVER_CLOSE_DELAY_MS = 90;
const POPOVER_WIDTH = 620;
const POPOVER_GAP = 14;
const VIEWPORT_MARGIN = 12;

type PopoverPosition = Readonly<{
	top: number;
	left: number;
	arrowLeft: number;
	placeAbove: boolean;
}>;

export default function MeetQrPopoverButton() {
	const popoverId = useId();
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const popoverRef = useRef<HTMLDivElement | null>(null);
	const openTimeoutRef = useRef<number | null>(null);
	const closeTimeoutRef = useRef<number | null>(null);

	const [isOpen, setIsOpen] = useState(false);
	const [isClient, setIsClient] = useState(false);
	const [position, setPosition] = useState<PopoverPosition>({
		top: 0,
		left: 0,
		arrowLeft: 0,
		placeAbove: true,
	});

	const clearOpenTimeout = useCallback(() => {
		if (openTimeoutRef.current !== null) {
			window.clearTimeout(openTimeoutRef.current);
			openTimeoutRef.current = null;
		}
	}, []);

	const clearCloseTimeout = useCallback(() => {
		if (closeTimeoutRef.current !== null) {
			window.clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
	}, []);

	const clearAllTimeouts = useCallback(() => {
		clearOpenTimeout();
		clearCloseTimeout();
	}, [clearCloseTimeout, clearOpenTimeout]);

	const closeImmediately = useCallback(() => {
		clearAllTimeouts();
		setIsOpen(false);
	}, [clearAllTimeouts]);

	const updatePosition = useCallback(() => {
		const trigger = triggerRef.current;
		if (!trigger) {
			return;
		}

		const rect = trigger.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		const resolvedWidth = Math.min(
			POPOVER_WIDTH,
			Math.max(320, viewportWidth - VIEWPORT_MARGIN * 2)
		);

		let left = rect.right - resolvedWidth;
		left = Math.max(VIEWPORT_MARGIN, left);
		left = Math.min(left, viewportWidth - resolvedWidth - VIEWPORT_MARGIN);

		const estimatedHeight = popoverRef.current?.offsetHeight ?? 300;

		const spaceAbove = rect.top;
		const spaceBelow = viewportHeight - rect.bottom;
		const placeAbove =
			spaceAbove >= estimatedHeight + POPOVER_GAP || spaceAbove >= spaceBelow;

		let top = placeAbove
			? rect.top - estimatedHeight - POPOVER_GAP
			: rect.bottom + POPOVER_GAP;

		top = Math.max(VIEWPORT_MARGIN, top);
		top = Math.min(top, viewportHeight - estimatedHeight - VIEWPORT_MARGIN);

		const triggerCenter = rect.left + rect.width / 2;
		const arrowLeft = Math.max(
			28,
			Math.min(resolvedWidth - 28, triggerCenter - left)
		);

		setPosition({
			top,
			left,
			arrowLeft,
			placeAbove,
		});
	}, []);

	const openImmediately = useCallback(() => {
		clearAllTimeouts();
		setIsOpen(true);
	}, [clearAllTimeouts]);

	const scheduleOpen = useCallback(
		(delay = HOVER_OPEN_DELAY_MS) => {
			clearCloseTimeout();
			clearOpenTimeout();

			if (isOpen) {
				return;
			}

			openTimeoutRef.current = window.setTimeout(() => {
				setIsOpen(true);
				openTimeoutRef.current = null;
			}, delay);
		},
		[clearCloseTimeout, clearOpenTimeout, isOpen]
	);

	const scheduleClose = useCallback(
		(delay = HOVER_CLOSE_DELAY_MS) => {
			clearOpenTimeout();
			clearCloseTimeout();

			closeTimeoutRef.current = window.setTimeout(() => {
				setIsOpen(false);
				closeTimeoutRef.current = null;
			}, delay);
		},
		[clearCloseTimeout, clearOpenTimeout]
	);

	const handleWrapperBlur = useCallback(
		(event: FocusEvent<HTMLDivElement>) => {
			const nextTarget = event.relatedTarget as Node | null;

			if (nextTarget && wrapperRef.current?.contains(nextTarget)) {
				return;
			}

			if (nextTarget && popoverRef.current?.contains(nextTarget)) {
				return;
			}

			closeImmediately();
		},
		[closeImmediately]
	);

	const handleTriggerClick = useCallback(() => {
		if (isOpen) {
			closeImmediately();
			return;
		}

		openImmediately();
	}, [closeImmediately, isOpen, openImmediately]);

	useEffect(() => {
		setIsClient(true);

		return () => {
			clearAllTimeouts();
		};
	}, [clearAllTimeouts]);

	useLayoutEffect(() => {
		if (!isOpen) {
			return;
		}

		updatePosition();
		requestAnimationFrame(updatePosition);
	}, [isOpen, updatePosition]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target as Node | null;

			if (target && wrapperRef.current?.contains(target)) {
				return;
			}

			if (target && popoverRef.current?.contains(target)) {
				return;
			}

			closeImmediately();
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") {
				return;
			}

			closeImmediately();
			triggerRef.current?.focus();
		};

		const handleReposition = () => {
			updatePosition();
		};

		document.addEventListener("pointerdown", handlePointerDown, true);
		document.addEventListener("keydown", handleKeyDown);
		window.addEventListener("resize", handleReposition);
		window.addEventListener("scroll", handleReposition, true);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown, true);
			document.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("resize", handleReposition);
			window.removeEventListener("scroll", handleReposition, true);
		};
	}, [closeImmediately, isOpen, updatePosition]);

	const portalContent =
		isClient && isOpen
			? createPortal(
					<div
						ref={popoverRef}
						id={popoverId}
						role="dialog"
						aria-modal="false"
						aria-label={MEET_QR_POPOVER_TITLE}
						className={styles.popoverSurface}
						data-place-above={position.placeAbove ? "true" : "false"}
						style={
							{
								"--meet-popover-top": `${position.top}px`,
								"--meet-popover-left": `${position.left}px`,
								"--meet-popover-width": `min(${POPOVER_WIDTH}px, calc(100vw - 24px))`,
								"--meet-popover-arrow-left": `${position.arrowLeft}px`,
							} as React.CSSProperties
						}
						onMouseEnter={() => scheduleOpen(0)}
						onMouseLeave={() => scheduleClose()}
					>
						<div className={styles.arrow} aria-hidden="true" />

						<div className={styles.headerRow}>
							<div className={styles.headerCopy}>
								<span className={styles.eyebrow}>WhatsApp</span>
								<h3 className={styles.title}>{MEET_QR_POPOVER_TITLE}</h3>
							</div>

							<button
								type="button"
								className={styles.closeButton}
								aria-label="Fechar popup do WhatsApp"
								onClick={closeImmediately}
							>
								×
							</button>
						</div>

						<div className={styles.contentGrid}>
							<div className={styles.infoColumn}>
								<p className={styles.subtitle}>{MEET_QR_POPOVER_SUBTITLE}</p>

								<p className={styles.helpText}>
									Escaneie com a câmera do celular ou toque no botão abaixo para
									abrir a conversa.
								</p>

								<a
									href={WHATSAPP_HREF}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.ctaButton}
									onClick={closeImmediately}
								>
									{MEET_QR_POPOVER_CTA_LABEL}
								</a>
							</div>

							<div className={styles.qrColumn}>
								<div className={styles.qrCard}>
									<img
										className={styles.qrImage}
										src={WHATSAPP_QR_SRC}
										alt={WHATSAPP_QR_ALT}
										loading="eager"
										decoding="async"
									/>
								</div>
							</div>
						</div>
					</div>,
					document.body
				)
			: null;

	return (
		<>
			<div
				ref={wrapperRef}
				className={styles.wrapper}
				onMouseEnter={() => scheduleOpen()}
				onMouseLeave={() => scheduleClose()}
				onFocusCapture={openImmediately}
				onBlurCapture={handleWrapperBlur}
			>
				<button
					ref={triggerRef}
					type="button"
					className={`social-wrapper ${styles.triggerButton}`}
					aria-label="Abrir QR Code do WhatsApp"
					aria-haspopup="dialog"
					aria-expanded={isOpen}
					aria-controls={popoverId}
					onClick={handleTriggerClick}
				>
					<div className="social-link">
						<Image
							className="imagesize imagesize--support"
							src={SOCIAL_ICONS.meet}
							alt=""
							aria-hidden="true"
						/>
					</div>
				</button>
			</div>

			{portalContent}
		</>
	);
}
