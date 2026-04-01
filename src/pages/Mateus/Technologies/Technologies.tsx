import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { shouldDisableScrollFades } from "../../../features/scroll/scrollMotionFlags";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion(): boolean {
  return (
    "matchMedia" in globalThis &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const sectionStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(255,255,255,0.06) 0%, rgba(17,17,17,1) 42%)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "clamp(28px, 4vw, 56px)",
};

const contentStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1200px",
  display: "grid",
  gap: "clamp(20px, 2vw, 28px)",
};

const heroCardStyle: React.CSSProperties = {
  display: "grid",
  gap: "18px",
  padding: "clamp(24px, 3vw, 40px)",
  borderRadius: "28px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  background: "rgba(255, 255, 255, 0.035)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 24px 80px rgba(0, 0, 0, 0.28)",
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.62)",
  fontSize: "clamp(0.82rem, 1vw, 0.95rem)",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(2.2rem, 5vw, 4.75rem)",
  lineHeight: 1.02,
  fontWeight: 700,
  letterSpacing: "-0.04em",
};

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: "860px",
  color: "rgba(255,255,255,0.74)",
  fontSize: "clamp(1rem, 1.4vw, 1.14rem)",
  lineHeight: 1.75,
};

const highlightsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const highlightCardStyle: React.CSSProperties = {
  padding: "18px 18px 16px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
};

const highlightTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "0.98rem",
  fontWeight: 600,
};

const highlightTextStyle: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.68)",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const statusCardStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "20px 22px",
  borderRadius: "22px",
  border: "1px dashed rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.02)",
};

const statusTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 600,
};

const statusTextStyle: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.68)",
  fontSize: "0.96rem",
  lineHeight: 1.7,
};

const highlights = [
  {
    title: "Tecnologias principais",
    text: "Espaço dedicado para stack por linguagem, framework, banco, cloud e ferramentas.",
  },
  {
    title: "Qualificações aplicadas",
    text: "A seção deixa de falar de preço e passa a comunicar capacidade técnica real.",
  },
  {
    title: "Contagem por projeto",
    text: "Estrutura preparada para exibir quantos projetos utilizaram cada tecnologia.",
  },
] as const;

const Technologies: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    if (prefersReducedMotion() || shouldDisableScrollFades()) {
      gsap.set(container, {
        autoAlpha: 1,
        y: 0,
        clearProps: "transform,opacity,willChange",
      });

      container.style.willChange = "auto";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(container, {
        autoAlpha: 0,
        y: 36,
        willChange: "transform, opacity",
        force3D: true,
      });

      gsap.to(container, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        overwrite: "auto",
        onStart: () => {
          container.style.willChange = "transform, opacity";
        },
        onComplete: () => {
          container.style.willChange = "auto";
        },
        onReverseComplete: () => {
          container.style.willChange = "auto";
        },
        scrollTrigger: {
          trigger: container,
          start: "top 82%",
          end: "bottom 28%",
          toggleActions: "play none none reverse",
          fastScrollEnd: true,
          invalidateOnRefresh: true,
        },
      });
    }, container);

    return () => {
      ctx.revert();
      container.style.willChange = "auto";
    };
  }, []);

  return (
    <section
      ref={containerRef}
      style={sectionStyle}
      aria-labelledby="technologies-section-title"
    >
      <div style={contentStyle}>
        <div style={heroCardStyle}>
          <p style={eyebrowStyle}>Tecnologias & Qualificações</p>

          <h1 id="technologies-section-title" style={titleStyle}>
            Stack técnica apresentada de forma mais profissional.
          </h1>

          <p style={descriptionStyle}>
            Esta seção substitui a antiga abordagem de preços por uma leitura
            mais fiel do seu perfil: tecnologias que você domina, qualificações
            aplicadas e, na próxima etapa de dados, a contagem de projetos
            realizados com cada stack.
          </p>

          <div style={highlightsGridStyle}>
            {highlights.map((item) => (
              <article key={item.title} style={highlightCardStyle}>
                <h2 style={highlightTitleStyle}>{item.title}</h2>
                <p style={highlightTextStyle}>{item.text}</p>
              </article>
            ))}
          </div>

          <div style={statusCardStyle}>
            <h2 style={statusTitleStyle}>Próxima integração recomendada</h2>
            <p style={statusTextStyle}>
              Para a lista real de tecnologias e a contagem automática por
              projeto, a origem dos dados deve vir de{" "}
              <strong>portfolio.data.ts</strong> e do tipo de projeto em{" "}
              <strong>types.ts</strong>, evitando números estáticos ou conteúdo
              manual duplicado.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Technologies;
