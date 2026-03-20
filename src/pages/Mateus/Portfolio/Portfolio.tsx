import { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import styles from "./Portfolio.module.css";
import ConversationSection from "./sections/ConversationSection/ConversationSection";
import rawPartners from "./sections/ConversationSection/data/partners";
import {
  CONVERSATION_PRIMARY_CTA,
  CONVERSATION_SECONDARY_CTA,
} from "./sections/ConversationSection/constants";
import type {
  ConversationCTAAction,
  ConversationPartner,
  ConversationSectionCopy,
} from "./sections/ConversationSection/types";

import imagem1 from "../../../assets/Mateus/portfolio/imagem1.png";
import imagem2 from "../../../assets/Mateus/portfolio/imagem2.png";
import imagem3 from "../../../assets/Mateus/portfolio/imagem3.png";
import imagem4 from "../../../assets/Mateus/portfolio/imagem4.png";
import imagem5 from "../../../assets/Mateus/portfolio/imagem5.png";

import logo1 from "../../../assets/Mateus/portfolio/logos/logo1.png";
import logo2 from "../../../assets/Mateus/portfolio/logos/logo2.png";
import logo3 from "../../../assets/Mateus/portfolio/logos/logo3.png";
import logo4 from "../../../assets/Mateus/portfolio/logos/logo4.png";
import logo5 from "../../../assets/Mateus/portfolio/logos/logo5.png";

gsap.registerPlugin(ScrollTrigger);

type PortfolioItem = Readonly<{
  name: string;
  image: string;
  date: string;
  logo: string;
}>;

type PortfolioMediaConditions = Readonly<{
  isCompactDesktop: boolean;
  isMobileOrTablet: boolean;
  prefersReducedMotion: boolean;
}>;

type PortfolioAnimationSettings = Readonly<{
  cardOffsetY: number;
  dateOffsetY: number;
  initialScale: number;
  duration: number;
  start: string;
  end: string;
}>;

type RawPartner = (typeof rawPartners)[number];
type CleanupFn = () => void;

const portfolioData: ReadonlyArray<PortfolioItem> = [
  { name: "ERP VAREJO", image: imagem1, date: "2021", logo: logo1 },
  { name: "APP BANK", image: imagem2, date: "2022", logo: logo2 },
  { name: "APP BARBER", image: imagem3, date: "2023", logo: logo3 },
  { name: "SITE ADV", image: imagem4, date: "2020", logo: logo4 },
  { name: "SITE CABELEIREIRA", image: imagem5, date: "2021", logo: logo5 },
];

const conversationCopy = {
  eyebrow: "Parcerias e entregas",
  title: "Vamos conversar",
  description:
    "Desenvolvo experiências digitais, interfaces profissionais e produtos com foco em clareza, performance e qualidade de entrega.",
  highlights: [
    "Experiências responsivas com foco em acabamento profissional",
    "Estrutura modular para evolução do portfólio sem monólito visual",
    "Base preparada para desktop compacto, inclusive em telas 720p",
  ],
  supportText:
    "Posso adaptar esta seção ao fluxo atual do portfolio preservando clareza estrutural, consistência visual e boa manutenção.",
  ctaGroupAriaLabel: "Ações principais de contato e currículo",
  partnersAriaLabel: "Parceiros e marcas atendidas",
} satisfies ConversationSectionCopy;

const conversationPrimaryAction = {
  ...CONVERSATION_PRIMARY_CTA,
  href: "#contact",
  label: "VAMOS CONVERSAR",
  ariaLabel: "Ir para a seção de contato",
} satisfies ConversationCTAAction;

const conversationSecondaryAction = {
  ...CONVERSATION_SECONDARY_CTA,
  href: "#resume",
  label: "CURRÍCULO",
  ariaLabel: "Ir para a seção de currículo",
} satisfies ConversationCTAAction;

function getAnimationSettings(
  isCompactDesktop: boolean,
): PortfolioAnimationSettings {
  return {
    cardOffsetY: isCompactDesktop ? 28 : 36,
    dateOffsetY: isCompactDesktop ? 16 : 20,
    initialScale: isCompactDesktop ? 0.992 : 0.985,
    duration: isCompactDesktop ? 0.62 : 0.72,
    start: isCompactDesktop ? "top 88%" : "top 84%",
    end: "bottom 24%",
  };
}

function setInitialAnimatedState(
  card: HTMLElement,
  date: HTMLElement | null,
  settings: PortfolioAnimationSettings,
): void {
  gsap.set(card, {
    autoAlpha: 0,
    y: settings.cardOffsetY,
    scale: settings.initialScale,
    force3D: true,
    willChange: "transform, opacity",
    transformOrigin: "center center",
  });

  if (date) {
    gsap.set(date, {
      autoAlpha: 0,
      y: settings.dateOffsetY,
      force3D: true,
      willChange: "transform, opacity",
    });
  }
}

function clearAnimatedInlineProps(
  cards: readonly HTMLElement[],
  dates: readonly HTMLElement[],
): void {
  gsap.set(cards, {
    clearProps: "transform,opacity,willChange",
  });

  if (dates.length) {
    gsap.set(dates, {
      clearProps: "transform,opacity,willChange",
    });
  }
}

function destroyScrollState(
  triggers: readonly ScrollTrigger[],
  cards: readonly HTMLElement[],
  dates: readonly HTMLElement[],
): void {
  for (const trigger of triggers) {
    trigger.kill();
  }

  for (const card of cards) {
    gsap.killTweensOf(card);
    card.style.willChange = "auto";
  }

  for (const date of dates) {
    gsap.killTweensOf(date);
    date.style.willChange = "auto";
  }
}

function createCardRevealTrigger(args: Readonly<{
  card: HTMLElement;
  row: HTMLElement;
  date: HTMLElement | null;
  settings: PortfolioAnimationSettings;
}>): ScrollTrigger {
  const { card, row, date, settings } = args;

  const timeline = gsap.timeline({
    paused: true,
    defaults: {
      duration: settings.duration,
      ease: "power3.out",
      overwrite: "auto",
    },
    onStart: () => {
      card.style.willChange = "transform, opacity";

      if (date) {
        date.style.willChange = "transform, opacity";
      }
    },
    onComplete: () => {
      card.style.willChange = "auto";

      if (date) {
        date.style.willChange = "auto";
      }
    },
    onReverseComplete: () => {
      card.style.willChange = "auto";

      if (date) {
        date.style.willChange = "auto";
      }
    },
  });

  timeline.to(
    card,
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
    },
    0,
  );

  if (date) {
    timeline.to(
      date,
      {
        autoAlpha: 1,
        y: 0,
      },
      0.06,
    );
  }

  return ScrollTrigger.create({
    trigger: row,
    start: settings.start,
    end: settings.end,
    animation: timeline,
    toggleActions: "play none none reverse",
    fastScrollEnd: true,
    invalidateOnRefresh: true,
  });
}

