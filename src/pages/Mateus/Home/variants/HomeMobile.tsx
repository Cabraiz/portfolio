import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import { useRef, useState } from "react";
import { FaLinkedin, FaRegFileAlt, FaWhatsapp } from "react-icons/fa";
import { SiAnthropic, SiGmail } from "react-icons/si";

import portrait from "@/assets/Mateus/home/hero-mobile-portrait.webp";
import CodexIcon from "../components/CodexIcon";
import useMobileHomeBrandMotion from "../hooks/useMobileHomeBrandMotion";
import useHomeMobileMotion from "../hooks/useHomeMobileMotion";
import { getWhatsAppHref, RESUME_HREFS, resolveContactLanguage } from "../data/home.data";
import i18n from "@/i18n/i18n";
import styles from "./HomeMobile.module.css";
import { HomeMobilePortraitSkeleton } from './HomeMobileSkeleton';

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

const PORTRAIT_REVEAL_MS = 700;

function HomeMobile() {
  useLabelLanguage();
  const contactLanguage = resolveContactLanguage(i18n.resolvedLanguage);
  // Foto progressiva: a final entra por cima da prévia, perdendo o desfoque;
  // a prévia sai quando a transição termina.
  const [portraitRevealed, setPortraitRevealed] = useState(false);
  const [portraitLoaded, setPortraitLoaded] = useState(false);
  const pageRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const identityRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const partnersRef = useRef<HTMLDivElement>(null);
  const partnersHeadingRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);

  useMobileHomeBrandMotion({ pageRef, eyebrowRef, titleRef, identityRef, introRef, partnersRef, partnersHeadingRef, portraitRef });
  useHomeMobileMotion(pageRef);

  return (
    <main ref={pageRef} className={styles.page} data-mobile-editorial-home>
      <section className={styles.hero} aria-labelledby="mobile-home-title">
        <div ref={eyebrowRef} className={styles.eyebrow}>
          <span>{localizeLabel("TECNOLOGIA")}</span>
          <span>{localizeLabel("PESSOAS")}</span>
          <span>{localizeLabel("IMPACTO")}</span>
        </div>

        <h1 ref={titleRef} id="mobile-home-title" className={styles.title}>
          {/* Português e inglês usam o título de mercado em inglês. */}
          <span className={styles.titleLead}>{localizeLabel(contactLanguage === "es" ? "Engenheiro" : "Senior")}</span>
          <span className={styles.titleAccent}>{localizeLabel(contactLanguage === "es" ? "IA & Full Stack" : "AI Engineer")}</span>
        </h1>

        <div ref={identityRef} className={styles.identity} data-home-motion="identity">
          <strong>{localizeLabel("Mateus Cabral")}</strong>
          <span>{localizeLabel("Senior AI Engineer")}</span>
          <span className={styles.availability} data-home-availability="">{localizeLabel("Remoto · CLT ou PJ")}</span>
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

        {!portraitLoaded && <HomeMobilePortraitSkeleton/>}
        <img
          ref={portraitRef}
          className={styles.portrait}
          src={portrait}
          alt={localizeLabel("Retrato de Mateus Cabral")}
          width={1024}
          height={1536}
          data-reveal={portraitRevealed ? "done" : "pending"}
          onLoad={(event) => {
            const image = event.currentTarget;
            void image.decode().catch(() => undefined).then(() => {
              if (!image.isConnected) return;
              setPortraitRevealed(true);
              const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              window.setTimeout(() => setPortraitLoaded(true), reduceMotion ? 0 : PORTRAIT_REVEAL_MS);
            });
          }}
          draggable={false}
        />

        <nav className={styles.actions} data-mobile-contact-actions aria-label={localizeLabel("Ações de contato")}>
          <a href={getWhatsAppHref(contactLanguage)} target="_blank" rel="noreferrer noopener">
            <FaWhatsapp aria-hidden="true" />
            <span>{localizeLabel("WhatsApp")}</span>
          </a>
          <span className={styles.actionDivider} aria-hidden="true" />
          <a href={RESUME_HREFS[contactLanguage]} target="_blank" rel="noreferrer noopener">
            <FaRegFileAlt aria-hidden="true" />
            <span>{localizeLabel("Currículo")}</span>
          </a>
        </nav>
      </section>
    </main>
  );
}

export default HomeMobile;
