import React, { useRef, useEffect, useState } from "react";

import{ useDispatch } from 'react-redux';
import{ useNavigate } from 'react-router-dom';

import "./Hublocal.css";

import { tokenReceived } from '../../redux/feature/auth/authSlice';
import { LoginRequest, useLoginMutation } from '../../redux/app/services/auth';


function Hublocal() {

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
        <div>Login</div>
    )

}

export default Hublocal;
