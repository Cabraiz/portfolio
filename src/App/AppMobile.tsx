import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "./App.css";
import "../pages/LoginHubLocal/login.css";
import "../pages/Mateus/Mateus.css";
import "../pages/Surprise/Surprise.css";

import AppRoutes from "../routes/AppRoutes";
import AppNavbar from "./NavBar/AppNavbar";
import LandingPage from "../pages/Mateus/LandingPage/LandingPage";

import "react-toastify/dist/ReactToastify.css";

import TitleWebsite from "../pages/PrincipalPage/TitleWebsite/title_website";

function AppMobile() {
  const [selectedLink, setSelectedLink] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const appWrapperRef = useRef<HTMLDivElement>(null);

  const baseLinks = ["portfolio", "roadMap", "pricing", "live", "contact"];
  const links = baseLinks;

  const { pathname } = useLocation();

  const hiddenNavbarRoutes = [
    "/enigma",
    "/libras-unlock",
    "/libras",
    "/rosa-unlock",
    "/rosa",
    "/vinho-unlock",
    "/vinho",
    "/loginhublocal",
    "/registerhublocal",
    "/resume",
    "/doris",
    "/casanova",
    "/hublocal",
  ];

  const isNavHidden = hiddenNavbarRoutes.includes(pathname);


  return (
    <>
      <TitleWebsite title1="Bem Vindo! 🤝" title2="Cabraiz" />

      {!isNavHidden && (
        <AppNavbar
          isMobileView={true}
          selectedLink={selectedLink}
          setSelectedLink={setSelectedLink}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          links={links}
        />
      )}

      {!isNavHidden && <LandingPage />}

      <div ref={appWrapperRef}>
        <AppRoutes />
      </div>

      <ToastContainer />
    </>
  );
}

export default AppMobile;
