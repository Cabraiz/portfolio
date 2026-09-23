import { useLayoutEffect, useRef } from "react";
import { FaLinkedin, FaRegFileAlt, FaWhatsapp } from "react-icons/fa";
import { SiAnthropic, SiGmail, SiOpenai } from "react-icons/si";

import portrait from "@/assets/Mateus/home/hero-mobile-portrait.png";
import { ensureGsapRuntime } from "@/features/scroll/gsapRuntime";
import { RESUME_HREF, WHATSAPP_HREF } from "../data/home.data";
import styles from "./HomeMobile.module.css";

const MOBILE_PARTNERS = [
  { label: "LinkedIn", Icon: FaLinkedin },
  { label: "Gmail", Icon: SiGmail },
  { label: "Claude", Icon: SiAnthropic },
  { label: "Codex", Icon: SiOpenai },
] as const;

function HomeMobile() {
  const pageRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const identityRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const partnersRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const page = pageRef.current;
    const logo = document.querySelector<HTMLElement>(
      '[data-mobile-brand-pusher="true"]',
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!page || !logo || reducedMotion) {
      return;
    }

    const { gsap, ScrollTrigger } = ensureGsapRuntime();
    const blockCandidates: Array<HTMLElement | null> = [
      eyebrowRef.current,
      titleRef.current,
      identityRef.current,
      introRef.current,
      partnersRef.current,
    ];
    const textBlocks = blockCandidates.filter(
      (element): element is HTMLElement => element !== null,
    );

    const context = gsap.context(() => {
      gsap.set([logo, ...textBlocks], {
        willChange: "transform",
        force3D: true,
      });

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: page,
          start: "top top",
          end: "bottom top+=72",
          scrub: 0.45,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(
          logo,
          {
            y: () => Math.min(380, window.innerHeight * 0.5),
            rotation: 2,
            scale: 1.08,
            duration: 0.74,
          },
          0,
        )
        .to(
          logo,
          {
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 0.26,
            ease: "power2.inOut",
          },
          0.74,
        )
        .to(
          portraitRef.current,
          {
            y: -22,
            scale: 1.018,
            duration: 1,
          },
          0,
        );

      const pushBlock = (
        element: HTMLElement | null,
        start: number,
        distance: number,
      ) => {
        if (!element) return;

        timeline
          .to(
            element,
            {
              x: distance,
              skewX: -1.2,
              duration: 0.09,
              ease: "power2.out",
            },
            start,
          )
          .to(
            element,
            {
              x: 0,
              skewX: 0,
              duration: 0.13,
              ease: "power2.inOut",
            },
            start + 0.09,
          );
      };

      pushBlock(eyebrowRef.current, 0.015, 58);
      pushBlock(titleRef.current, 0.055, 56);
      pushBlock(identityRef.current, 0.09, 60);
      pushBlock(introRef.current, 0.17, 66);
      pushBlock(partnersRef.current, 0.3, 62);
    }, page);

    const refreshFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      context.revert();
      gsap.set([logo, ...textBlocks, portraitRef.current], {
        clearProps: "transform,willChange",
      });
    };
  }, []);

  return (
    <main ref={pageRef} className={styles.page} data-mobile-editorial-home>
      <section className={styles.hero} aria-labelledby="mobile-home-title">
        <div ref={eyebrowRef} className={styles.eyebrow}>
          <span>TECNOLOGIA</span>
          <span>PESSOAS</span>
          <span>IMPACTO</span>
        </div>

        <h1 ref={titleRef} id="mobile-home-title" className={styles.title}>
          <span className={styles.titleLead}>Dev</span>
          <span className={styles.titleAccent}>Back-End &amp; APIs</span>
        </h1>

        <div ref={identityRef} className={styles.identity}>
          <strong>Mateus Cabral</strong>
          <span>Engenheiro de Software</span>
          <span>Fundador</span>
        </div>

        <p ref={introRef} className={styles.intro}>
          Transformando ideias em produtos reais, do código ao impacto.
        </p>

        <div
          ref={partnersRef}
          className={styles.partners}
          aria-label="Clientes e parceiros"
        >
          <div className={styles.partnersHeading}>
            <span>CLIENTES</span>
            <span>E PARCEIROS</span>
          </div>
          <div className={styles.partnerLogos}>
            {MOBILE_PARTNERS.map(({ label, Icon }) => (
              <div key={label} className={styles.partnerSignature}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <img
          ref={portraitRef}
          className={styles.portrait}
          src={portrait}
          alt="Mateus Cabral"
          draggable={false}
        />

        <nav className={styles.actions} aria-label="Ações de contato">
          <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer noopener">
            <FaWhatsapp aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
          <span className={styles.actionDivider} aria-hidden="true" />
          <a href={RESUME_HREF} target="_blank" rel="noreferrer noopener">
            <FaRegFileAlt aria-hidden="true" />
            <span>Currículo</span>
          </a>
        </nav>
      </section>
    </main>
  );
}

export default HomeMobile;
