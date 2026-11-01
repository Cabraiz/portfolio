import { useEffect, useState } from "react";

/**
 * Fonte de uma imagem que vai melhorando: começa na miniatura embutida (aparece
 * na hora) e troca pela prévia pequena assim que ela chega decodificada.
 * A foto final entra por cima, no componente que a usa.
 */
export default function useProgressiveSource(
	placeholderSrc: string,
	previewSrc: string | null
): { src: string; stage: "lqip" | "preview" } {
	const [src, setSrc] = useState(placeholderSrc);

	useEffect(() => {
		if (!previewSrc) return undefined;
		let active = true;
		const preview = new Image();
		preview.decoding = "async";
		preview.src = previewSrc;
		void preview
			.decode()
			.then(() => {
				if (active) setSrc(previewSrc);
			})
			.catch(() => undefined);
		return () => {
			active = false;
		};
	}, [previewSrc]);

	return { src, stage: src === placeholderSrc ? "lqip" : "preview" };
}
