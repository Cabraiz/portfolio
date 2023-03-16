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
    Link,
    Avatar,
    FormControl,
    FormHelperText,
    InputRightElement
} from "@chakra-ui/react";
import { FaUserAlt, FaLock } from "react-icons/fa";

import{ useDispatch } from 'react-redux';
import{ useNavigate } from 'react-router-dom';  

import "./Hublocal.css";

import { tokenReceived } from '../../redux/feature/auth/authSlice';
import { LoginRequest, useLoginMutation } from '../../redux/app/services/auth';


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
      width="100wh"
      height="100vh"
      backgroundColor="gray.200"
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
        <Box minW={{ base: "90%", md: "468px" }}>
          <form>
            <Stack
              spacing={4}
              p="1rem"
              backgroundColor="whiteAlpha.900"
              boxShadow="md"
            >
              <FormControl>
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    children={<CFaUserAlt color="gray.300" />}
                  />
                  <Input type="email" placeholder="email address" />
                </InputGroup>
              </FormControl>
              <FormControl>
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    color="gray.300"
                    children={<CFaLock color="gray.300" />}
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                  />
                  <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={handleShowClick}>
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormHelperText textAlign="right">
                  <Link>forgot password?</Link>
                </FormHelperText>
              </FormControl>
              <Button
                borderRadius={0}
                type="submit"
                variant="solid"
                colorScheme="teal"
                width="full"
              >
                Login
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>
      <Box>
        New to us?{" "}
        <Link color="teal.500" href="#">
          Sign Up
        </Link>
      </Box>
    </Flex>
    )

}

export default Hublocal;
