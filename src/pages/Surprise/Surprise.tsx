import React from "react";
import "./Surprise.css";
import { Col, Row, Image, Card } from "react-bootstrap";

import icognita from "../../images/Surprise/Icognita.png";

function Surprise() {
  return (
    <Row className="m-0 p-0">
      <Col className="p-0 text-nowrap" style={{ marginTop: "5vh" }}>
        <Card style={{ height: "85vh", width: "10vw" }}></Card>
        <Card style={{ height: "85vh", width: "10vw" }}></Card>
        <Card style={{ height: "85vh", width: "10vw" }}></Card>
        <Card style={{ height: "85vh", width: "10vw" }}></Card>
        <Card style={{ height: "85vh", width: "10vw" }}></Card>
        <Card style={{ height: "85vh", width: "10vw" }}></Card>
      </Col>
    </Row>
  );
}

export default Surprise;
