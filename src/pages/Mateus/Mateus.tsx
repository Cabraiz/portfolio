import React from "react";
import { Col, Row, Image } from "react-bootstrap";
import perfil from "../../images/Mateus/perfil.webp";

import dotsArray from "../../images/icones/svg_dotsArray.svg";

function Mateus() {
  return (
    <Row className="p-0 m-0">
      <Col
        className="col-6 font-sequel"
        style={{
          paddingTop: "18vh",
          paddingLeft: "7vw",
        }}
      >
        Full Stack <br></br>Developer.
      </Col>
      <Col className="col-6 m-0">
        <Image
          src={dotsArray}
          style={{
            marginLeft: "-2.2vw",
            marginTop: "6vh",
            position: "absolute",
            width: "20vh",
            height: "20vh",
          }}
        />
        <Image
          src={perfil}
          style={{
            marginTop: "14vh",
            marginLeft: "3vw",
            width: "calc(28vmin + 22vh)",
            height: "calc(28vmin + 22vh)",
          }}
        />
      </Col>
    </Row>
  );
}

export default Mateus;
