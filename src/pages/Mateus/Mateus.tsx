import React from "react";
import "./Mateus.css";
import { Col, Row, Image } from "react-bootstrap";
import { ReactComponent as SvgEye } from "../../images/icones/svg_eye.svg";
import perfil from "../../images/Mateus/perfil.png";

function Mateus() {
  return (
    <Row>
      <Col className="col-sm-6">OI</Col>
      <Col className="col-sm-6">
        <Image className="mt-5" src={perfil} width="90%" />
      </Col>
    </Row>
  );
}

export default Mateus;
