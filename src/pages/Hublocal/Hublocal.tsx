import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectCurrentToken,
} from "../../redux/feature/auth/authSlice";
import Perfil_Image from "../../assets/HubLocal/Perfil_Image.webp";

import { ProtectedComponent } from "../../redux/feature/auth/ProtectedComponent";

import { Flex, Grid, GridItem, Box, Image, Text } from "@chakra-ui/react";

const Hublocal = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);

  const welcome = user ? `Welcome ${user}!` : "Welcome!";
  const tokenAbbr = `${token?.slice(0, 9)}...`;

  return (
    <Flex
      flexDirection="row"
      backgroundColor="white"
      justifyContent="space-between"
    >
      <Box
        w="auto"
        style={{ alignItems: "center", padding: "2vh 2vw 2vh 2vw" }}
      >
        <Grid className="column" autoFlow="column">
          <GridItem style={{ paddingRight: "10px" }}>
            <Image
              objectFit="cover"
              borderRadius="full"
              h="40px"
              src={Perfil_Image}
            />
          </GridItem>
          <GridItem style={{ paddingRight: "10px" }}>
            <Text fontSize="x-large" className="titulo-esquerda">
              Minhas Empresas
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="smaller" className="subfrase-imagem-logo">
              Ola
            </Text>
          </GridItem>
        </Grid>
      </Box>
      <Box
        w="auto"
        style={{
          backgroundColor: "#EAEAEA",
          alignItems: "center",
          padding: "2vh 2vw 2vh 2vw",
        }}
      >
        <Grid className="column" autoFlow="column">
          <GridItem style={{ paddingRight: "10px" }}>
            <Image
              objectFit="cover"
              borderRadius="full"
              h="40px"
              src={Perfil_Image}
            />
          </GridItem>
          <GridItem style={{ paddingRight: "10px" }}>
            <Text fontSize="x-large" className="frase-imagem-logo">
              Nome
            </Text>
          </GridItem>
          <GridItem>
            <Text fontSize="smaller" className="subfrase-imagem-logo">
              Ola
            </Text>
          </GridItem>
        </Grid>
        <ProtectedComponent />
      </Box>
    </Flex>
  );
};
export default Hublocal;
