import { Flex, Grid, GridItem, Stack, Image, Text, Input, FormHelperText } from "@chakra-ui/react";

import "./ModeloLadoEsquerdoPage.css";
import { ModeloLadoEsquerdoPageParams, RegisterParams } from "./models/loginRregisterHubLocal.interface"
import { ToastContainer, toast } from "react-toastify";

function ModeloLadoEsquerdoPage( params: ModeloLadoEsquerdoPageParams ) {
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
          {/* Left grid item */}
          <GridItem
            w="50vw"
            maxH={params.realHeight}
            display={{ base: "none", md: "flex" }}
            style={{ backgroundColor: "#0485FF", alignItems: "end" }}
          >
            <Stack
              minH={params.realHeight}
              maxH={params.realHeight}
              justifyContent="end"
              alignItems="center"
            >
              <Image
                flexGrow="1"
                className={params.isAnimationSet ? "fastAnimation" : ""}
                marginBlock="-15px"
                objectFit="cover"
                src={params.Login_Image}
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
          {/* Right grid item */}
          <GridItem w="50vw" className="column columnB" h={params.realHeight}>
            <Stack justifyContent="center" alignItems="center">
              <Image
                paddingBottom="1.5vh"
                minW={{ base: "70vw", md: "300px" }}
                w="24.5vw"
                src={params.Login_Logo}
              />
              {params.JSX}
            </Stack>
          </GridItem>
        </Grid>
      </Flex>
    </>
  );

  return content;
}

function Model_Register( params: RegisterParams ){
    return (
      <>
        <Stack w="inherit">
            <Input
            value={params.value}
            onChange={params.onChange}
            onBlur={params.onBlur}
            type={params.type}
            name={params.name}
            id={params.id}
            required

            className="input-setting"
            borderColor={params.error ? "red" : "#0385FD"}
            style={{ borderWidth: "2px" }}
            />
            {params.error ? (
            <FormHelperText>
            <Text className="form-helper-font" mb="0">
                {params.helperText}
            </Text>
            </FormHelperText>
        ) : ""}
        </Stack>
      </>
    )
}

function Model_Login( params: RegisterParams,  ){
  return (
    <>
      <Stack w="inherit">
          <Input
          value={params.value}
          onChange={params.onChange}
          onBlur={params.onBlur}
          type={params.type}
          name={params.name}
          id={params.id}
          required

          className="input-setting"
          borderColor={params.error ? "red" : "#0385FD"}
          style={{ borderWidth: "2px" }}
          />
          {params.error ? (
          <FormHelperText>
          <Text className="form-helper-font" mb="0">
              {params.helperText}
          </Text>
          </FormHelperText>
      ) : ""}
      </Stack>
    </>
  )
}

export { ModeloLadoEsquerdoPage , Model_Register };
