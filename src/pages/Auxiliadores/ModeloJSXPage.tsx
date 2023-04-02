import {
  Flex,
  Grid,
  GridItem,
  Stack,
  Image,
  Text,
  Input,
  FormHelperText,
  InputGroup,
  Spinner,
  Box
} from "@chakra-ui/react";

import "./ModeloJSXPage.css";
import {
  ModeloLadoEsquerdoPageParams,
  RegisterParams,
} from "./models/ModeloJSXPage.interface";

function ModeloLadoEsquerdoPage(params: ModeloLadoEsquerdoPageParams) {
  const textoTitle = "Junte-se a vários clientes satisfeitos.";
  const textoSubtitle =
    "Cliente HubLocal ganha mais relevância, autoridade e visibilidade. Mais de 7.000 marcas confiam na nossa plataforma. Seja uma delas!";

  const content: JSX.Element = (
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

function ModeloLadoDireitoPage(
  params: RegisterParams,
  EsquerdoJSX?: JSX.Element,
  DireitoJSX?: JSX.Element
) {
  return (
    <>
      <Stack w="inherit">
        <InputGroup style={{ marginTop: "0.5vh" }}>
          {EsquerdoJSX}
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
            paddingLeft={`${EsquerdoJSX ? "50px" : ""}`}
            paddingRight={`${DireitoJSX ? "80px" : ""}`}
            style={{ borderWidth: "2px", width:"100%" }}
          />
          {DireitoJSX}
        </InputGroup>
        {params.error && (
          <FormHelperText>
            <Text className="form-helper-font" mb="0">
              {params.helperText}
            </Text>
          </FormHelperText>
        )}
      </Stack>
    </>
  );
}

function LoadingPage() {
  return (
  <Box
    position="fixed"
    top="0"
    bottom="0"
    left="0"
    right="0"
    backgroundColor="rgba(0, 0, 0, 0.5)"
    display="flex"
    alignItems="center"
    justifyContent="center"
    zIndex="1000"
  >
    <Flex
      direction="column"
      alignItems="center"
      justify="center"
      textAlign="center"
      padding="6"
      backgroundColor="white"
      borderRadius="md"
      boxShadow="md"
    >
      <Spinner size="xl" color="blue.500" />
      <Box marginTop="6">
        <Text
          color="gray.800"
          fontSize={{ base: "3xl", md: "4xl" }}
          fontWeight="bold"
        >
          Só um momento...
        </Text>
        <Text color="gray.600" marginTop="4">
          Estamos carregando seus dados e configurando seu painel.
        </Text>
        <Text color="gray.600" marginTop="4">
          Isso pode demorar um pouco, dependendo da quantidade de dados que precisamos processar.
        </Text>
        <Text color="gray.600" marginTop="4">
          Obrigado pela sua paciência.
        </Text>
      </Box>
    </Flex>
  </Box>
  )
}

export { ModeloLadoEsquerdoPage, ModeloLadoDireitoPage, LoadingPage };
