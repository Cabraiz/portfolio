import { type CSSProperties, useMemo } from "react";
import { Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Tippy from "@tippyjs/react";

import RoleTitle from "../../RoleTitle";
import CTAButton from "../../shared/CTAButton/CTAButton";
import ResumeDownloadButton from "../../shared/ResumeDownloadButton/ResumeDownloadButton";
import WhatsAppSignalButton from "../../shared/WhatsAppSignalButton/WhatsAppSignalButton";
import WhatsAppHeroSlot from "../../shared/WhatsAppSignalButton/WhatsAppHeroSlot";

import {
  MEET_HREF,
  RESUME_HREF,
  seals,
  WHATSAPP_HREF,
} from "../../mateusDesktop.data";

type HeroTextColumnProps = Readonly<{
  isCompactDesktop: boolean;
  isPT: boolean;
  whatsappTopLabel: string;
  secondaryLabel: string;
}>;

const heroTextColumnBaseStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  overflow: "visible",
};

const heroActionsWrapperStyle: CSSProperties = {
  position: "relative",
  zIndex: 6,
  width: "100%",
  overflow: "visible",
  isolation: "isolate",
};

export default function HeroTextColumn({
  isCompactDesktop,
  isPT,
  whatsappTopLabel,
  secondaryLabel,
}: HeroTextColumnProps) {
  const { t } = useTranslation();

  const seniorTitleStyle = useMemo<CSSProperties>(() => {
    return {
      fontSize: isCompactDesktop ? "3.1rem" : "4rem",
      fontWeight: 700,
      color: "#f1c40f",
      marginBottom: isCompactDesktop ? "2rem" : "3.2rem",
      lineHeight: 1,
    };
  }, [isCompactDesktop]);

  const roleContainerStyle = useMemo<CSSProperties>(() => {
    return {
      backgroundImage: "linear-gradient(90deg, #f1c40f 100%, #f1c40f 100%)",
      marginBottom: isCompactDesktop ? "28px" : "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      height: isCompactDesktop ? "3rem" : "3.5rem",
    };
  }, [isCompactDesktop]);

  const sealsContainerStyle = useMemo<CSSProperties>(() => {
    return {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: isCompactDesktop ? "1rem" : "2rem",
      padding: isCompactDesktop ? "0.75rem 1rem" : "1.2rem 2rem",
      backgroundColor: "rgba(255, 255, 255, 0.035)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      borderRadius: isCompactDesktop ? "16px" : "20px",
      marginBottom: isCompactDesktop ? "6px" : "-1vh",
      boxSizing: "border-box",
    };
  }, [isCompactDesktop]);

  const heroTextColumnStyle = useMemo<CSSProperties>(() => {
    return {
      ...heroTextColumnBaseStyle,
      paddingTop: isCompactDesktop ? "clamp(100px, 2.6vh, 24px)" : "11vh",
    };
  }, [isCompactDesktop]);

  const primaryHeroAction = useMemo(() => {
    if (isPT) {
      return (
        <WhatsAppSignalButton
          href={WHATSAPP_HREF}
          label="WhatsApp"
          topLabel={whatsappTopLabel}
          bottomLabel="Vamos Nessa?"
          ariaLabel="Abrir conversa no WhatsApp"
          fullWidth
          compact={isCompactDesktop}
          hero
        />
      );
    }

    return (
      <CTAButton
        label="MEET"
        backLabel="LET'S TALK"
        ariaLabel="Open meeting link"
        href={MEET_HREF}
        target="_blank"
        rel="noopener noreferrer"
        variant="heroPrimary"
        size={isCompactDesktop ? "compact" : "default"}
        align="center"
        fullWidth
      />
    );
  }, [isCompactDesktop, isPT, whatsappTopLabel]);

  const secondaryHeroAction = useMemo(() => {
    return (
      <ResumeDownloadButton
        label={secondaryLabel}
        ariaLabel={secondaryLabel}
        href={RESUME_HREF}
        target="_blank"
        rel="noopener noreferrer"
        size={isCompactDesktop ? "compact" : "default"}
        fullWidth
      />
    );
  }, [isCompactDesktop, secondaryLabel]);

  return (
    <Col md={5} style={heroTextColumnStyle}>
      <div style={seniorTitleStyle}>Senior</div>

      <div className="font-sequel" style={roleContainerStyle}>
        <RoleTitle />
      </div>

      <div style={sealsContainerStyle}>
        {seals.map((seal) => (
          <Tippy
            key={seal.key}
            content={
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  maxWidth: "280px",
                  padding: "4px",
                }}
              >
                <img
                  src={seal.cat}
                  alt={`${seal.alt} mascot`}
                  style={{ height: "11vh", borderRadius: "8px" }}
                />
                <p style={{ fontSize: "12px", margin: 0 }}>
                  {t(`selo.${seal.key}`)}
                </p>
              </div>
            }
            placement="top"
            animation="fade"
            arrow
            delay={[500, 100]}
            theme="bubble"
            offset={[0, 20]}
          >
            <div>
              <img
                src={seal.src}
                alt={seal.alt}
                style={{
                  height: isCompactDesktop ? "32px" : "40px",
                  filter: "grayscale(100%)",
                  opacity: 0.8,
                  ...seal.style,
                }}
              />
            </div>
          </Tippy>
        ))}
      </div>

      <div style={heroActionsWrapperStyle}>
        <WhatsAppHeroSlot
          compact={isCompactDesktop}
          preserveDesktopOffset={!isCompactDesktop}
          primary={primaryHeroAction}
          secondary={secondaryHeroAction}
        />
      </div>
    </Col>
  );
}
