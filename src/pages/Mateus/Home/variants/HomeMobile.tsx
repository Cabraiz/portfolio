import { localizeLabel, useLabelLanguage } from '@/i18n/labels';
import { Fragment, useRef, useState } from "react";
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

const splitWords = (text: string) => text.split(/\s+/).filter(Boolean);

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
        {/* Cada palavra, linha, ícone e traço é uma peça que um agente traz;
            os blocos que têm o traço vinho também são peças (trazem o traço). */}
        <div ref={eyebrowRef} className={styles.eyebrow} data-agent-piece="">
          <span data-agent-piece="">{localizeLabel("TECNOLOGIA")}</span>
          <span data-agent-piece="">{localizeLabel("PESSOAS")}</span>
          <span data-agent-piece="">{localizeLabel("IMPACTO")}</span>
        </div>

        <h1 ref={titleRef} id="mobile-home-title" className={styles.title}>
          {/* Português e inglês usam o título de mercado em inglês. */}
          <span className={styles.titleLead} data-agent-piece="">{localizeLabel(contactLanguage === "es" ? "Engenheiro" : "Senior")}</span>
          <span className={styles.titleAccent}>
            {splitWords(localizeLabel(contactLanguage === "es" ? "IA & Full Stack" : "AI Engineer")).map((word, index, words) => (
              <Fragment key={word}>
                <span className={styles.titleWord} data-agent-piece="">{word}</span>
                {index < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </span>
        </h1>

        <div ref={identityRef} className={styles.identity} data-home-motion="identity">
          <strong data-agent-piece="">{localizeLabel("Mateus Cabral")}</strong>
          <span data-agent-piece="">{localizeLabel("Senior AI Engineer")}</span>
          <span className={styles.availability} data-home-availability="" data-agent-piece="">{localizeLabel("Remoto · CLT ou PJ")}</span>
        </div>

        <p ref={introRef} className={styles.intro}>
          {MOBILE_INTRO_LINES.map((line, index) => (
            <span
              key={line}
              className={styles.introLine}
              data-mobile-intro-line={index + 1}
              data-agent-piece=""
            >
              {localizeLabel(line)}{localizeLabel(index < MOBILE_INTRO_LINES.length - 1 ? " " : "")}
            </span>
          ))}
        </p>

        <div
          ref={partnersRef}
          className={styles.partners}
          aria-label={localizeLabel("Contato e ferramentas")}
        >
          <div
            ref={partnersHeadingRef}
            className={styles.partnersHeading}
            data-mobile-partners-heading="true"
            data-agent-piece=""
          >
            <span data-agent-piece="">{localizeLabel("CONTATO")}</span>
            <span data-agent-piece="">{localizeLabel("E FERRAMENTAS")}</span>
          </div>
          <div className={styles.partnerLogos}>
            {MOBILE_PARTNERS.map(({ label, Icon }, index) => (
              <div
                key={label}
                className={styles.partnerSignature}
                data-mobile-partner-item={label.toLowerCase()}
                data-mobile-partner-order={index + 1}
              >
                <Icon aria-hidden="true" data-agent-piece="" />
                <span data-agent-piece="">{localizeLabel(label)}</span>
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
          data-agent-piece=""
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

        <nav className={styles.actions} data-mobile-contact-actions data-agent-piece="" aria-label={localizeLabel("Ações de contato")}>
          {/* Barra, contorno de cada botão, ícone, texto e divisória: peças separadas. */}
          <a href={getWhatsAppHref(contactLanguage)} target="_blank" rel="noreferrer noopener" data-agent-piece="">
            <FaWhatsapp aria-hidden="true" data-agent-piece="" />
            <span data-agent-piece="">{localizeLabel("WhatsApp")}</span>
          </a>
          <span className={styles.actionDivider} aria-hidden="true" data-agent-piece="" />
          <a href={RESUME_HREFS[contactLanguage]} target="_blank" rel="noreferrer noopener" data-agent-piece="">
            <FaRegFileAlt aria-hidden="true" data-agent-piece="" />
            <span data-agent-piece="">{localizeLabel("Currículo")}</span>
          </a>
        </nav>
      </section>
    </main>
  );
}

export default HomeMobile;
