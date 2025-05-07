import { Col, Row, Image, Button } from "react-bootstrap";
import { isMobile } from "react-device-detect";

import perfil from "../../assets/Mateus/perfil.webp";
import IconGmail from "../../assets/Mateus/icon/IconGmail.png";
import IconInsta from "../../assets/Mateus/icon/IconInsta.png";
import IconLinkendin from "../../assets/Mateus/icon/IconLinkedIn.png";
import IconTiktok from "../../assets/Mateus/icon/IconTiktok.png";

import seloBNB from "../../assets/Mateus/Selos/BNB.svg";
import seloUNIFOR from "../../assets/Mateus/Selos/UNIFOR.svg";
import seloSANA from "../../assets/Mateus/Selos/SANA.svg";
import seloSEDIH from "../../assets/Mateus/Selos/SEDIH.svg";
import RoleTitle from "./RoleTitle";
import FloatingChat from "./FloatingChat";

import Tippy from '@tippyjs/react';
import '../../styles/styles.css';
import 'tippy.js/dist/tippy.css';

import { useTranslation } from 'react-i18next';


interface SocialButtonProps {
  href: string;
  icon: string;
  alt: string;
  isScrollToTop?: boolean;
}

const selos = [
  { key: "BNB", src: seloBNB, alt: "Banco do Nordeste", style: { scale: "0.9", marginTop: "5px" } },
  { key: "UNIFOR", src: seloUNIFOR, alt: "UNIFOR", style: {} },
  { key: "SANA", src: seloSANA, alt: "SANA", style: { scale: "0.75", marginTop: "5px" } },
  { key: "SEDIH", src: seloSEDIH, alt: "SEDIH", style: {} },
];


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

  const openResumeTab = () => {
    window.open('/resume', '_blank');
  };

  const { t } = useTranslation();

  return (
    <>
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
            style={{
              fontFamily: "var(--bs-body-font-family)",
              fontSize: "4rem",
              fontWeight: 700,
              color: "#f1c40f",
              marginBottom: "1.5rem",
            }}
          >
            Senior
          </div>
          <div
            className="p-0 font-sequel"
            style={{
              backgroundImage: gradient,
              marginBottom: "max(10px, 4vh)",
              minWidth: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "start",
              height: "3.5rem",
            }}
          >
            <RoleTitle />
          </div>


          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "2rem",
              flexWrap: "wrap",
              marginTop: "2vh",
              marginBottom: "4vh",
              padding: "1.2rem 2rem",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            {selos.map((selo) => (
              <Tippy
                key={selo.key}
                content={t(`selo.${selo.key}`)} // <- aqui agora usa o idioma atual
                placement="top"
                animation="fade"
                arrow={true}
                delay={[500, 100]}
                theme="bubble"
                offset={[0, 20]}
              >
                <img
                  src={selo.src}
                  alt={selo.alt}
                  style={{
                    height: "40px",
                    filter: "grayscale(100%)",
                    opacity: 0.8,
                    ...selo.style,
                  }}
                />
              </Tippy>
            ))}
          </div>
          <Col>
          <Row
            className="p-0 m-0 mt-4 pb-2 d-flex justify-content-end flex-wrap"
            style={{ minWidth: "400px" }}
          >
          <Col className="me-3">
            <Button className="btn-yellow py-3 btn-press-effect mb-4" style={{
              background: "linear-gradient(-145deg, #f1c40f 0%, #e2b913 100%)"
            }}>
              HIRE ME
            </Button>
          </Col>

          <Col>
            <Button
              className="btn-trasn-w-border py-3 btn-tran-effect btn-press-effect"
              style={{ minWidth: "200px" }}
              onClick={openResumeTab}
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
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              padding: "2vh 2vw",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "fit-content",
              margin: "0 auto",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <Image
              className="p-0"
              src={perfil}
              alt="Profile Image"
              style={{
                borderRadius: "20px",
                marginBottom: "2vh",
                maxWidth: "100%",
              }}
            />

            {/* Botões horizontais */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: "1.5rem",
                flexWrap: "wrap", // previne quebra feia no mobile
                marginTop: "2vh",
              }}
            >
              <SocialButton
                href="https://www.linkedin.com/in/cabraiz/"
                icon={IconLinkendin}
                alt="LinkedIn"
              />
              <SocialButton
                href="mailto:mateusccabr@gmail.com?subject=Freelance..."
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
            </div>
          </div>
        </Col>
      </Row>
    <FloatingChat />
    </>
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
