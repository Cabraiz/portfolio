import React from "react";
import { isMobile } from "react-device-detect";
import ScratchCard from "react-scratchcard-v2";

import icognita from "../../../images/Surprise/Icognita.png";
import icognitaBlock from "../../../images/Surprise/IcognitaBlock.png";
import icognitaDone from "../../../images/Surprise/icognitaDone.png";
import circle from "../../../images/Surprise/circle.png";

import "animate.css";

type ContainerProps = {
  children: React.ReactNode;
};

const convertVhToPx = (vh: number) => {
  const oneVhInPx = window.innerHeight / 100;
  return oneVhInPx * vh;
};

const convertVwToPx = (vw: number, a: number) => {
  const oneVhInPx = window.innerWidth / 100;
  let temp = oneVhInPx * vw;
  if (!isMobile) {
    temp = temp / 3.6;
  }
  if (temp < 140) {
    temp = 140;
  }
  return Math.ceil(temp);
};

const cardCustomStyle = {
  image: circle,
  width: 15,
  height: 15,
};

const vh = 85;
const vw = 46;
const percRasp = 1;

export const Block = (props: ContainerProps) => {
  return (
    <ScratchCard
      width={convertVwToPx(vw, 0)}
      height={convertVhToPx(vh)}
      image={icognitaBlock}
      finishPercent={percRasp}
      customBrush={cardCustomStyle}
    >
      {props.children}
    </ScratchCard>
  );
};

export const Done = (props: ContainerProps) => {
  return (
    <ScratchCard
      width={convertVwToPx(vw, 0)}
      height={convertVhToPx(vh)}
      image={icognitaDone}
      finishPercent={percRasp}
      customBrush={cardCustomStyle}
    >
      {props.children}
    </ScratchCard>
  );
};

export const Default = (props: ContainerProps) => {
  return (
    <ScratchCard
      width={convertVwToPx(vw, 0)}
      height={convertVhToPx(vh)}
      image={icognita}
      finishPercent={percRasp}
      customBrush={cardCustomStyle}
    >
      {props.children}
    </ScratchCard>
  );
};
