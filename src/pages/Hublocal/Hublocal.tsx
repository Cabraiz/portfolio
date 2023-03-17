import React, { useRef, useEffect, useState } from "react";

import Login_Logo from "../../images/HubLocal/Login_Logo.png";
import Login_Image from "../../images/HubLocal/Login_Image.png";

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
    InputRightElement
} from "@chakra-ui/react";
import { FaUserAlt, FaLock } from "react-icons/fa";

import{ useDispatch } from 'react-redux';
import{ useNavigate } from 'react-router-dom';  

import "./Hublocal.css";

import { tokenReceived } from '../../redux/feature/auth/authSlice';
import { LoginRequest, useLoginMutation } from '../../redux/app/services/auth';
import { Buttons } from "@testing-library/user-event/dist/types/system/pointer/buttons";


function Hublocal() {

    const CFaUserAlt = chakra(FaUserAlt);
    const CFaLock = chakra(FaLock);

    const [showPassword, setShowPassword] = useState(false);

    const handleShowClick = () => setShowPassword(!showPassword);

    const [formState, setFormState] = React.useState<LoginRequest>({
        username: '',
        password: '',
    })

    const userRef = useRef<HTMLDivElement>(null)
    const errRef = useRef<HTMLDivElement>(null)
    const [user, setUser] = useState ('')
    const [pwd, setPwd] = useState('')
    const [errMsg, setErrMsg] = useState('')
    const navigate = useNavigate ()

    const [login, { isLoading }] = useLoginMutation()
    const dispatch = useDispatch()

    useEffect(() => {
        const node = userRef.current
        node?.focus();
    },[])

    useEffect(() => {
        setErrMsg('')
    },[user, pwd])
 
    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        
        try{
            const userData = await login(formState).unwrap()
            dispatch(tokenReceived({ ...userData, user }))
            setUser('')
            setPwd('')
            navigate('/welcome')

        }catch (err: any) {
            const response = err?.response.status;
            if(!err?.response) {
                setErrMsg('No Sever Response')
            } else if (response === 400){
                setErrMsg('Missing Usarname or Password')
            } else if (response === 401){
                setErrMsg('Unauthorized')
            } else {
                setErrMsg('Login Failed')
            }
            const node = errRef.current
            node?.focus();
        }
    }

    const handleUserInput = (e: { target: { value: React.SetStateAction<string>; }; }) => setUser(e.target.value);

    const handlePwdInput = (e: { target: { value: React.SetStateAction<string>; }; }) => setUser(e.target.value);

    const textoTitle = "Junte-se a vários clientes satisfeitos."
    const textoSubtitle = "Cliente HubLocal ganha mais relevância, autoridade e visibilidade. Mais de 7.000 marcas confiam na nossa plataforma. Seja uma delas!"


    return (
      <Flex
        flexDirection="column"
        backgroundColor="white"
      >
      <Grid templateColumns='repeat(2, 1fr)' gap={0}>
        <GridItem h="100vh" w="50vw" style={{backgroundColor: "#0485FF"}}>
          <Stack h="100vh" w="50vw"
            justifyContent="center"
            alignItems="center"
          >
          <Image
            h="90vh"
            paddingTop="14vh"
            objectFit="cover"
            src={Login_Image}
          />
          <Box h="auto" style={{ backgroundColor: "#00CC99", width: "50vw", marginTop: "0", padding: "2.2vh 5.5vw 2.2vh 5.5vw", alignItems: "center" }}>
            <Text fontSize='x-large' className="frase-imagem-logo" style={{ padding: "0 3vw 1vh 3vw" }}>{textoTitle}</Text>
            <Text fontSize='smaller' className="subfrase-imagem-logo letter-spacing-text ">{textoSubtitle}</Text>
          </Box>
          </Stack>
        </GridItem>  
        <GridItem>
          <Stack h="100vh" w="50vw"
            justifyContent="center"
            alignItems="center"
          >
            <Image
              padding="0 1vw 0 1vw"
              minWidth="200px"
              w="23vw"
              src={Login_Logo}
            />
            <Box minW={{ base: "90%", md: "30vw" }}>
              <form>
                <Stack
                  spacing={4}
                  p="1rem"
                  backgroundColor="whiteAlpha.900"
                >
                  <FormControl >
                    <Text fontSize='sm' className="letter-spacing-text poppins-text-label" style={{ paddingBottom: "5px"}}>Email</Text>
                    <InputGroup>
                      <InputLeftElement
                        h="100%"
                        pointerEvents="none"
                        children={<CFaUserAlt color="gray.300" />}
                      />
                      <Input type="email" placeholder="E-mail" size='lg' style={{borderColor: "#0385FD", borderWidth: "2px"}} />
                    </InputGroup>
                  </FormControl>
                  <FormControl style={{marginTop: "1vh"}}>
                    <Text fontSize='sm' className="letter-spacing-text poppins-text-label" style={{ padding: "0 0 5px 0"}}>Senha</Text>
                    <InputGroup style={{alignItems: "center"}}>
                      <InputLeftElement
                        h="100%"
                        pointerEvents="none"
                        children={<CFaLock color="gray.300" />}
                      />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Senha"
                        size='lg'
                        style={{borderColor: "#0385FD", borderWidth: "2px"}}
                      />
                      <InputRightElement width="5rem" height="100%">
                        <Button h="1.75rem" size="sm" onClick={handleShowClick}>
                          {showPassword ? "Ocultar" : "Mostrar"}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                  <Button
                    className="letter-spacing-text"
                    type="submit"
                    variant="solid"
                    h="7vh"
                    w="full"
                    size='lg'
                    style={{backgroundColor: "#0385FD", color: "#FFFFFF",  fontWeight: "700"}}
                  >
                  <Text className="letter-spacing-button poppins-text-button" fontSize='md'>LOGAR</Text>
                  </Button>
                  <Button
                    type="submit"
                    variant="solid"
                    h="7vh"
                    w="full"
                    size='lg'
                    style={{backgroundColor: "#00CC99", color: "#FFFFFF",  fontWeight: "700"}}
                  >
                  <Text className="letter-spacing-button poppins-text-button" fontSize='md' >CRIAR CONTA</Text>
                  </Button>
                </Stack>
              </form>
            </Box>
          </Stack>
        </GridItem>
      </Grid>
    </Flex>
    )

}

export default Hublocal;
