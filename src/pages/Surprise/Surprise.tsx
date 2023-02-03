import React from "react";
import { motion } from "framer-motion";
import "./Surprise.css";
import { Col, Row, Image } from "react-bootstrap";

import icognita from "../../images/Surprise/Icognita.png";

function Surprise() {
  return (
    <Row className="justify-content-sm-start m-0 p-0 ">
      <Col className="p-0" style={{ marginTop: "5vh" }}>
        <Image src={icognita} style={{ height: "85vh" }}></Image>
        <Image src={icognita} style={{ height: "85vh" }}></Image>
        <Image src={icognita} style={{ height: "85vh" }}></Image>
        <Image src={icognita} style={{ height: "85vh" }}></Image>
        <Image src={icognita} style={{ height: "85vh" }}></Image>
      </Col>
    </Row>
  );
}

export default Surprise;
