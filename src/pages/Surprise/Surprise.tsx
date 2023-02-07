import React from "react";
import { Col, Row, Image, Form } from "react-bootstrap";

import icognita from "../../images/Surprise/Icognita.png";

function Surprise() {
  return (
    <Row className="m-0 p-0 ">
      <Col className="p-0 text-nowrap" style={{ marginTop: "5vh" }}>
        <Form.Control
          value="?"
          style={{ backgroundColor: "rgb(20, 20, 20)" }}
        />

        <Form.Control
          value="?"
          style={{ backgroundColor: "rgb(40, 40, 40)" }}
        />

        <Form.Control
          value="?"
          style={{ backgroundColor: "rgb(60, 60, 60)" }}
        />

        <Form.Control
          value="?"
          style={{ backgroundColor: "rgb(80, 80, 80)" }}
        />

        <Form.Control
          value="?"
          style={{ backgroundColor: "rgb(100, 100, 100)" }}
        />
      </Col>
    </Row>
  );
}

export default Surprise;
