//yarn upgrade-interactive --latest
import React, { useState } from "react";
import "./App.css";

import {
  Button,
  Container,
  Form,
  Nav,
  Navbar,
  NavDropdown,
  Col,
  Row,
  Image,
} from "react-bootstrap";

import logo1 from "./images/icones/4.png";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Helmet, HelmetProvider } from "react-helmet-async";

function App() {
  const [title] = useState("May & Mat");
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
          backgroundColor: "#ffffff",
          fontWeight: "600",
          margin: "0px",
          padding: "0px",
        }}
        expand="lg"
      >
        <Image
          className="ms-5"
          src={logo1}
          width="100vw"
          style={{ marginTop: "26px" }}
        />
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse
          id="navbarScroll"
          style={{ justifyContent: "end", margin: "0px" }}
        >
          <Nav navbarScroll>
            <Row
              style={{
                marginTop: "20px",
                marginLeft: "12px",
                color: "#B6B1A9",
              }}
            >
              <Col>
                <Nav.Link href="#action1">HOME</Nav.Link>
              </Col>
              <Col>
                <Nav.Link href="#action1">ABOUT</Nav.Link>
              </Col>
              <Col>
                <Nav.Link href="#action1">GALLERY</Nav.Link>
              </Col>
              <Col>
                <Nav.Link href="#action1">PORTRAITURE</Nav.Link>
              </Col>
              <Col>
                <Nav.Link href="#action1">STORE</Nav.Link>
              </Col>
              <Col>
                <Nav.Link href="#action1">CONTACT</Nav.Link>
              </Col>
            </Row>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Row style={{ minHeight: "40vw" }}>
        <Col
          className="col-sm-6 align-items-center"
          style={{ backgroundColor: "red", marginTop: "10vw" }}
        >
          <Row style={{ backgroundColor: "blue" }}>OI</Row>
          OI2
          <Row>OI3</Row>
          <Row>OI4</Row>
          OI5
          <Row>OI6</Row>
        </Col>
        <Col className="col-sm-6" style={{ backgroundColor: "blue" }}>
          <Row style={{ backgroundColor: "red" }}>OI</Row>
        </Col>
      </Row>
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
