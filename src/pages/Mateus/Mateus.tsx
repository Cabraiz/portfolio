import React, { useEffect, useState } from "react";
import { Col, Row, Image, Button } from "react-bootstrap";

import perfil from "../../images/Mateus/perfil.webp";
import dotsArray from "../../images/icones/svg_dotsArray.svg";

import IconGmail from "../../images/Mateus/IconGmail.png";
import IconInsta from "../../images/Mateus/IconInsta.png";
import IconLinkendin from "../../images/Mateus/IconLinkendin.png";
import IconTiktok from "../../images/Mateus/IconTiktok.png";

import { isMobile } from "react-device-detect";

function Mateus() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setScrollY(window.scrollY);
  }, []);

  function getScrollYPosition(): number {
    return scrollY;
  }

  return (
    <Row className="p-0 m-0" style={{ height: "88vh" }}>
      <Col
        className="col-sm-12 col-md-6 m-0"
        style={{
          padding: "calc(20px + 8vw) 0 0 7.5vw",
          height: "60vh",
        }}
      >
        <Row
          className="p-0 m-0 font-sequel"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(97,219,251,1) 0%, rgba(97,219,251,1) 64%, rgba(235,26,100,1) 64%, rgba(235,26,100,1) 100%)",
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
          In my experience as a developer, I have found that optimism and a
          positive mindset are essential ingredients for success and innovation.
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
        <Row
          className="m-0"
          style={{
            padding: "4.5vw 0 0 3.5vw",
            justifyContent: "start",
          }}
        >
          <Image
            className="p-0"
            src={perfil}
            style={{
              maxWidth: "340px",
              width: "auto",
              height: "auto",
            }}
          />
          <Row
            className="m-0"
            style={{
              padding: "2vh 0 0 0",
              justifyContent: "center",
              maxWidth: "340px",
            }}
          >
            <Col className="col-auto">
              <Button
                className="btn-trasn"
                href="https://www.linkedin.com/in/cabraiz/"
              >
                <Image className="imagesize" src={IconLinkendin}></Image>
              </Button>
            </Col>
            <Col className="col-auto">
              <Button
                className="btn-trasn"
                href="mailto:mateusccabr@gmail.com?subject=Freelance%20Job%20Opportunity%20for%20Developer%20Engineer&body=Dear%20Cabral%2C%0D%0A%0D%0AWe%20came%20across%20your%20profile%20and%20our%20company%20is%20looking%20for%20a%20freelance%20developer%20engineer%20to%20work%20on%20a%20project%20that%20involves%20%5Bbriefly%20mention%20the%20project%20or%20technology%20stack%5D.%0D%0A%0D%0AIf%20you%20are%20interested%20in%20this%20opportunity%2C%20please%20let%20us%20know%20and%20we%20can%20discuss%20the%20details%20further.%0D%0A%0D%0AThank%20you%20for%20your%20time%20and%20consideration.%0D%0A%0D%0ABest%20regards%2C%0D%0A%5BCompany%20Name%5D"
              >
                <Image className="imagesize" src={IconGmail}></Image>
              </Button>
            </Col>
            <Col className="col-auto">
              <Button
                className="btn-trasn"
                href="https://www.instagram.com/cabraiz/"
              >
                <Image className="imagesize" src={IconInsta}></Image>
              </Button>
            </Col>
            <Col className="col-auto">
              <Button
                className="btn-trasn"
                href="https://www.tiktok.com/@cabraiz"
              >
                <Image className="imagesize" src={IconTiktok}></Image>
              </Button>
            </Col>
          </Row>
        </Row>
      </Col>
    </Row>
  );
}

export default Mateus;
