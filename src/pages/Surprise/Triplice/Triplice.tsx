import React, { useEffect, useRef } from "react";
import { ScratchCard, SCRATCH_TYPE } from "scratchcard-js";

import icognita from "../../../assets/Surprise/Icognita.png";
import icognitaBlock from "../../../assets/Surprise/IcognitaBlock.png";
import icognitaDone from "../../../assets/Surprise/icognitaDone.png";
import circle from "../../../assets/Surprise/circle.png";

const convertVhToPx = (vh: number) => (window.innerHeight / 100) * vh;
const convertVwToPx = (vw: number) => (window.innerWidth / 100) * vw;

const cardCustomStyle = {
  brushSrc: circle,
  width: 15,
  height: 15,
};

const vh = 85;
const vw = 46;
const percRasp = 20;

type ContainerProps = {
  children: React.ReactNode;
  onComplete?: () => void;
  imageSrc: string;
};

const ScratchCardComponent = ({ imageSrc, onComplete }: ContainerProps) => {
  const scratchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scratchRef.current) {
      const sc = new ScratchCard("#scratch-card", {
        scratchType: SCRATCH_TYPE.CIRCLE,
        containerWidth: convertVwToPx(vw),
        containerHeight: convertVhToPx(vh),
        imageForwardSrc: imageSrc,
        htmlBackground: "",
        percentToFinish: percRasp,
        brushSrc: cardCustomStyle.brushSrc,
      });

      sc.canvas.addEventListener("scratch.move", () => {
        if (sc.getPercent() >= percRasp && onComplete) {
          onComplete();
        }
      });

      sc.init();
    }
  }, [imageSrc, onComplete]);

  return <div id="scratch-card" ref={scratchRef}></div>;
};

export const Block = (props: Omit<ContainerProps, "imageSrc">) => (
  <ScratchCardComponent imageSrc={icognitaBlock} {...props} />
);

export const Done = (props: Omit<ContainerProps, "imageSrc">) => (
  <ScratchCardComponent imageSrc={icognitaDone} {...props} />
);

export const Default = (props: Omit<ContainerProps, "imageSrc">) => (
  <ScratchCardComponent imageSrc={icognita} {...props} />
);
