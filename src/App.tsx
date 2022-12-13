import React, { useState } from "react";
import "./App.css";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [site, setSite] = useState<string>("");

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
    let urlPattern = new RegExp(
      "^(https?:\\/\\/)?" + // validate protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // validate fragment locator

    if (/[A-Za-z0-9]/.test(site) && !site.startsWith("www.")) {
      let aux = site;
      while (!/[A-Za-z0-9]/.test(aux.charAt(0))) {
        aux = aux.substring(1);
      }
      setSite("www." + aux);
    }
    if (urlPattern.test(site)) {
      notifySucesso();
    } else {
      notifyError();
    }
  }
  return (
    <>
      <Row>
        <Col sm={12}>
          <Form.Control
            value={site}
            onChange={(e) => setSite(e.target.value)}
            onBlur={handleBlur}
            placeholder="Enter Website"
          />
        </Col>
      </Row>
      <Row className="justify-content-md-center">
        <Col sm={12}>
          <Form.Control type="email" placeholder="Enter E-mail" />
        </Col>
      </Row>
      <Row>
        <Col sm={12}>
          <Form.Control type="password" placeholder="Enter Password" />
        </Col>
      </Row>
      <Row className="justify-content-md-center" style={{ marginTop: "15px" }}>
        <Col sm="auto">
          <Button variant="primary">Botão</Button>{" "}
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
