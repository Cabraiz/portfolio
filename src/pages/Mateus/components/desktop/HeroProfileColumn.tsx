import { Col } from "react-bootstrap";

import SocialButton from "./SocialButton";
import { useMateusHeroLayout } from "../../hooks/useMateusHeroLayout";
import {
  MEET_HREF,
  PROFILE_IMAGE,
  SOCIAL_ICONS,
  WHATSAPP_HREF,
} from "../../mateusDesktop.data";

type HeroProfileColumnProps = Readonly<{
  isCompactDesktop: boolean;
  isPT: boolean;
  isImageLoaded: boolean;
  onImageLoad: () => void;
}>;

export default function HeroProfileColumn({
  isPT,
  isImageLoaded,
  onImageLoad,
}: HeroProfileColumnProps) {
  const {
    profileColumnStyle,
    profileCardStyle,
    profileImageWrapperStyle,
    socialRowStyle,
  } = useMateusHeroLayout();

  const supportSocialButton = isPT ? (
    <SocialButton href={MEET_HREF} icon={SOCIAL_ICONS.meet} alt="Meet" />
  ) : (
    <SocialButton
      href={WHATSAPP_HREF}
      icon={SOCIAL_ICONS.whatsapp}
      alt="WhatsApp"
    />
  );

  return (
    <Col
      md={7}
      style={{
        ...profileColumnStyle,
        height: "100%",
        minHeight: "100%",
      }}
    >
      <div style={profileCardStyle}>
        <div
          style={{
            ...profileImageWrapperStyle,
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <img
            src={PROFILE_IMAGE}
            alt="Mateus"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={onImageLoad}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              opacity: isImageLoaded ? 1 : 0.98,
              transition: "opacity 160ms ease",
              display: "block",
            }}
          />
        </div>

        <div style={socialRowStyle}>
          <SocialButton
            href="https://www.linkedin.com/in/cabraiz/"
            icon={SOCIAL_ICONS.linkedin}
            alt="LinkedIn"
          />
          <SocialButton
            href="mailto:mateusccabr@gmail.com?subject=Freelance..."
            icon={SOCIAL_ICONS.gmail}
            alt="Gmail"
          />
          <SocialButton
            href="https://www.instagram.com/cabraiz/"
            icon={SOCIAL_ICONS.instagram}
            alt="Instagram"
          />
          {supportSocialButton}
        </div>
      </div>
    </Col>
  );
}
