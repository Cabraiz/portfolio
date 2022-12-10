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

function App() {
  const [site, setSite] = useState<string>("");

  function handleBlur() {
    if (/[a-zA-Z]/.test(site)) {
      if (!site.startsWith("www.") && !site.includes(".")) {
        setSite("www." + site.split(".").pop());
      } else {
        setSite("www." + site);
      }
    }
  }
  return (
    <>
      <Navbar bg="light" expand="lg">
        <Container fluid>
          <Navbar.Brand href="#">Navbar scroll</Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav
              className="me-auto my-2 my-lg-0"
              style={{ maxHeight: "100px" }}
              navbarScroll
            >
              <Nav.Link href="#action1">Home</Nav.Link>
              <Nav.Link href="#action2">Link</Nav.Link>
              <NavDropdown title="Link" id="navbarScrollingDropdown">
                <NavDropdown.Item href="#action3">Action</NavDropdown.Item>
                <NavDropdown.Item href="#action4">
                  Another action
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#action5">
                  Something else here
                </NavDropdown.Item>
              </NavDropdown>
              <Nav.Link href="#" disabled>
                Link
              </Nav.Link>
            </Nav>
            <Form className="d-flex">
              <Form.Control
                type="search"
                placeholder="Search"
                className="me-2"
                aria-label="Search"
              />
              <Button variant="outline-success">Search</Button>
            </Form>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Row
        style={{ marginTop: "15px", paddingLeft: "30px", marginRight: "30px" }}
      >
        <Col sm={12} md={8} lg={6}>
          <Form.Control
            value={site}
            onChange={(e) => setSite(e.target.value)}
            onBlur={handleBlur}
            type="email"
            placeholder="Enter Website"
          />
        </Col>
        <Col sm={12} md={4} lg={6}>
          <Form.Control type="password" placeholder="Enter E-mail" />
        </Col>
      </Row>
      <Row className="justify-content-md-center" style={{ marginTop: "15px" }}>
        <Col sm="auto">
          <Button variant="primary">Botão</Button>{" "}
        </Col>
      </Row>
      <Row>
        <Form.Text className="text-muted">Desconhecido</Form.Text>
      </Row>
    </>
  );
}

export default App;