function setupPortfolioScrollAnimations(args: Readonly<{
  scope: HTMLDivElement;
  conditions: PortfolioMediaConditions;
}>): CleanupFn | undefined {
  const { scope, conditions } = args;
  const { isCompactDesktop, isMobileOrTablet, prefersReducedMotion } =
    conditions;

  const cards = Array.from(
    scope.querySelectorAll<HTMLElement>("[data-portfolio-card='true']"),
  );
  const rows = Array.from(
    scope.querySelectorAll<HTMLElement>("[data-portfolio-row='true']"),
  );
  const dates = Array.from(
    scope.querySelectorAll<HTMLElement>("[data-portfolio-date='true']"),
  );

  if (!cards.length || !rows.length) {
    return undefined;
  }

  if (isMobileOrTablet || prefersReducedMotion) {
    clearAnimatedInlineProps(cards, dates);
    return undefined;
  }

  const settings = getAnimationSettings(isCompactDesktop);
  const triggers: ScrollTrigger[] = [];
  const itemCount = Math.min(cards.length, rows.length);

  for (let index = 0; index < itemCount; index += 1) {
    const card = cards[index];
    const row = rows[index];
    const date = dates[index] ?? null;

    setInitialAnimatedState(card, date, settings);

    triggers.push(
      createCardRevealTrigger({
        card,
        row,
        date,
        settings,
      }),
    );
  }

  return () => {
    destroyScrollState(triggers, cards, dates);
  };
}

function mapPartnerToConversationPartner(
  partner: RawPartner,
): ConversationPartner {
  const alt =
    "imageAlt" in partner &&
    typeof partner.imageAlt === "string" &&
    partner.imageAlt
      ? partner.imageAlt
      : partner.name;

  const logoSrc =
    "imageSrc" in partner && typeof partner.imageSrc === "string"
      ? partner.imageSrc
      : "";

  const external =
    "external" in partner && typeof partner.external === "boolean"
      ? partner.external
      : undefined;

  return {
    id: partner.id,
    name: partner.name,
    alt,
    logoSrc,
    href: partner.href,
    external,
  };
}

export default function Portfolio() {
  const containerRef = useRef<HTMLDivElement>(null);

  const conversationPartners = useMemo(
    () => rawPartners.map(mapPartnerToConversationPartner),
    [],
  );

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const scope = containerRef.current;
    const mm = gsap.matchMedia();

    mm.add(
      {
        isCompactDesktop: "(max-height: 720px) and (min-width: 961px)",
        isMobileOrTablet: "(max-width: 960px)",
        prefersReducedMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) =>
        setupPortfolioScrollAnimations({
          scope,
          conditions: context.conditions as PortfolioMediaConditions,
        }),
    );

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.root}>
      <section
        className={styles.portfolioSection}
        aria-labelledby="portfolio-title"
      >
        <div className={styles.header}>
          <span className={styles.eyebrow}>Projetos selecionados</span>

          <h2 id="portfolio-title" className={styles.title}>
            Portfólio
          </h2>

          <p className={styles.description}>
            Alguns trabalhos com foco em produto, interface e execução visual.
            A seção foi simplificada para priorizar fluidez, legibilidade e uma
            rolagem mais estável no desktop.
          </p>
        </div>

        <div className={styles.cardsStack}>
          {portfolioData.map((item) => (
            <article
              key={item.name}
              className={styles.cardRow}
              data-portfolio-row="true"
            >
              <span className={styles.cardDate} data-portfolio-date="true">
                {item.date}
              </span>

              <div
                className={styles.animatedCard}
                data-portfolio-card="true"
                data-name={item.name}
              >
                <div className={styles.projectVisual}>
                  <img
                    src={item.image}
                    alt={`Preview do projeto ${item.name}`}
                    className={styles.projectImage}
                    loading="lazy"
                  />
                </div>

                <div className={styles.projectMeta}>
                  <div className={styles.projectTextBlock}>
                    <span className={styles.projectLabel}>Projeto</span>
                    <h3 className={styles.projectName}>{item.name}</h3>
                    <span className={styles.projectYear}>{item.date}</span>
                  </div>

                  <div className={styles.projectLogoBox}>
                    <img
                      src={item.logo}
                      alt={`Logo ${item.name}`}
                      className={styles.projectLogo}
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ConversationSection
        id="conversation"
        className={styles.conversationSection}
        copy={conversationCopy}
        primaryAction={conversationPrimaryAction}
        secondaryAction={conversationSecondaryAction}
        partners={conversationPartners}
        titleAs="h2"
      />
    </div>
  );
}
