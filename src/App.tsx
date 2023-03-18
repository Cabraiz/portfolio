import React, { useEffect, useState } from "react";

import "./App.css";
import "./fonts/Brutal/Brutal-Type-Medium.ttf";

import { Row, Navbar, Image, Button } from "react-bootstrap";

import logo from "./images/icones/logo.svg";
import logoGmail from "./images/icones/7.svg";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Helmet, HelmetProvider } from "react-helmet-async";

import { Routes, Route, useLocation, Link } from "react-router-dom";

import Hublocal from "./pages/Hublocal/Hublocal";

import Mateus from "./pages/Mateus/Mateus";
import Firebase from "./pages/Surprise/Surprise";

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

function App() {  
  const [windowSize, setWindowSize] = useState(getWindowSize());
  const [signInStatus, setsignInStatus] = useState(["", false]);

  useEffect(() => {
    //const response = async () => {
    //  await signInWithRedirect(auth, provider);
    //};
    onAuthStateChanged(auth, (user) => {
      if (user) {
        //setUser(auth.currentUser);
        setsignInStatus(["Sign Out", false]);
        //const uid = user.uid;
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
          // Sign-out successful.
          window.location.reload();
        })
        .catch((error) => {
          // An error happened.
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
      //window.location.reload();
      // This gives you a Google Access Token. You can use it to access the Google API.
      //const credential = GoogleAuthProvider.credentialFromResult(result);
      //const token = credential?.accessToken;
      // The signed-in user info.
      //setUser(result.user);
      // IdP data available using getAdditionalUserInfo(result)
    } else {
      //const errorCode = e.code;
      const errorMessage = e.message;
      // The email of the user's account used.
      const email = e.customData.email;
    }
  };

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

  const { pathname } = useLocation();

  return (
    <>
      <HelmetProvider>
        <Helmet>
          <title>{title ? title : "No title"}</title>
        </Helmet>
      </HelmetProvider>
      { pathname === "/hublocal" ? null : <Navbar
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
        <Route path="/" element={<Mateus />} />
        <Route path="/firebase" element={<Firebase />} />

        {/* protected routes */}
        <Route path="/hublocal" element={<Hublocal />} />
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
