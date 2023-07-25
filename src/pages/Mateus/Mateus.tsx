import React, { useEffect, useState } from "react";
import { Col, Row, Image, Button } from "react-bootstrap";
import { isMobile } from "react-device-detect";

import perfil from "../../assets/Mateus/perfil.webp";
import dotsArray from "../../assets/icones/svg_dotsArray.svg";
import IconGmail from "../../assets/Mateus/IconGmail.png";
import IconInsta from "../../assets/Mateus/IconInsta.png";
import IconLinkendin from "../../assets/Mateus/IconLinkedIn.png";
import IconTiktok from "../../assets/Mateus/IconTiktok.png";

interface SocialButtonProps {
  href: string;
  icon: string;
  alt: string;
  isScrollToTop?: boolean;
}

export function capitalizeFirstLetter(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function getSocialMediaName(index: number): string {
  switch (index) {
    case 0:
      return "LinkedIn";
    case 1:
      return "Gmail";
    case 2:
      return "Insta";
    case 3:
      return "Tiktok";
    default:
      return "";
  }
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
      <Col className="col-sm-12 col-md-5 m-0" style={{ padding: "22vh 0 0 4vw" }}>
        <div
          className="p-0 font-sequel"
          style={{
            backgroundImage: gradient,
            marginBottom: 'max(10px, 4vh)',
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
          data-testid="gradientElement"
        ></div>
      </Col>

      {/* Right Column */}
      <Col
        className="col-sm-12 col-md-7"
        style={{
          marginTop: "10vh",
          paddingLeft: paddingLadoDireito,
          paddingRight: paddingLadoDireito,
          marginLeft: "-5vw",
        }}
      >
        <Image className="p-0" src={perfil} alt="Profile Image"/>

        <Row
          className="m-0 d-flex flex-row justify-content-evenly align-items-center"
          style={{
            padding: "3vh 0 0 0",
          }}
        >
          <SocialButton href="https://www.linkedin.com/in/cabraiz/" icon={IconLinkendin} alt="LinkedIn"/>
          <SocialButton
            href="mailto:mateusccabr@gmail.com?subject=Freelance%20Job%20Opportunity%20for%20Developer%20Engineer&body=Dear%20Cabral%2C%0D%0A%0D%0AWe%20came%20across%20your%20profile%20and%20our%20company%20is%20looking%20for%20a%20freelance%20developer%20engineer%20to%20work%20on%20a%20project%20that%20involves%20%5Bbriefly%20mention%20the%20project%20or%20technology%20stack%5D.%0D%0A%0D%0AIf%20you%20are%20interested%20in%20this%20opportunity%2C%20please%20let%20us%20know%20and%20we%20can%20discuss%20the%20details%20further.%0D%0A%0D%0AThank%20you%20for%20your%20time%20and%20consideration.%0D%0A%0D%0ABest%20regards%2C%0D%0A%5BCompany%20Name%5D"
            icon={IconGmail}
            alt="Gmail"
          />
          <SocialButton href="https://www.instagram.com/cabraiz/" icon={IconInsta} alt="Insta"/>
          <SocialButton href="https://www.tiktok.com/@cabraiz" icon={IconTiktok} alt="Tiktok" />
        </Row>
      </Col>
    </Row>
  );
}

export function SocialButton({ href, icon, alt, isScrollToTop }: SocialButtonProps) {
  return (
    <a
      href={href}
      className={`social-link ${isScrollToTop ? "btn-trasn scrollToTopButton" : "btn-trasn"}`}
      data-testid={isScrollToTop ? "scrollToTopButton" : undefined}
      style={{width:"auto"}}
    >
      <Image className="imagesize" src={icon} alt={alt} />
    </a>
  );
}

export default Mateus;