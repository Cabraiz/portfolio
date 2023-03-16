import React, { useRef, useEffect, useState } from "react";

import{ useDispatch } from 'react-redux';
import{ useNavigate } from 'react-router-dom';

import "./Hublocal.css";

import { tokenReceived } from '../../redux/feature/auth/authSlice';
import { useLoginMutation } from '../../redux/app/services/auth';

function Hublocal() {
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
 
    const handleSubmit = async (e) => {
        e.preventDefault()

        try{
            const userData = await login({ user, pwd }).unwrap()
            dispatch(tokenReceived({ ...userData, user }))
            setUser('')
            setPwd('')
            navigate('/welcome')

        }catch (err) {
            if(!err?.response) {
                setErrMsg('No Sever Response')
            } else if (!err.response?.status === 400){
                setErrMsg('Missing Usarname or Password')
            } else if (!err.response?.status === 401){
                setErrMsg('Unauthorized')
            } else {
                setErrMsg('Login Failed')
            }
            const node = errRef.current
            node?.focus();
        }
    }

    return (
        <div>Login</div>
    )

}

export default Hublocal;
