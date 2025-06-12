import { FC } from "react";

import { Container, Image, PriceTag } from "./styles";

interface StageProps {
  imageUrl: string;
  currentPrice: string;
}

export const Stage: FC<StageProps> = ({ imageUrl, currentPrice }) => (
  <Container>
    <Image data-testid="image" src={imageUrl} alt="" />
    <PriceTag data-testid="tag">{currentPrice}</PriceTag>
  </Container>
);
