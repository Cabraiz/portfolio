import { localizeLabel } from "@/i18n/labels";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./ProjectImageLightbox.module.css";

type ProjectImageLightboxProps = Readonly<{
	projectName: string;
	imageSrc: string;
	imageAlt: string;
	onClose: () => void;
}>;

/**
 * Print do projeto em tela cheia no celular. Um toque na imagem aproxima
 * (altura da tela, arrastando para os lados) e outro volta a caber na tela;
 * fecha pelo X, tocando fora da imagem ou com Esc.
 */
export default function ProjectImageLightbox({
	projectName,
	imageSrc,
	imageAlt,
	onClose,
}: ProjectImageLightboxProps) {
	const [zoomed, setZoomed] = useState(false);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const scrollerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const previousFocus = document.activeElement as HTMLElement | null;
		const root = document.documentElement;
		const previousOverflow = root.style.overflow;
		root.style.overflow = "hidden";
		closeButtonRef.current?.focus({ preventScroll: true });
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			root.style.overflow = previousOverflow;
			previousFocus?.focus?.({ preventScroll: true });
		};
	}, [onClose]);

	// Ao aproximar, começa pelo centro da imagem.
	useLayoutEffect(() => {
		const scroller = scrollerRef.current;
		if (!scroller) return;
		scroller.scrollLeft = zoomed
			? (scroller.scrollWidth - scroller.clientWidth) / 2
			: 0;
	}, [zoomed]);

	return createPortal(
		<div
			className={styles.backdrop}
			role="dialog"
			aria-modal="true"
			aria-label={projectName}
			data-project-lightbox="true"
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<button
				ref={closeButtonRef}
				type="button"
				className={styles.close}
				aria-label={localizeLabel("Fechar imagem ampliada")}
				onClick={onClose}
			>
				×
			</button>
			<div
				ref={scrollerRef}
				className={styles.scroller}
				data-zoomed={zoomed}
				onClick={(event) => {
					if (event.target === event.currentTarget) onClose();
				}}
			>
				<img
					className={styles.image}
					src={imageSrc}
					alt={imageAlt}
					draggable={false}
					data-project-lightbox-image="true"
					onClick={() => setZoomed((current) => !current)}
				/>
			</div>
			<p className={styles.caption}>
				<strong>{projectName}</strong>
				<span>{localizeLabel("Toque na imagem para aproximar ou afastar")}</span>
			</p>
		</div>,
		document.body
	);
}
