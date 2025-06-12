import React, { useEffect, useState, FormEvent, JSX } from "react";

import Login_Logo from "../../assets/HubLocal/Login_Logo.webp";
import Login_Image from "../../assets/HubLocal/Login_Image.webp";

import { toast } from "react-toastify";

import { Button, Stack, Box, Text, Link } from "@chakra-ui/react";

import { FaLock } from "react-icons/fa";
import "./login.css";

import { useLoginMutation } from "../../redux/feature/auth/authApiSlice";

import { isMobile } from "react-device-detect";

import {
  ModeloLadoEsquerdoPage,
  ModeloLadoDireitoPage,
  LoadingPage,
} from "../Auxiliadores/ModeloJSXPage";
import { validatePasswordLength } from "../../redux/shared/utils/validation/lenght";
import { validateEmail } from "../../redux/shared/utils/validation/email";
import useInput from "../../redux/hooks/input/use-input";
import { RegisterParams } from "../Auxiliadores/models/ModeloJSXPage.interface";

import { Field, Input } from "@chakra-ui/react";
import { FaUserAlt } from "react-icons/fa";
import { chakra } from "@chakra-ui/react";

function PasswordInput({
  value,
  onChange,
  onBlur,
  error,
  helperText,
}: RegisterParams) {
  const Icon = chakra(FaLock);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Field.Root
      id="password"
      required
      invalid={error}
      className="input-pattern"
    >
      <Field.Label className="letter-spacing-text poppins-text-label text-pattern">
        Senha
      </Field.Label>

      <Box position="relative">
        <Input
          name="password"
          id="password"
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Mínimo de 6 caracteres"
          className="input-setting"
          paddingLeft="2.5rem"
          paddingRight="5rem"
        />
        <Box
          position="absolute"
          left="0.75rem"
          top="50%"
          transform="translateY(-50%)"
        >
          <Icon color="gray.300" boxSize="20px" />
        </Box>
        <Box
          position="absolute"
          right="0.5rem"
          top="50%"
          transform="translateY(-50%)"
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </Button>
        </Box>
      </Box>

      {error && <Field.ErrorText>{helperText}</Field.ErrorText>}
    </Field.Root>
  );
}

function EmailInput({
  value,
  onChange,
  onBlur,
  error,
  helperText,
}: RegisterParams) {
  const Icon = chakra(FaUserAlt);

  return (
    <Field.Root id="email" required invalid={error} className="input-pattern">
      <Field.Label className="letter-spacing-text poppins-text-label text-pattern">
        Email
      </Field.Label>

      <Box position="relative">
        <Input
          name="email"
          id="email"
          type="text"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="input-setting"
          paddingLeft="2.5rem"
        />
        <Box
          position="absolute"
          left="0.75rem"
          top="50%"
          transform="translateY(-50%)"
        >
          <Icon color="gray.300" boxSize="20px" />
        </Box>
      </Box>

      {error && <Field.ErrorText>{helperText}</Field.ErrorText>}
    </Field.Root>
  );
}

function Login() {
  const [login, { isLoading }] = useLoginMutation();

  const [realHeight, setrealHeight] = useState("");

  const [isAnimationSet, setAnimationSet] = useState(false);

  const {
    text: email,
    shouldDisplayError: emailHasError,
    textChangeHandler: emailChangeHandler,
    inputBlurHandler: emailBlurHandler,
    clearHandler: emailClearHandler,
  } = useInput(validateEmail);

  const {
    text: password,
    shouldDisplayError: passwordHasError,
    textChangeHandler: passwordChangeHandler,
    inputBlurHandler: passwordBlurHandler,
    clearHandler: passwordClearHandler,
  } = useInput(validatePasswordLength);

  useEffect(() => {
    setAnimationSet(true);
  }, []);

  useEffect(() => {
    if (isMobile) setrealHeight(`${window.innerHeight}px`);
    else {
      setrealHeight("100vh");
    }
  }, [realHeight]);

  const clearForm = () => {
    emailClearHandler();
    passwordClearHandler();
  };

  const ErrorNotify = (message: string) =>
    toast.warn(message, {
      position: isMobile ? "top-center" : "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: string[] = [];

    console.log(emailHasError, passwordHasError);
    if (emailHasError || passwordHasError) {
      errors.push("Preencha campos corretamente");
    }

    if (email.length === 0 || password.length === 0) {
      errors.push("Preencha todos os campos");
    }

    if (errors.length > 0) {
      ErrorNotify(errors[0]);
      return;
    }

    console.log("USER: ", email, password);

    clearForm();
  };

  const content: JSX.Element = isLoading ? (
    <LoadingPage />
  ) : (
    <Box minW={{ md: "31vw" }} style={{ marginTop: "0" }}>
      <form onSubmit={handleSubmit} autoComplete="off">
        <Stack
          w={{ base: "90vw", md: "auto" }}
          gap={3}
          backgroundColor="whiteAlpha.900"
          style={{ paddingBottom: "0" }}
        >
          <EmailInput
            value={email}
            onChange={emailChangeHandler}
            onBlur={emailBlurHandler}
            error={emailHasError}
            helperText={emailHasError ? "Email inválido" : ""}
          />

          <PasswordInput
            value={password}
            onChange={passwordChangeHandler}
            onBlur={passwordBlurHandler}
            error={passwordHasError}
            helperText={passwordHasError ? "Requer no mínimo 6 caracteres" : ""}
          />

          <Button
            className="button-settings button-font"
            type="submit"
            variant="solid"
            style={{
              backgroundColor: "#0385FD",
              marginTop: "3vh",
              marginBottom: "1vh",
              boxShadow: "0px 2px 2px 0px #00000040",
            }}
          >
            <Text
              className="letter-spacing-button poppins-text-button"
              fontSize="larger"
            >
              LOGAR
            </Text>
          </Button>

          <Link href="/registerhublocal" style={{ textDecoration: "none" }}>
            <Button
              className="button-settings button-font"
              variant="solid"
              style={{
                backgroundColor: "#00CC99",
                boxShadow: "0px 2px 2px 0px #00000040",
                width: "100%",
              }}
            >
              <Text
                className="letter-spacing-button poppins-text-button"
                fontSize="larger"
              >
                CRIAR CONTA
              </Text>
            </Button>
          </Link>
        </Stack>
      </form>
    </Box>
  );

  return ModeloLadoEsquerdoPage({
    realHeight,
    isAnimationSet,
    Login_Image,
    Login_Logo,
    JSX: content,
  });
}

export default Login;
