import { FC, ReactNode } from "react";

import { Container, Text, Header } from "./styles";

interface BackdropProps {
  children: ReactNode;
}

export const Backdrop: FC<BackdropProps> = ({ children }) => (
  <Container>
    <Header>
      <Text>Combinar</Text>
      <button>Limpar</button>
    </Header>
    {children}
  </Container>
);
