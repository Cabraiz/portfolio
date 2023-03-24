import React, { useRef, useEffect, useState } from "react";

import Login_Logo from "../../assets/HubLocal/Login_Logo.webp";
import Login_Image from "../../assets/HubLocal/Login_Image.webp";

import { ToastContainer, toast } from "react-toastify";

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
  VStack,
} from "@chakra-ui/react";

import { FaUserAlt, FaLock } from "react-icons/fa";

import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import "./Login.css";

import { tokenReceived } from "../../redux/feature/auth/authSlice";
import {
  LoginRequest,
  useLoginMutation,
} from "../../redux/feature/auth/authApiSlice";

import { ProtectedComponent } from "../../redux/feature/auth/ProtectedComponent";
import { isMobile } from "react-device-detect";

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

function Login() {
  const CFaUserAlt = chakra(FaUserAlt);

  const [formState, setFormState] = React.useState<LoginRequest>({
    username: "",
    password: "",
  });

  const userRef = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();

  const [realHeight, setrealHeight] = useState("");

  const [isAnimationSet, setAnimationSet] = useState(false);

  const notifySucesso = () => {
    toast.success("Sucesso!", {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  const notifyError = () => {
    toast.warning("Falha!", {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  useEffect(() => {
    setAnimationSet(true);
  }, []);

  useEffect(() => {
    if(isMobile)
      setrealHeight(`${window.innerHeight}px`);
    else{
      setrealHeight("100vh");
    }
  }, [realHeight]);

  useEffect(() => {
    const node = userRef.current;
    node?.focus();
  }, []);

  useEffect(() => {
    setErrMsg("");
  }, [user, pwd]);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    try {
      const userData = await login(formState).unwrap();
      dispatch(tokenReceived({ ...userData, user }));
      setUser("");
      setPwd("");
      navigate("/welcome");
    } catch (err: any) {
      const response = err?.response.status;
      if (!err?.response) {
        setErrMsg("No Sever Response");
      } else if (response === 400) {
        setErrMsg("Missing Usarname or Password");
      } else if (response === 401) {
        setErrMsg("Unauthorized");
      } else {
        setErrMsg("Login Failed");
      }
      const node = errRef.current;
      node?.focus();
    }
  };

  const handleChange = ({
    target: { name, value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    setFormState((prev) => ({ ...prev, [name]: value }));

  const textoTitle = "Junte-se a vários clientes satisfeitos.";
  const textoSubtitle =
    "Cliente HubLocal ganha mais relevância, autoridade e visibilidade. Mais de 7.000 marcas confiam na nossa plataforma. Seja uma delas!";

  const content = isLoading ? (
    <h1>Loading...</h1>
  ) : (
    <>
      <Flex
        flexDirection="column"
        backgroundColor="white"
        justifyContent="center"
        alignItems="center"
      >
        <Grid
          templateColumns="minmax(100px, 1fr)"
          autoFlow="column"
        >
          <GridItem
            w="50vw"
            maxH={realHeight}
            display={{ base: "none", md: "flex" }}
            style={{ backgroundColor: "#0485FF", alignItems: "end" }}
          >
            <Stack minH={realHeight} maxH={realHeight} justifyContent="end">
              <Image
                flexGrow="100"
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
                }}>
                <Text
                  className="frase-imagem-logo"
                  margin= "0"
                  style={{
                    padding: "0 5vw 0 5vw"
                  }}
                >
                  {textoTitle}
                </Text>
                <Text
                  className="subfrase-imagem-logo letter-spacing-text"
                >
                  {textoSubtitle}
                </Text>
              </Stack>
            </Stack>
          </GridItem>
          <GridItem w="50vw" className="column columnB" h={realHeight}>
            <Stack justifyContent="center" alignItems="center">
              <Image
                paddingBottom="3.3vh"
                minW="300px"
                w="24vw"
                src={Login_Logo}
              />
              <Box minW={{ md: "31vw" }}>
                <form onSubmit={handleSubmit}>
                  <Stack
                    w={{ base: "90vw", md: "auto" }}
                    spacing={6}
                    backgroundColor="whiteAlpha.900"
                    style={{ paddingBottom: "0" }}
                  >
                    <FormControl>
                      <Text
                        className="letter-spacing-text poppins-text-label"
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
                          onChange={handleChange}
                          name="username"
                          type="text"
                          required
                          className="buttonHeight"
                          placeholder="Email"
                          style={{ borderColor: "#0385FD", borderWidth: "2px" }}
                        />
                      </InputGroup>
                    </FormControl>
                    <FormControl style={{ marginTop: "0" }}>
                      <Text
                        className="letter-spacing-text poppins-text-label"
                        style={{ padding: "1vh 0 1vh 0", marginBottom: "0" }}
                      >
                        Senha
                      </Text>
                      <InputGroup style={{ alignItems: "center"}}>
                        <PasswordInput
                          onChange={handleChange}
                          name="password"
                        ></PasswordInput>
                      </InputGroup>
                    </FormControl>
                    <Button
                      className="buttonHeight"
                      type="submit"
                      variant="solid"
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
    </>
  );

  return content;
}

export default Login;
