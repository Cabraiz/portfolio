import React, { useState, useEffect } from "react";

import Login_Logo from "../../assets/HubLocal/Login_Logo.webp";
import Login_Image from "../../assets/HubLocal/Login_Image.webp";

import { useDispatch, useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import { FaUserAlt, FaLock } from "react-icons/fa";

import {
  Flex,
  Grid,
  GridItem,
  Input,
  Button,
  InputGroup,
  Stack,
  InputLeftElement,
  chakra,
  Box,
  Image,
  FormControl,
  Text,
  InputRightElement,
} from "@chakra-ui/react";

function PasswordInput({
  name,
  onChange,
}: {
  name: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const CFaLock = chakra(FaLock);
  const [showPassword, setShowPassword] = useState(false);

  const handleShowClick = () => setShowPassword(!showPassword);

  return (
    <InputGroup size="md">
      <InputLeftElement
        h="100%"
        pointerEvents="none"
        children={<CFaLock color="gray.300" />}
      />
      <Input
        name={name}
        onChange={onChange}
        id="password"
        required
        className="buttonHeight"
        type={showPassword ? "text" : "password"}
        placeholder="Senha"
        style={{ borderColor: "#0385FD", borderWidth: "2px" }}
      />
      <InputRightElement w="auto" height="100%" paddingRight="8px">
        <Button h="70%" size="sm" onClick={handleShowClick}>
          {showPassword ? "Ocultar" : "Mostrar"}
        </Button>
      </InputRightElement>
    </InputGroup>
  );
}

function Register() {
  const CFaUserAlt = chakra(FaUserAlt);

  const [user, setUser] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });
  const dispatch = useDispatch();

  const [isDesktop, setIsDesktop] = useState(false);

  const textoTitle = "Junte-se a vários clientes satisfeitos.";
  const textoSubtitle =
    "Cliente HubLocal ganha mais relevância, autoridade e visibilidade. Mais de 7.000 marcas confiam na nossa plataforma. Seja uma delas!";

  const content = (
    <Flex flexDirection="column" backgroundColor="white">
      <Grid
        className="column"
        templateColumns="minmax(100px, 1fr)"
        autoFlow="column"
      >
        <GridItem
          w="50vw"
          h="100vh"
          display={isDesktop ? "none" : "flex"}
          style={{ backgroundColor: "#0485FF", alignItems: "end" }}
        >
          <Stack justifyContent="center" alignItems="center" h="100vh">
            <Image
              h="full"
              paddingTop="8.72vh"
              marginBlock="-6px"
              objectFit="cover"
              src={Login_Image}
            />
            <Box
              style={{
                backgroundColor: "#00CC99",
                marginTop: "0",
                padding: "2.5vh 5.2vw 3.75vh 5.2vw",
              }}
            >
              <Text
                fontSize="4xl"
                className="frase-imagem-logo"
                style={{ padding: "0 3.55vw 1.2vh 3.55vw" }}
              >
                {textoTitle}
              </Text>
              <Text
                fontSize="md"
                className="subfrase-imagem-logo letter-spacing-text "
              >
                {textoSubtitle}
              </Text>
            </Box>
          </Stack>
        </GridItem>
        <GridItem w="50vw" h="100vh" className="column columnB">
          <Stack justifyContent="center" alignItems="center">
            <Image
              paddingBottom="3.3vh"
              minW="200px"
              w="24vw"
              src={Login_Logo}
            />
            <Box minW={{ md: "31vw" }}>
              <form>
                <Stack
                  w={isDesktop ? "100vw" : "auto"}
                  spacing={6}
                  backgroundColor="whiteAlpha.900"
                  style={{ paddingBottom: "0" }}
                >
                  <FormControl>
                    <Text
                      fontSize="sm"
                      className="letter-spacing-text poppins-text-label"
                      style={{ paddingBottom: "5px" }}
                    >
                      Email
                    </Text>
                    <InputGroup>
                      <InputLeftElement
                        h="100%"
                        pointerEvents="none"
                        children={<CFaUserAlt color="gray.300" />}
                      />
                      <Input
                        name="username"
                        type="text"
                        required
                        className="buttonHeight"
                        placeholder="E-mail"
                        style={{ borderColor: "#0385FD", borderWidth: "2px" }}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormControl style={{ marginTop: "0" }}>
                    <Text
                      fontSize="sm"
                      className="letter-spacing-text poppins-text-label"
                      style={{ padding: "10px 0 5px 0" }}
                    >
                      Senha
                    </Text>
                    <InputGroup style={{ alignItems: "center" }}></InputGroup>
                  </FormControl>
                  <Button
                    className="buttonHeight"
                    type="submit"
                    variant="solid"
                    w="full"
                    style={{
                      backgroundColor: "#0385FD",
                      color: "#FFFFFF",
                      fontWeight: "700",
                    }}
                  >
                    <Text
                      className="letter-spacing-button poppins-text-button"
                      fontSize="larger"
                    >
                      LOGAR
                    </Text>
                  </Button>
                  <Button
                    className="buttonHeight"
                    type="submit"
                    variant="solid"
                    w="full"
                    style={{
                      backgroundColor: "#00CC99",
                      color: "#FFFFFF",
                      fontWeight: "700",
                    }}
                  >
                    <Text
                      className="letter-spacing-button poppins-text-button"
                      fontSize="larger"
                    >
                      CRIAR CONTA
                    </Text>
                  </Button>
                </Stack>
              </form>
            </Box>
          </Stack>
        </GridItem>
      </Grid>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Flex>
  );
}

export default Register;
