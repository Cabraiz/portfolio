import React from "react";
import { Col, Row, Image } from "react-bootstrap";

import perfil from "../../images/Mateus/perfil.webp";
import dotsArray from "../../images/icones/svg_dotsArray.svg";

import { isMobile } from "react-device-detect";

function Mateus() {

  function getMobileSettings(a: number): string {
    return "4.5vw 17vw 0 2.5vw";
  }

  return (
    <Row className="p-0 m-0">
      <Col
        className="col-sm-12 col-md-6 m-0"
        style={{
          padding: "calc(6vh + 6vw) 0 0 7.5vw",
          height: "60vh",
        }}
      >
        <Row
          className="p-0 m-0 font-sequel"
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(97,219,251,1) 0%, rgba(97,219,251,1) 64%, rgba(235,26,100,1) 64%, rgba(235,26,100,1) 100%)',
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
          In my experience as a developer, I have found that optimism and a positive mindset are essential ingredients for success and innovation.
        </Row>
        <Row
          className="p-0 m-0"
          style={{
            height: "20vh",
            justifyContent: "start",
          }}
        ></Row>
      </Col>
      <Col className="col-sm-12 col-md-6 m-0">
        <Row className="m-0" 
          style={{
            padding: `${getMobileSettings(0)}`,
          }}>
          <Image
            src={perfil}
            style={{
              width: "auto",
              height: "auto",
            }}
          />
        </Row>
      </Col>
    </Row>
  );
}

export default Mateus;
