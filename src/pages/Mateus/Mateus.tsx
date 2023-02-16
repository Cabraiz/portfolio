import React from "react";
import { Col, Row, Image } from "react-bootstrap";
import perfil from "../../images/Mateus/perfil.webp";

function Mateus() {
  return (
    <Row className="p-0 m-0">
      <Col className="col-6">
        Full Stack2 <br></br>Developer
      </Col>
      <Col className="col-6 m-0">
        <Image
          src={perfil}
          style={{
            marginTop: "12vh",
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
