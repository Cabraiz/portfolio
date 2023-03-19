import { useSelector } from "react-redux"
import { selectCurrentUser, selectCurrentToken } from "../../redux/feature/auth/authSlice"
import Perfil_Image from "../../images/HubLocal/Perfil_Image.png";
import { Link } from "react-router-dom";

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


const Hublocal = () => {
    const user = useSelector(selectCurrentUser)
    const token = useSelector(selectCurrentToken)

    const welcome = user ? `Welcome ${user}!` : 'Welcome!'
    const tokenAbbr = `${token?.slice(0, 9)}...`

    const content = (
        <section className="welcome">

        </section>
    )
    return (
        <Flex
            flexDirection="row"
            backgroundColor="white"
            justifyContent="space-between"
        >
            <Stack
                justifyContent="center"
                alignItems="center"
                w="auto"
                h="9.6vh"
            >
            <Box w="auto" style={{ backgroundColor: "#00CC99", alignItems: "center", padding: "2vh 2vw 2vh 2vw" }}>
                <Grid className="column" autoFlow='column'>
                    <GridItem style={{paddingRight: "10px"}}>
                        <Image
                            objectFit="cover"
                            borderRadius='full'
                            h="40px"
                            src={Perfil_Image}
                        />
                    </GridItem>
                    <GridItem style={{paddingRight: "10px"}}>
                        <Text fontSize='x-large' className="frase-imagem-logo">Nome</Text>
                    </GridItem>
                    <GridItem>
                        <Text fontSize='smaller' className="subfrase-imagem-logo letter-spacing-text ">Ola</Text>
                    </GridItem>
                </Grid>
            </Box>
            </Stack>
            <Box w="auto" style={{ backgroundColor: "#00CC99", alignItems: "center", padding: "2vh 2vw 2vh 2vw" }}>
                <Grid className="column" autoFlow='column'>
                    <GridItem style={{paddingRight: "10px"}}>
                        <Image
                            objectFit="cover"
                            borderRadius='full'
                            h="40px"
                            src={Perfil_Image}
                        />
                    </GridItem>
                    <GridItem style={{paddingRight: "10px"}}>
                        <Text fontSize='x-large' className="frase-imagem-logo">Nome</Text>
                    </GridItem>
                    <GridItem>
                        <Text fontSize='smaller' className="subfrase-imagem-logo letter-spacing-text ">Ola</Text>
                    </GridItem>
                </Grid>
                
                
                
            </Box> 
        </Flex>
    )
}
export default Hublocal;