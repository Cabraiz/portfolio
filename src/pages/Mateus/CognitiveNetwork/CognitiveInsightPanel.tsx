import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import React from "react";

import styles from "./CognitiveNetwork.module.css";
import { MODE_SEED, sequenceValue } from "./CognitiveInsightPanel.model";
import type { CognitiveInsightPanelProps } from "./CognitiveInsightPanel.model";
import {
	AttentionMap,
	CognitiveRadar,
	LatentActivation,
} from "./CognitiveInsightPanel.charts";

export const COGNITIVE_UPDATE_INTERVAL_MS = 1000;

const CognitiveInsightPanel: React.FC<CognitiveInsightPanelProps> = (props) => {
  useLabelLanguage();
	const signatureSeed = MODE_SEED[props.mode] ^ 0x1b873593;
	const frameSignature = Array.from({ length: 4 }, (_, index) =>
		Math.floor(sequenceValue(props.tick, index + 4000, signatureSeed) * 0xffff)
			.toString(16)
			.padStart(4, "0")
	).join("");

	return (
		<aside
			className={styles.inspector}
			data-cognitive-inspector="true"
			data-cognitive-feature-count="3"
			data-cognitive-frame={props.tick.toFixed(4)}
			data-cognitive-target-frame={props.tick}
			data-frame-signature={frameSignature}
			data-update-interval={COGNITIVE_UPDATE_INTERVAL_MS}
			data-value-scale="100"
			data-transition-mode="native-continuous-motion"
			data-transition-duration="900"
			data-change-envelope="bounded-micro-variation"
			data-signal-blink-range="0.30:0.50"
			data-sequence="xorshift32-long-cycle"
			data-motion-profile="continuous-micro-variation-with-signal-flow"
			aria-label={localizeLabel("Leituras cognitivas em transição contínua")}
		>
			<AttentionMap {...props} />
			<LatentActivation {...props} />
			<CognitiveRadar {...props} />
		</aside>
	);
};

export default CognitiveInsightPanel;
