import React, { useEffect, useState } from "react";

import "./App.css";

import { Row, Navbar, Image, Button, Nav } from "react-bootstrap";

import logo from "./assets/icones/logo.svg";
import logoGmail from "./assets/icones/7.svg";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Helmet, HelmetProvider } from "react-helmet-async";

import { Routes, Route, useLocation } from "react-router-dom";

import RegisterHubLocal from "./pages/Register_HubLocal/Register";
import LoginHubLocal from "./pages/Login_HubLocal/Login";
import Hublocal from "./pages/Hublocal/Hublocal";
import Surprise from "./pages/Surprise/Surprise";

import { PrivateOutlet } from "./redux/shared/utils/PrivateOutlet";

import Mateus from "./pages/Mateus/Mateus";
//import Firebase from "./pages/Surprise/Surprise";

import "./pages/Login_HubLocal/Login.css";
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
  const [selectedLink, setSelectedLink] = useState("Home");
  const links = ["Home", "Portfolio", "Road Map", "Pricing", "Contact"];

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

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
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
    const { innerWidth, innerHeight } = window;
    return { innerWidth, innerHeight };
  }

  const convertMultiplyVwToPx = () => {
    return (windowSize.innerWidth / 100) * 14;
  };

  const SignFirebase = async () => {
    if (!signInStatus[1]) {
      signOut(auth)
        .then(() => {
          window.location.reload();
        })
        .catch((error) => {});
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

  const createButton = (buttonNumber: number, selected: boolean) => (
    <Button
      key={buttonNumber}
      variant="primary"
      size="sm"
      style={{
        width: "6px",
        height: "14px",
        marginBottom: "3vh",
        transform: "rotate(45deg)",
        backgroundColor: selected ? "red" : "#9b59b6",
        border: "none", // Remove the default button border
      }}
      // onClick={handleButtonClick(buttonNumber)}
    ></Button>
  );

  const buttons = Array.from({ length: 5 }).map((_, index) =>
    createButton(index + 1, links[index] === selectedLink),
  );

  const [title] = useState("Bem Vindo! 🤝");

  const { pathname } = useLocation();

  const isNavOn =
    pathname === "/hublocal" ||
    pathname === "/loginhublocal" ||
    pathname === "/registerhublocal";

  const handleLinkClick =
    (link: string) =>
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      event.preventDefault();
      setSelectedLink(link);
    };

  return (
    <>
      <HelmetProvider>
        <Helmet>
          <title>{title ? title : "No title"}</title>
        </Helmet>
      </HelmetProvider>
      {isNavOn ? null : (
        <Navbar
          className="border-gradient-green"
          style={{
            justifyContent: "space-between",
            height: "11vh",
            fontWeight: "600",
            paddingTop: "0px",
            paddingBottom: "0px",
            marginInline: "0px",
            marginTop: "0.1vh",
            marginBottom: "0",
          }}
        >
          <Image
            src={logo}
            style={{
              marginLeft: `${convertMultiplyVwToPx()}px`,
              marginRight: "20px",
              marginTop: "0.5vh",
              borderRadius: "20%",
              width: "8.5vh",
              height: "8.5vh",
            }}
          />
          {!isMobile ? (
            // Render Nav element and Nav.Link elements for non-mobile devices
            <>
              <Nav id="nav-dropdown">
                {links.map((link) => (
                  <Nav.Link
                    key={link}
                    className={`nav-link-custom ${
                      selectedLink === link ? "active" : ""
                    }`}
                    href={`#${link.toLowerCase()}`}
                    onClick={handleLinkClick(link)}
                  >
                    {link}
                  </Nav.Link>
                ))}
              </Nav>
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
              >
                <Row className="m-0 ps-0 pe-0" style={{ alignItems: "center" }}>
                  <Image
                    src={logoGmail}
                    style={{
                      width: "calc(15px + 0.3vw)",
                      margin: "0",
                      padding: "0",
                      height: "100%",
                    }}
                  ></Image>
                  &nbsp;&nbsp;{signInStatus}
                </Row>
              </Button>
            </>
          ) : null}
        </Navbar>
      )}
      <Routes>
        <Route path="/" element={<Mateus />} />

        {/* public routes */}
        <Route path="/registerhublocal" element={<RegisterHubLocal />} />
        <Route path="/loginhublocal" element={<LoginHubLocal />} />
        <Route path="/surprise" element={<Surprise />} />

        <Route path="/hublocal" element={<PrivateOutlet />}>
          {/* protected routes */}
          <Route index element={<Hublocal />} />
        </Route>
      </Routes>
      {!isMobile ? (
        <div
          style={{
            position: "fixed",
            bottom: "10px",
            right: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            marginBottom: "8vh",
            marginRight: "3vw",
          }}
        >
          {buttons}
        </div>
      ) : null}
      <ToastContainer />
    </>
  );
}

export default App;
