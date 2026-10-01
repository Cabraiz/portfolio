import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import { useRef } from "react";
import { FaLinkedin, FaRegFileAlt, FaWhatsapp } from "react-icons/fa";
import { SiAnthropic, SiGmail } from "react-icons/si";

import portrait from "@/assets/Mateus/home/hero-mobile-portrait.png";
import CodexIcon from "../components/CodexIcon";
import useMobileHomeBrandMotion from "../hooks/useMobileHomeBrandMotion";
import { RESUME_HREF, WHATSAPP_HREF } from "../data/home.data";
import styles from "./HomeMobile.module.css";

const MOBILE_PARTNERS = [
  { label: "LinkedIn", Icon: FaLinkedin },
  { label: "Gmail", Icon: SiGmail },
  { label: "Claude", Icon: SiAnthropic },
  { label: "Codex", Icon: CodexIcon },
] as const;
const MOBILE_INTRO_LINES = [
  "Transformando",
  "ideias em",
  "produtos reais,",
  "do código ao",
  "impacto.",
] as const;

function HomeMobile() {
  useLabelLanguage();
  const pageRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const identityRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const partnersRef = useRef<HTMLDivElement>(null);
  const partnersHeadingRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);

  useMobileHomeBrandMotion({ pageRef, eyebrowRef, titleRef, identityRef, introRef, partnersRef, partnersHeadingRef, portraitRef });

  return (
    <main ref={pageRef} className={styles.page} data-mobile-editorial-home>
      <section className={styles.hero} aria-labelledby="mobile-home-title">
        <div ref={eyebrowRef} className={styles.eyebrow}>
          <span>{localizeLabel("TECNOLOGIA")}</span>
          <span>{localizeLabel("PESSOAS")}</span>
          <span>{localizeLabel("IMPACTO")}</span>
        </div>

        <h1 ref={titleRef} id="mobile-home-title" className={styles.title}>
          <span className={styles.titleLead}>{localizeLabel("Dev")}</span>
          <span className={styles.titleAccent}>{localizeLabel("Back-End & APIs")}</span>
        </h1>

        <div ref={identityRef} className={styles.identity}>
          <strong>{localizeLabel("Mateus Cabral")}</strong>
          <span>{localizeLabel("Engenheiro de Software")}</span>
          <span>{localizeLabel("Fundador")}</span>
        </div>

        <p ref={introRef} className={styles.intro}>
          {MOBILE_INTRO_LINES.map((line, index) => (
            <span
              key={line}
              className={styles.introLine}
              data-mobile-intro-line={index + 1}
            >
              {localizeLabel(line)}{localizeLabel(index < MOBILE_INTRO_LINES.length - 1 ? " " : "")}
            </span>
          ))}
        </p>

        <div
          ref={partnersRef}
          className={styles.partners}
          aria-label={localizeLabel("Clientes e parceiros")}
        >
          <div
            ref={partnersHeadingRef}
            className={styles.partnersHeading}
            data-mobile-partners-heading="true"
          >
            <span>{localizeLabel("CLIENTES")}</span>
            <span>{localizeLabel("E PARCEIROS")}</span>
          </div>
          <div className={styles.partnerLogos}>
            {MOBILE_PARTNERS.map(({ label, Icon }, index) => (
              <div
                key={label}
                className={styles.partnerSignature}
                data-mobile-partner-item={label.toLowerCase()}
                data-mobile-partner-order={index + 1}
              >
                <Icon aria-hidden="true" />
                <span>{localizeLabel(label)}</span>
              </div>
            ))}
          </div>
        </div>

        <img
          ref={portraitRef}
          className={styles.portrait}
          src={portrait}
          alt={localizeLabel("Mateus Cabral")}
          draggable={false}
        />

        <nav className={styles.actions} aria-label={localizeLabel("Ações de contato")}>
          <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer noopener">
            <FaWhatsapp aria-hidden="true" />
            <span>{localizeLabel("WhatsApp")}</span>
          </a>
          <span className={styles.actionDivider} aria-hidden="true" />
          <a href={RESUME_HREF} target="_blank" rel="noreferrer noopener">
            <FaRegFileAlt aria-hidden="true" />
            <span>{localizeLabel("Currículo")}</span>
          </a>
        </nav>
      </section>
    </main>
  );
}

export default HomeMobile;
