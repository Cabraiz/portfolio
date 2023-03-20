import React, { useEffect, useState } from "react";

import "./App.css";

import { Row, Navbar, Image, Button } from "react-bootstrap";

import logo from "./images/icones/logo.svg";
import logoGmail from "./images/icones/7.svg";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Helmet, HelmetProvider } from "react-helmet-async";

import { Routes, Route, useLocation } from "react-router-dom";

import LoginHubLocal from "./pages/Login_Hublocal/Login";
import Hublocal from "./pages/Hublocal/Hublocal";

import { PrivateOutlet } from './redux/utils/PrivateOutlet'
import RequireAuth from "./redux/feature/auth/RequireAuth";

import Mateus from "./pages/Mateus/Mateus";
//import Firebase from "./pages/Surprise/Surprise";

import "./pages/Mateus/Mateus.css";
import "./pages/Surprise/Surprise.css";

import { isMobile } from "react-device-detect";
import { db, auth, provider } from "./Firebase/Firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";

import { Box, Center, VStack } from '@chakra-ui/react'

function App() {  
  const [windowSize, setWindowSize] = useState(getWindowSize());
  const [signInStatus, setsignInStatus] = useState(["", false]);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setsignInStatus(["Sign Out", false]);
      } else {
        setsignInStatus(["Sign In With Google", true]);
      }
    });

    function handleWindowResize() {
      setWindowSize(getWindowSize());
    }

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  function getStringValue(value: any): string {
    return String(value);
  }

  const addTodo = async () => {
    const temp = getStringValue(auth.currentUser?.uid);
    const docRef = doc(db, temp, "bloqueados");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      if (temp !== undefined) {
        await setDoc(doc(db, temp, "bloqueados"), {
          0: false,
          1: false,
          2: false,
          3: false,
          4: false,
          5: false,
        });
      }
    }
  };

  function getWindowSize() {
    const {innerWidth, innerHeight} = window;
    return {innerWidth, innerHeight};
  }

  const convertMultiplyVwToPx = () => {
    let temp;
    if(!isMobile)
      temp = (windowSize.innerWidth / 100) * 14;
    else
      temp = (windowSize.innerWidth / 100) * 14;
    return temp;
  };

  const SignFirebase = async () => {
    if (!signInStatus[1]) {
      signOut(auth)
        .then(() => {
          window.location.reload();
        })
        .catch((error) => {
        });
    } else {
      if (!isMobile) {
        signInWithRedirect(auth, provider)
          .then((result: any) => {
            AfterSignIn(true);
          })
          .catch((error) => {
            AfterSignIn(false);
          });
      } else {
        signInWithPopup(auth, provider)
          .then((result: any) => {
            AfterSignIn(true);
          })
          .catch((error) => {
            AfterSignIn(false, error);
          });
      }
    }
  };

  const AfterSignIn = (b: boolean, e?: any) => {
    if (b) {
      addTodo();
    } else {
      const errorMessage = e.message;
      const email = e.customData.email;
    }
  };

  const [title] = useState("Bem Vindo! 🤝");
  const [site, setSite] = useState<string>("");

  const { pathname } = useLocation();

  return (
    <>
      <HelmetProvider>
        <Helmet>
          <title>{title ? title : "No title"}</title>
        </Helmet>
      </HelmetProvider>
      { pathname === "/hublocal" || "/LoginHubLocal" ? null : <Navbar
        className="border-gradient-green"
        style={{
          justifyContent: "space-between",
          height: "11vh",
          fontWeight: "600",
          marginInline: "0px",
          marginTop: "0.1vh",
          marginBottom: "0",
          paddingTop: "0.5vh",
        }}
      >
        <Image
          src={logo}
          style={{
            marginTop: "0.5vh",
            borderRadius: "20%",
            marginLeft: `${convertMultiplyVwToPx()}px`,
            width: "8.5vh",
            height: "8.5vh",
          }}
        />
        <Button
          style={{
            marginRight: "4vw",
            width: "auto",
            height: "6vh",
            fontSize: "1rem",
            backgroundColor: "white",
            color: "rgba(100, 100, 100)",
            fontWeight: "500",
            borderColor: "white",
          }}
          onClick={SignFirebase}
        ><Row className="m-0 ps-0 pe-0" style={{alignItems: "center",}}>
            <Image
              src={logoGmail}
              style={{
                width: "calc(15px + 0.3vw)",
                margin: "0",
                padding: "0",
                height: "100%",
              }}
            ></Image>&nbsp;&nbsp;{signInStatus}
          </Row>
        </Button>
      </Navbar> }
      <Routes>
        {/* public routes */}
        <Route path="/LoginHubLocal" element={<LoginHubLocal />} />
        <Route path="/Mateus" element={<Mateus />} />

        <Route path="/" element={<PrivateOutlet />}>
          
          {/* protected routes */}
          <Route index element={<Hublocal />} />

        </Route>
      </Routes>
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
    </>
  );
}

export default App;
