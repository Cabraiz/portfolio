import { FC, ReactNode } from "react";

import { OuterWrapper, InnerWrapper } from "./styles";

interface ListProps {
  children: ReactNode;
}

export const List: FC<ListProps> = ({ children }) => (
  <OuterWrapper>
    <InnerWrapper>{children}</InnerWrapper>
  </OuterWrapper>
);
