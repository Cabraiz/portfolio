import React, { useEffect, useState } from "react";

import "./App.css";
import "./fonts/Brutal/Brutal-Type-Medium.ttf";

import { Navbar, Image, Button } from "react-bootstrap";

import logo from "./images/icones/logo.svg";
import logoGmail from "./images/icones/7.svg";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Helmet, HelmetProvider } from "react-helmet-async";

import { Routes, Route } from "react-router-dom";
//import May from "./pages/May/May";
import Mateus from "./pages/Mateus/Mateus";
import Surprise from "./pages/Surprise/Surprise";

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

  const convertVwToPx = (a: number) => {
    const oneVhInPx = window.innerWidth / 100;
    let temp = oneVhInPx * a;
    temp = temp * temp;
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
  return (
    <>
      <HelmetProvider>
        <Helmet>
          <title>{title ? title : "No title"}</title>
        </Helmet>
      </HelmetProvider>
      <Navbar
        className="border-gradient-green"
        style={{
          justifyContent: "space-between",
          height: "auto",
          fontWeight: "600",
          marginInline: "0px",
          marginTop: "0.1vh",
          paddingTop: "0.5vh",
          paddingBottom: "0.5vh",
          paddingInline: "0px",
        }}
      >
        <Image
          src={logo}
          style={{
            borderRadius: "20%",
            marginLeft: `${convertVwToPx(1.2)}px`,
            width: "9vh",
            height: "9vh",
          }}
        />
        <Button
          style={{
            paddingTop: "1.1vh",
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
        >
          <Image
            src={logoGmail}
            style={{
              marginTop: "-0.5vh",
              width: "calc(15px + 0.3vw)",
              height: "100%",
            }}
          ></Image>
          &nbsp; {signInStatus}
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
