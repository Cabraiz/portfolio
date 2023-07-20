import React, { useEffect, useState } from "react";
import { Col, Row, Image, Button } from "react-bootstrap";
import { isMobile } from "react-device-detect";

import perfil from "../../assets/Mateus/perfil.webp";
import dotsArray from "../../assets/icones/svg_dotsArray.svg";
import IconGmail from "../../assets/Mateus/IconGmail.png";
import IconInsta from "../../assets/Mateus/IconInsta.png";
import IconLinkendin from "../../assets/Mateus/IconLinkendin.png";
import IconTiktok from "../../assets/Mateus/IconTiktok.png";

interface SocialButtonProps {
  href: string;
  icon: string; // Define the type for the 'icon' prop
}

function Mateus() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    function handleScroll() {
      setScrollY(window.scrollY);
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function getScrollYPosition(): number {
    return scrollY;
  }

  const paddingLadoDireito = isMobile ? "5vw" : "15vw";
  const gradient = isMobile
    ? "linear-gradient(90deg,#f1c40f 0%,#f1c40f 64%,#9b59b6 64%, #9b59b6 100%)"
    : "linear-gradient(90deg,#f1c40f 100%, #f1c40f 100%)";

  return (
    <Row className="p-0 m-0">
      {/* Left Column */}
      <Col className="col-sm-12 col-md-5 m-0" style={{ padding: "21vh 0 0 7vw" }}>
        <div
          className="p-0 font-sequel"
          style={{
            backgroundImage: gradient,
            marginBottom: Math.max(10, 4),
          }}
        >
          Full Stack <br />
          Developer.
        </div>
        <div
          className="p-0 font-sequel-underline"
          style={{
            width: "100%",
            justifyContent: "start",
          }}
        >
          Hey there! Welcome to my website, where we code with style and debug with a smile 😄
          <br />Get ready for some HTMLarious adventures!
          <div style={{ textAlign: "right"}}>-ChatGPT</div>
        </div>
        <div
          className="p-0 m-0"
          style={{
            height: "20vh",
            justifyContent: "start",
          }}
        ></div>
      </Col>

      {/* Right Column */}
      <Col
        className="col-sm-12 col-md-7"
        style={{
          marginTop: "10vh",
          paddingLeft: paddingLadoDireito,
          paddingRight: paddingLadoDireito,
        }}
      >
        <Image className="p-0" src={perfil} alt="Profile Image" />

        <Row
          className="m-0"
          style={{
            padding: "2vh 0 0 0",
            justifyContent: "center",
          }}
        >
          <SocialButton href="https://www.linkedin.com/in/cabraiz/" icon={IconLinkendin} />
          <SocialButton
            href="mailto:mateusccabr@gmail.com?subject=Freelance%20Job%20Opportunity%20for%20Developer%20Engineer&body=Dear%20Cabral%2C%0D%0A%0D%0AWe%20came%20across%20your%20profile%20and%20our%20company%20is%20looking%20for%20a%20freelance%20developer%20engineer%20to%20work%20on%20a%20project%20that%20involves%20%5Bbriefly%20mention%20the%20project%20or%20technology%20stack%5D.%0D%0A%0D%0AIf%20you%20are%20interested%20in%20this%20opportunity%2C%20please%20let%20us%20know%20and%20we%20can%20discuss%20the%20details%20further.%0D%0A%0D%0AThank%20you%20for%20your%20time%20and%20consideration.%0D%0A%0D%0ABest%20regards%2C%0D%0A%5BCompany%20Name%5D"
            icon={IconGmail}
          />
          <SocialButton href="https://www.instagram.com/cabraiz/" icon={IconInsta} />
          <SocialButton href="https://www.tiktok.com/@cabraiz" icon={IconTiktok} />
        </Row>
      </Col>
    </Row>
  );
}

function SocialButton({ href, icon }: SocialButtonProps) {
  return (
    <Col className="col-auto">
      <Button className="btn-trasn" href={href}>
        <Image className="imagesize" src={icon} alt="Social Icon" />
      </Button>
    </Col>
  );
}

export default Mateus;