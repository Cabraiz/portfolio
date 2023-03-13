import React from "react";
import { Col, Row, Image } from "react-bootstrap";
import perfil from "../../images/Mateus/perfil.webp";

import dotsArray from "../../images/icones/svg_dotsArray.svg";

function Mateus() {
  return (
    <Row className="p-0 m-0">
      <Col
        className="col-6 m-0"
        style={{
          padding: "18vh 0 0 8vw",
          height: "85vh",
        }}
      >
        <Row
          className="p-0 m-0 font-sequel"
          style={{
            height: "23vh",
            justifyContent: "start",
          }}
        >
          Full Stack <br></br>Developer.
        </Row>
        <Row
          className="p-0 m-0 font-sequel-underline"
          style={{
            height: "22vh",
            justifyContent: "start",
          }}
        >
          In my experience as a developer, I have found that optimism <br></br>
          and a positive mindset are essential ingredients for <br></br>
          success and innovation.
        </Row>
        <Row
          className="p-0 m-0"
          style={{
            height: "22vh",
            justifyContent: "start",
          }}
        >
        </Row>
      </Col>
      <Col className="col-6 m-0">
        <Image
          src={dotsArray}
          style={{
            marginLeft: "-2.2vw",
            marginTop: "4vh",
            position: "absolute",
            width: "20vh",
            height: "20vh",
          }}
        />
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
