import React, { useRef, useEffect, useState, FormEvent } from "react";

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
  Box,
  Image,
  FormControl,
  Text,
  Link,
} from "@chakra-ui/react";

import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import "./Register.css";

import { tokenReceived } from "../../redux/feature/auth/authSlice";
import {
  LoginRequest,
  useLoginMutation,
} from "../../redux/feature/auth/authApiSlice";

import { ProtectedComponent } from "../../redux/feature/auth/ProtectedComponent";
import { isMobile } from "react-device-detect";
import useInput from "../../redux/hooks/input/use-input";
import { validateNameLength, validatePasswordLength } from "../../redux/shared/utils/validation/lenght";
import { validateEmail } from "../../redux/shared/utils/validation/email";

function NomeInput({
  value,
  onChange,
  onBlur,
  error,
  helperText,
}: {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: boolean | undefined;
  helperText: string;
}) {
  return (
    <InputGroup size="md">
      <Input
        type='text'
        name='name'
        id='name'
        
        required
        className="inputSettings"
        style={{ borderColor: "#0385FD", borderWidth: "2px" }}
      />
    </InputGroup>
  );
}

function EmailInput({
  value,
  onChange,
  onBlur,
  error,
  helperText,
}: {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: boolean | undefined;
  helperText: string;
}) {
  return (
    <InputGroup size="md">
      <Input
        type='text'
        name='email'
        id='email'
        required

        className="inputSettings"
        style={{ borderColor: "#0385FD", borderWidth: "2px" }}
      />
    </InputGroup>
  );
}

function PasswordInput({
  value,
  onChange,
  onBlur,
  error,
  helperText,
}: {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: boolean | undefined;
  helperText: string;
}) {
  return (
    <InputGroup size="md">
      <Input
        type='text'
        name='password'
        id='password'
        required


        placeholder="Mínimo de 6 caracteres"
        className="inputSettings"
        style={{ borderColor: "#0385FD", borderWidth: "2px" }}
      />
    </InputGroup>
  );
}

function ConfirmPasswordInput({
  value,
  onChange,
  onBlur,
  error,
  helperText,
}: {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: boolean | undefined;
  helperText: string;
}) {
  return (
    <InputGroup size="md">
      <Input
        type='text'
        name='confirmPassword'
        id='confirmPassword'
        required


        placeholder="Mínimo de 6 caracteres"
        className="inputSettings"
        style={{ borderColor: "#0385FD", borderWidth: "2px" }}
      />
    </InputGroup>
  );
}

function Register() {
  const [formState, setFormState] = React.useState<LoginRequest>({
    username: "",
    password: "",
  });

  const {
    text: name,
    shouldDisplayError: nameHasError,
    textChangeHandler: nameChangeHandler,
    inputBlurHandler: nameBlurHandler,
    clearHandler: nameClearHandler
  } = useInput(validateNameLength)

  const {
    text: email,
    shouldDisplayError: emailHasError,
    textChangeHandler: emailChangeHandler,
    inputBlurHandler: emailBlurHandler,
    clearHandler: emailClearHandler
  } = useInput(validateEmail)
 
  const {
    text: password,
    shouldDisplayError: passwordHasError,
    textChangeHandler: passwordChangeHandler,
    inputBlurHandler: passwordBlurHandler,
    clearHandler: passwordClearHandler
  } = useInput(validatePasswordLength)

  const {
    text: confirmPassword,
    shouldDisplayError: confirmPasswordHasError,
    textChangeHandler: confirmPasswordChangeHandler,
    inputBlurHandler: confirmPasswordBlurHandler,
    clearHandler: confirmPasswordClearHandler
  } = useInput(validatePasswordLength)


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
    if (isMobile) setrealHeight(`${window.innerHeight}px`);
    else {
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
                minW="300px"
                w="24vw"
                src={Login_Logo}
              />
              <Box minW={{ md: "31vw" }} style={{ marginTop: "0" }}>
                <form onSubmit={handleSubmit}>
                  <Stack
                    w={{ base: "90vw", md: "auto" }}
                    spacing={5}
                    backgroundColor="whiteAlpha.900"
                    style={{ paddingBottom: "0" }}
                  >
                    <FormControl style={{ marginTop: "0" }}>
                      <Text className="letter-spacing-text poppins-text-label textPattern">
                        Nome
                      </Text>
                      <InputGroup style={{ alignItems: "center" }}>
                        <NomeInput
                          value={name}
                          onChange={nameChangeHandler}
                          onBlur={nameBlurHandler}
                          error={nameHasError}
                          helperText={nameHasError ? 'Escreva seu nome' : ''}
                        ></NomeInput>
                      </InputGroup>
                    </FormControl>
                    <FormControl style={{ marginTop: "0" }}>
                      <Text className="letter-spacing-text poppins-text-label textPattern">
                        Email
                      </Text>
                      <InputGroup>
                        <EmailInput
                          value={email}
                          onChange={emailChangeHandler}
                          onBlur={emailBlurHandler}
                          error={emailHasError}
                          helperText={emailHasError ? 'Escreva seu email' : ''}
                        ></EmailInput>
                      </InputGroup>
                    </FormControl>
                    <FormControl style={{ marginTop: "0" }}>
                      <Text className="letter-spacing-text poppins-text-label textPattern">
                        Senha
                      </Text>
                      <InputGroup style={{ alignItems: "center" }}>
                        <PasswordInput
                          value={password}
                          onChange={passwordChangeHandler}
                          onBlur={passwordBlurHandler}
                          error={passwordHasError}
                          helperText={passwordHasError ? 'Requer no mínimo 6 caracteres' : ''}
                        ></PasswordInput>
                      </InputGroup>
                    </FormControl>
                    <FormControl style={{ marginTop: "0" }}>
                      <Text className="letter-spacing-text poppins-text-label textPattern">
                        Repetir Senha
                      </Text>
                      <InputGroup style={{ alignItems: "center" }}>
                        <ConfirmPasswordInput
                          value={confirmPassword}
                          onChange={confirmPasswordChangeHandler}
                          onBlur={confirmPasswordBlurHandler}
                          error={confirmPassword.length > 0 && password !== confirmPassword}
                          helperText={confirmPassword.length > 0 && password !== confirmPassword ? 'Requer mínimo de 6 caracteres' : ''}
                        ></ConfirmPasswordInput>
                      </InputGroup>
                    </FormControl>
                    <Button
                      className="buttonSettings buttonFont"
                      type="submit"
                      variant="solid"
                      style={{
                        backgroundColor: "#0385FD",
                      }}
                    >
                      <Text
                        className="letter-spacing-button poppins-text-button"
                        fontSize="larger"
                      >
                        REGISTRAR
                      </Text>
                    </Button>
                    <Link href='/loginhublocal' style={{ textDecoration: "none"}}>
                      <Button
                        className="buttonSettings buttonFont"
                        variant="solid"
                        style={{
                          backgroundColor: "#00CC99",
                        }}
                      >
                        <Text
                          className="letter-spacing-button poppins-text-button"
                          fontSize="larger"
                        >
                          LOGAR
                        </Text>
                      </Button>
                    </Link>
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

export default Register;
