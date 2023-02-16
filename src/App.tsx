import React, { useEffect, useState } from "react";

import "./App.css";
import "./fonts/Brutal/Brutal-Type-Medium.ttf";

import { Navbar, Row, Image, Button } from "react-bootstrap";

import logo from "./images/icones/logo.svg";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Helmet, HelmetProvider } from "react-helmet-async";

import { Routes, Route } from "react-router-dom";
import May from "./pages/May/May";
import Mateus from "./pages/Mateus/Mateus";
import Surprise from "./pages/Surprise/Surprise";

import "./pages/Mateus/Mateus.css";
import "./pages/Surprise/Surprise.css";

import { isMobile } from "react-device-detect";
import { auth, provider } from "./Firebase/Firebase";
import { signInWithPopup } from "firebase/auth";

function App() {
  const [value, setValue] = useState("");
  const SignInWithFirebase = () => {
    if (isMobile) {
      signInWithPopup(auth, provider)
        .then((result) => {
          // This gives you a Google Access Token. You can use it to access the Google API.
          //const credential = GoogleAuthProvider.credentialFromResult(result);
          //const token = credential?.accessToken;
          // The signed-in user info.
          //const user = result.user;
          // IdP data available using getAdditionalUserInfo(result)
        })
        .catch((error) => {
          // Handle Errors here.
          const errorCode = error.code;
          const errorMessage = error.message;
          // The email of the user's account used.
          const email = error.customData.email;
          // The AuthCredential type that was used.
          //const credential = GoogleAuthProvider.credentialFromError(error);
          // ...
        });
    } else {
      signInWithPopup(auth, provider)
        .then((result) => {
          // This gives you a Google Access Token. You can use it to access the Google API.
          //const credential = GoogleAuthProvider.credentialFromResult(result);
          //const token = credential?.accessToken;
          // The signed-in user info.
          //const user = result.user;
          // IdP data available using getAdditionalUserInfo(result)
        })
        .catch((error) => {
          // Handle Errors here.
          const errorCode = error.code;
          const errorMessage = error.message;
          // The email of the user's account used.
          const email = error.customData.email;
          // The AuthCredential type that was used.
          //const credential = GoogleAuthProvider.credentialFromError(error);
          // ...
        });
    }
  };

  useEffect(() => {
    //setValue(localStorage.getItem("email"));
  }, []);

  const [title] = useState("Bem Vindo! 🤝");
  const [site, setSite] = useState<string>("");

  let urlPattern = new RegExp(
    "^(https?:\\/\\/)?" + // validate protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );

  const notifySucesso = () => {
    toast.success("🦄 Website é Website", {
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
    toast.warning("❌ Website Não é Website", {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleBlur() {
    //VALIDAÇÃO
    if (/[A-Za-z0-9]/.test(site) && !site.startsWith("www.")) {
      let aux = site;
      while (!/[A-Za-z0-9]/.test(aux.charAt(0))) {
        aux = aux.substring(1);
      }
      setSite("www." + aux);
    }
    //VALIDAÇÃO
    if (urlPattern.test(site)) {
      notifySucesso();
    } else {
      notifyError();
    }
  }
  return (
    <>
      <HelmetProvider>
        <Helmet>
          <title>{title ? title : "No title"}</title>
        </Helmet>
      </HelmetProvider>
      <Navbar
        style={{
          justifyContent: "space-between",
          height: "10vh",
          fontWeight: "600",
          marginRight: "5vw",
          marginTop: "2vh",
          margin: "0px",
          padding: "0px",
        }}
      >
        <Image
          src={logo}
          style={{
            borderRadius: "20%",
            marginLeft: "14vw",
            width: "8vh",
            height: "8vh",
          }}
        />
        <Button
          style={{
            marginRight: "4vw",
            width: "13vw",
            height: "6vh",
            fontSize: "1rem",
            backgroundColor: "white",
            color: "gray",
            fontWeight: "500",
            borderColor: "white",
          }}
          onClick={SignInWithFirebase}
        >
          {" "}
          Sign in with Google{" "}
        </Button>
      </Navbar>
      <Routes>
        <Route path="/" element={<Mateus />} />
        <Route path="/aniver" element={<Surprise />} />
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
