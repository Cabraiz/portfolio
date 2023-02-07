import React from "react";
import { Col, Row, Image, Card } from "react-bootstrap";

import icognita from "../../images/Surprise/Icognita.png";

function Surprise() {
  return (
    <Row className="m-0 p-0 ">
      <Col className="p-0 text-nowrap" style={{ marginTop: "5vh" }}>
        <Card
          style={{
            height: "85vh",
            width: "10vw",
            backgroundColor: "rgb(20, 20, 20)",
          }}
        ></Card>
        <Card
          style={{
            height: "85vh",
            width: "10vw",
            backgroundColor: "rgb(40, 40, 40)",
          }}
        ></Card>
        <Card
          style={{
            height: "85vh",
            width: "10vw",
            backgroundColor: "rgb(60, 60, 60)",
          }}
        ></Card>
        <Card
          style={{
            height: "85vh",
            width: "10vw",
            backgroundColor: "rgb(80, 80, 80)",
          }}
        ></Card>
        <Card
          style={{
            height: "85vh",
            width: "10vw",
            backgroundColor: "rgb(100, 100, 100)",
          }}
        ></Card>
        <Card
          style={{
            height: "85vh",
            width: "10vw",
            backgroundColor: "rgb(120, 120, 120)",
          }}
        ></Card>
      </Col>
    </Row>
  );
}

export default Surprise;
