import React, { useEffect, useState } from "react";
import { Col, Row, Image, Button } from "react-bootstrap";
import { isMobile } from "react-device-detect";

import perfil from "../../assets/Mateus/perfil.webp";
import dotsArray from "../../assets/icones/svg_dotsArray.svg";
import IconGmail from "../../assets/Mateus/IconGmail.png";
import IconInsta from "../../assets/Mateus/IconInsta.png";
import IconLinkendin from "../../assets/Mateus/IconLinkedIn.png";
import IconTiktok from "../../assets/Mateus/IconTiktok.png";

import MateusPDF from "./Mateus_Resume.pdf";

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
  const paddingTopFullStack = isMobile ? "10vh" : "20vh";

  const margingLadoDireito = isMobile ? "0" : "-5vw";
  const paddingLadoDireito = isMobile ? "5vw" : "15vw";
  const gradient = isMobile
    ? "linear-gradient(90deg,#f1c40f 0%,#f1c40f 71.5%,#9b59b6 71.5%, #9b59b6 100%)"
    : "linear-gradient(90deg,#f1c40f 100%, #f1c40f 100%)";

  return (
    <Row data-testid="mateus-container" className="p-0 m-0">
      {/* Left Column */}
      <Col
        className="col-sm-12 col-md-5 m-0"
        style={{
          padding: `${paddingTopFullStack} max(50px, 4vw) 0 max(50px, 4vw)`,
          minWidth: "450px",
        }}
      >
        <div
          className="p-0 font-sequel"
          style={{
            backgroundImage: gradient,
            marginBottom: "max(10px, 4vh)",
            minWidth: "400px",
          }}
        >
          Full Stack <br />
          <div className="text-nowrap">
            Develope<span className="font-dot-space">r</span>
            <span className="font-dot font-dot-space">.</span>
          </div>
        </div>
        <div
          className="p-0 font-sequel-underline"
          style={{
            width: "100%",
            justifyContent: "start",
            marginLeft: "-5px",
          }}
        >
          Hey there! Welcome to my website, where we code with style and debug
          with a smile 😄
          <br />
          Get ready for some HTMLarious adventures!
          <div style={{ textAlign: "right" }}>-ChatGPT</div>
        </div>
        <Col className="justify-content-end">
          <Row
            className="col-sm-12 col-md-8 p-0 m-0 mt-4 pb-2"
            style={{ minWidth: "400px" }}
          >
            <Col className="col-sm-6 col-md-5 m-0 text-nowrap ps-0">
              <Button 
                className="btn-yellow py-3 btn-press-effect mb-4"
                style={{ background: "linear-gradient(-145deg, #f1c40f 0%,   #e2b913 100%)" }}
              >
                HIRE ME
              </Button>
            </Col>
            <Col className="col-sm-6 col-md-7 m-0 text-nowrap ps-0 ps-3">
              <Button
                className="btn-trasn-w-border py-3 btn-tran-effect btn-press-effect"
                href={MateusPDF}
                target="_blank"
                rel="noreferrer"
                style={{ minWidth: "200px" }}
              >
                DOWNLOAD CV
              </Button>
            </Col>
          </Row>
        </Col>
      </Col>

      {/* Right Column */}
      <Col
        className="col-sm-12 col-md-7"
        style={{
          marginTop: "10vh",
          paddingLeft: paddingLadoDireito,
          paddingRight: paddingLadoDireito,
          marginLeft: margingLadoDireito,
        }}
      >
        <Image className="p-0" src={perfil} alt="Profile Image" />

        <Row
          className="m-0 d-flex flex-row justify-content-evenly align-items-center"
          style={{
            padding: "3vh 0 0 0",
          }}
        >
          <SocialButton
            href="https://www.linkedin.com/in/cabraiz/"
            icon={IconLinkendin}
            alt="LinkedIn"
          />
          <SocialButton
            href="mailto:mateusccabr@gmail.com?subject=Freelance%20Job%20Opportunity%20for%20Developer%20Engineer&body=Dear%20Cabral%2C%0D%0A%0D%0AWe%20came%20across%20your%20profile%20and%20our%20company%20is%20looking%20for%20a%20freelance%20developer%20engineer%20to%20work%20on%20a%20project%20that%20involves%20%5Bbriefly%20mention%20the%20project%20or%20technology%20stack%5D.%0D%0A%0D%0AIf%20you%20are%20interested%20in%20this%20opportunity%2C%20please%20let%20us%20know%20and%20we%20can%20discuss%20the%20details%20further.%0D%0A%0D%0AThank%20you%20for%20your%20time%20and%20consideration.%0D%0A%0D%0ABest%20regards%2C%0D%0A%5BCompany%20Name%5D"
            icon={IconGmail}
            alt="Gmail"
          />
          <SocialButton
            href="https://www.instagram.com/cabraiz/"
            icon={IconInsta}
            alt="Insta"
          />
          <SocialButton
            href="https://www.tiktok.com/@cabraiz"
            icon={IconTiktok}
            alt="Tiktok"
          />
        </Row>
      </Col>
    </Row>
  );
}

export function SocialButton({
  href,
  icon,
  alt,
  isScrollToTop,
}: SocialButtonProps) {
  return (
    <a
      href={href}
      className={`social-link ${
        isScrollToTop ? "btn-trasn scrollToTopButton" : "btn-trasn"
      }`}
      data-testid={isScrollToTop ? "scrollToTopButton" : undefined}
      style={{ width: "auto", marginBottom: "2vh" }}
    >
      <Image className="imagesize" src={icon} alt={alt} />
    </a>
  );
}

export default Mateus;
