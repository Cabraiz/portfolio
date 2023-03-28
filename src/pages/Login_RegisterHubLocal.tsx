import {
    Flex,
    Grid,
    GridItem,
    Stack,
    Image,
    Text,
  } from "@chakra-ui/react";

function Login_RegisterHubLocal(realHeight: string, isAnimationSet: boolean, Login_Image: string, Login_Logo: string, JSX: JSX.Element) {

    const textoTitle = "Junte-se a vários clientes satisfeitos.";
    const textoSubtitle =
      "Cliente HubLocal ganha mais relevância, autoridade e visibilidade. Mais de 7.000 marcas confiam na nossa plataforma. Seja uma delas!";  
    
      const content = (
      <>
        <Flex
          flexDirection="column"
          backgroundColor="white"
          justifyContent="center"
          alignItems="center"
        >
          <Grid templateColumns="minmax(100px, 1fr)" autoFlow="column">
            <GridItem
              w="50vw"
              maxH={realHeight}
              display={{ base: "none", md: "flex" }}
              style={{ backgroundColor: "#0485FF", alignItems: "end" }}
            >
              <Stack
                minH={realHeight}
                maxH={realHeight}
                justifyContent="end"
                alignItems="center"
              >
                <Image
                  flexGrow="1"
                  className={isAnimationSet ? "fastAnimation" : ""}
                  marginBlock="-15px"
                  objectFit="cover"
                  src={Login_Image}
                  marginTop="10vh"
                />
                <Stack
                  style={{
                    backgroundColor: "#00CC99",
                    padding: "2.2vh 5vw 4vh 5vw",
                  }}
                >
                  <Text
                    className="frase-imagem-logo"
                    margin="0"
                    style={{
                      padding: "0 5vw 0 5vw",
                    }}
                  >
                    {textoTitle}
                  </Text>
                  <Text className="subfrase-imagem-logo letter-spacing-text">
                    {textoSubtitle}
                  </Text>
                </Stack>
              </Stack>
            </GridItem>
            <GridItem w="50vw" className="column columnB" h={realHeight}>
              <Stack justifyContent="center" alignItems="center">
                <Image
                  paddingBottom="1.5vh"
                  minW={{ base: "70vw", md: "300px" }}
                  w="24.5vw"
                  src={Login_Logo}
                />
                {JSX}
              </Stack>
            </GridItem>
          </Grid>
        </Flex>
      </>
    );
  
    return content;
  }
  
  export default Login_RegisterHubLocal;