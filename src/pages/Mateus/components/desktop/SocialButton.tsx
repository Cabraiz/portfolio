import { Image } from "react-bootstrap";
import { normalizeTooltipClassName } from "../../mateusDesktop.utils";

export type SocialButtonProps = Readonly<{
  href: string;
  icon: string;
  alt: string;
  isScrollToTop?: boolean;
}>;

export default function SocialButton({
  href,
  icon,
  alt,
  isScrollToTop,
}: SocialButtonProps) {
  const normalizedTooltipClass = normalizeTooltipClassName(alt);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="social-wrapper"
      aria-label={alt}
    >
      <div className={`social-link ${isScrollToTop ? "scrollToTopButton" : ""}`}>
        <Image className="imagesize" src={icon} alt={alt} />
      </div>
      <div className={`tooltip-custom tooltip-${normalizedTooltipClass}`}>
        {alt}
      </div>
    </a>
  );
}
