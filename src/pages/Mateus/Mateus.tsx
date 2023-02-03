import React from "react";
import "./Mateus.css";
import { Col, Row, Image } from "react-bootstrap";
import perfil from "../../images/Mateus/perfil.webp";

function Mateus() {
  return (
    <Row>
      <Col className="col-sm-7">
        Full Stack2 <br></br>Developer
      </Col>
      <Col className="col-sm-5">
        <Image
          src={perfil}
          width="360vw"
          style={{ marginTop: "2.5vw", marginLeft: "2vw" }}
        />
      </Col>
    </Row>
  );
}

export default Mateus;
