import React, { useRef, useEffect, useState } from "react";

import{ useDispatch } from 'react-redux';
import{ useNavigate } from 'react-router-dom';

import "./Hublocal.css";

import { tokenReceived } from '../../redux/feature/auth/authSlice';
import { useLoginMutation } from '../../redux/app/services/auth';

function Hublocal() {
    const userRef = useRef()
    const errRef = useRef ()
    const [user, setUser] = useState ('')
    const [pwd, setPwd] = useState('')
    const [errMsg, setErrMsg] = useState('')
    const navigate = useNavigate ()

    const [login, { isLoading }] = useLoginMutation()
    const dispatch = useDispatch()

    useEffect(() => {
        userRef.current.focus()
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
            navigate('welcome')

        }catch (err) {

        }
    }

    return (
        <div>Login</div>
    )

}

export default Hublocal;
