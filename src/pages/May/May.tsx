import React from "react";
import "./May.css";
import { Col, Row } from "react-bootstrap";
import { ReactComponent as SvgEye } from "../../images/icones/svg_eye.svg";

function May() {
  return (
    <Row style={{ minHeight: "40vw" }}>
      <Col
        className="col-sm-5 align-items-center"
        style={{ marginTop: "10.6vw" }}
      >
        <Row>
          <SvgEye
            className="col-sm-12 align-items-center"
            style={{ height: "6vw" }}
          />
        </Row>
        <Row className="font-face-gm text-nowrap">MAYARA LIMA BIO</Row>
        <Row style={{ marginTop: "2vw", marginBottom: "2vw" }}>ENTER</Row>
        <Row>
          <Col className="col-sm-4">FACEBOOK</Col>
          <Col className="col-sm-4">INSTAGRAM</Col>
          <Col className="col-sm-4">TWITTER</Col>
        </Row>
      </Col>
      <Col className="col-sm-7" style={{ backgroundColor: "blue" }}>
        <Row style={{ backgroundColor: "red" }}>OI</Row>
      </Col>
    </Row>
  );
}

export default May;
