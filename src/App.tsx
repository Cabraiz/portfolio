
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "./App.css";
import "./pages/LoginHubLocal/login.css";
import "./pages/Mateus/Mateus.css";
import "./pages/Surprise/Surprise.css";

import { Row, Navbar, Image, Button, Nav } from "react-bootstrap";

import logo from "./assets/icones/logo.svg";
import logoGmail from "./assets/icones/7.svg";

import "react-toastify/dist/ReactToastify.css";


import RegisterHubLocal from "./pages/RegisterHubLocal/Register";
import LoginHubLocal from "./pages/LoginHubLocal/login";
import Hublocal from "./pages/Hublocal/Hublocal";
import Surprise from "./pages/Surprise/Surprise";
import Resume from "./pages/Resume/Resume";
import Doris from "./pages/Doris.mobi/principal";
import CasaNova from "./pages/CasaNova/CasaNova";


import { PrivateOutlet } from "./redux/shared/utils/PrivateOutlet";

import Mateus from "./pages/Mateus/Mateus";
import LiveAnimation from "./pages/PrincipalPage/Animation/live_animation";
import TitleWebsite from "./pages/PrincipalPage/TitleWebsite/title_website";

import { isMobile } from "react-device-detect";

function App() {
  const [windowSize, setWindowSize] = useState(getWindowSize());
  const [signInStatus] = useState(["", false]);
  const [selectedLink, setSelectedLink] = useState("Home");
  const links = ["Home", "Portfolio", "Road Map", "Pricing","Live", "Contact"];

  useEffect(() => {
    function handleWindowResize() {
      setWindowSize(getWindowSize());
    }

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  function getWindowSize() {
    const { innerWidth, innerHeight } = window;
    return { innerWidth, innerHeight };
  }

  const convertMultiplyVwToPx = () => {
    return (windowSize.innerWidth / 100) * 14;
  };

  const createButton = (buttonNumber: number, selected: boolean) => (
    <Button
      key={buttonNumber}
      variant="primary"
      size="sm"
      style={{
        width: selected ? "23px" : "",
        height: selected ? "22px" : "12px",
        marginRight: selected ? "-2px" : "",
        marginBottom: selected ? "2.5vh" : "3vh",
        transform: selected ? "" : "rotate(45deg) scaleX(0.7)",
        transformOrigin: selected ? "" :  "center",
        backgroundColor: selected ? "#00000000" : "#9b59b6",
        borderColor: selected ? "#9b59b6" : "#00000000",
        borderWidth: selected ? "3px" : "",
        borderRadius: "1px",
      }}
    ></Button>
  );

  const buttons = Array.from({ length: links.length }).map((_, index) =>
    createButton(index + 1, links[index] === selectedLink),
  );

  const { pathname } = useLocation();

  const isNavOn =
    pathname === "/hublocal" ||
    pathname === "/loginhublocal" ||
    pathname === "/registerhublocal" ||
    pathname === "/resume" ||
    pathname === "/doris" ||
    pathname === "/casanova";

  const handleLinkClick =
    (link: string) =>
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      event.preventDefault();
      setSelectedLink(link);
    };
  return (
    <>
      <div>
        <TitleWebsite title1="Bem Vindo! 🤝" title2="Cabraiz" />
      </div>
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
              <Nav id="nav-dropdown" style={{ display: 'inline-flex', alignItems: 'center' }}>
                {links.map((link) => (
                  <Nav.Link
                    key={link}
                    className={`text-nowrap nav-link-custom ${
                      selectedLink === link ? "active" : ""
                    }`}
                    href={`#${link.toLowerCase()}`}
                    onClick={handleLinkClick(link)}
                  >
                    {link === "Live" && (
                      <div>
                        <LiveAnimation />
                      </div>
                    )}
                    <span style={{ marginLeft: link === "Live" ? '5px' : '0' }}>
                      {link}
                    </span>
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
                //onClick={SignFirebase}
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
        {/* <Route path="/surprise" element={<Surprise />} /> */}
        <Route path="/resume" element={<Resume />} />
        <Route path="/doris" element={<Doris />} />
        <Route path="/casanova" element={<CasaNova />} />

        <Route path="/hublocal" element={<PrivateOutlet />}>
          {/* protected routes */}
          <Route index element={<Hublocal />} />
        </Route>
      </Routes>
      {!isNavOn && !isMobile ? (
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
