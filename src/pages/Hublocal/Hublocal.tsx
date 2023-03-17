import React, { useRef, useEffect, useState } from "react";

import {
    Flex,
    Heading,
    Input,
    Button,
    InputGroup,
    Stack,
    InputLeftElement,
    chakra,
    Box,
    Avatar,
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


    return (
        <Flex
      flexDirection="column"
      width="50vw"
      height="100vh"
      backgroundColor="white"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        flexDir="column"
        mb="2"
        justifyContent="center"
        alignItems="center"
      >
        <Avatar bg="teal.500" />
        <Heading color="teal.400">Welcome</Heading>
        <Box minW={{ base: "90%", md: "30vw" }}>
          <form>
            <Stack
              spacing={4}
              p="1rem"
              backgroundColor="whiteAlpha.900"
            >
              <FormControl >
                <Text fontSize='md' style={{letterSpacing: "0.8px", fontWeight: "500", paddingBottom: "5px"}}>Email</Text>
                <InputGroup>
                  <InputLeftElement
                    height="100%"
                    pointerEvents="none"
                    children={<CFaUserAlt color="gray.300" />}
                  />
                  <Input type="email" placeholder="email address" size='lg' style={{borderColor: "#0385FD", borderWidth: "2px"}} />
                </InputGroup>
              </FormControl>
              <FormControl style={{marginTop: "1vh"}}>
                <Text fontSize='md' style={{letterSpacing: "0.8px", fontWeight: "500", padding: "0 0 5px 0"}}>Senha</Text>
                <InputGroup style={{alignItems: "center"}}>
                  <InputLeftElement
                    height="100%"
                    pointerEvents="none"
                    children={<CFaLock color="gray.300" />}
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    size='lg'
                    style={{borderColor: "#0385FD", borderWidth: "2px"}}
                  />
                  <InputRightElement width="4.5rem" height="100%">
                    <Button h="1.75rem" size="sm" onClick={handleShowClick}>
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Button
                type="submit"
                variant="solid"
                height="7vh"
                width="full"
                size='lg'
                style={{backgroundColor: "#0385FD", color: "#FFFFFF", letterSpacing: "0.8px", fontWeight: "700"}}
              >
              <Text fontSize='md' style={{letterSpacing: "0.8px", fontWeight: "700"}}>LOGAR</Text>
              </Button>
              <Button
                type="submit"
                variant="solid"
                height="7vh"
                width="full"
                size='lg'
                style={{backgroundColor: "#00CC99", color: "#FFFFFF", letterSpacing: "0.8px", fontWeight: "700"}}
              >
              <Text fontSize='md' style={{letterSpacing: "0.8px", fontWeight: "700"}}>CRIAR CONTA</Text>
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Flex>
    )

}

export default Hublocal;
