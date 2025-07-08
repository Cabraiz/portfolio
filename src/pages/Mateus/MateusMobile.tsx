import React, { useLayoutEffect, useRef, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import logo from "../../assets/icones/logo.svg";

gsap.registerPlugin(ScrollTrigger);

// Brilho dourado
const shine = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// Partículas flutuantes
const float = keyframes`
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
`;

const Container = styled.div`
  position: relative;
  min-height: 100vh;
  background: linear-gradient(160deg, #0a0a0a, #1a1a1a);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 2rem;
`;

const LogoWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const Logo = styled.img`
  width: 120px;
  height: auto;
  animation: ${shine} 4s linear infinite;
  background: linear-gradient(90deg, #d4af37, #fff, #d4af37);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
`;

const DiscountBadge = styled.div`
  position: absolute;
  top: 30%;
  right: -0.1vw;
  background: rgba(212, 175, 55, 0.05);
  color: #d4af37;
  font-size: 2.2vw;
  font-weight: 600;
  padding: 0.4rem 0.3rem 0.4rem 0.8rem;
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 0.1em;
`;

const Title = styled.h1`
  font-size: 4vw;
  font-weight: 700;
  background: linear-gradient(90deg, #d4af37, #fff);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-align: center;
  margin: 0;
  margin-top: 20px;
`;

const Subtitle = styled.button`
  background: none;
  border: none;
  font-size: 2.5vw;
  opacity: 0.9;
  text-align: center;
  max-width: 700px;
  margin-top: 1.2rem;
  line-height: 1.4;
  cursor: pointer;
  color: #ddd;
  transition: all 0.3s ease;

  &:hover {
    color: #fff;
    transform: scale(1.02);
  }

  &:focus {
    outline: none;
  }
`;

const CallToAction = styled.button`
  margin-top: 2rem;
  background: #d4af37;
  color: #111;
  border: none;
  padding: 1rem 2rem;
  font-size: 4vw;
  font-weight: 700;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background: #fff;
    color: #000;
  }
`;

const Particle = styled.span<{
  left: string;
  size: string;
  delay: string;
  duration: string;
}>`
  position: absolute;
  bottom: -10vh;
  left: ${(props) => props.left};
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  background: radial-gradient(circle, #d4af37 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0.6;
  animation: ${float} ${(props) => props.duration} linear infinite;
  animation-delay: ${(props) => props.delay};
`;

// Buraco Negro
const BlackHole = styled.div<{ active: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 80%, transparent 100%);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  pointer-events: none;
  ${(props) =>
    props.active &&
    css`
      animation: growHole 2s forwards;
    `}

  @keyframes growHole {
    0% {
      width: 0;
      height: 0;
      transform: translate(-50%, -50%) scale(0);
    }
    100% {
      width: 300vh;
      height: 300vh;
      transform: translate(-50%, -50%) scale(1);
    }
  }
`;

const MateusMobile: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [holeActive, setHoleActive] = useState(false);
  const lenis = useLenis();

  useLayoutEffect(() => {
    if (!containerRef.current || !lenis?.rootElement) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0)",
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: containerRef.current,
            scroller: lenis.rootElement,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [lenis]);

  const handleSubtitleClick = () => {
    if (!contentRef.current) return;

    setHoleActive(true);

    // Tudo sendo sugado
    gsap.to(contentRef.current.children, {
      x: () => (Math.random() - 0.5) * 400,
      y: () => (Math.random() - 0.5) * 400,
      rotation: () => (Math.random() - 0.5) * 360,
      scale: 0,
      opacity: 0,
      duration: 2,
      ease: "power3.in",
    });

    // Volta ao normal depois de 3s
    setTimeout(() => {
    if (contentRef.current) {
      gsap.to(contentRef.current.children, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
      });
    }
    setHoleActive(false);
  }, 3000);

  };

return (
  <Container ref={containerRef}>
    <BlackHole active={holeActive} />
    <div
      ref={contentRef}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {Array.from({ length: 15 }).map((_, i) => (
        <Particle
          key={i}
          left={`${Math.random() * 100}%`}
          size={`${Math.random() * 8 + 4}px`}
          delay={`${Math.random() * 5}s`}
          duration={`${Math.random() * 15 + 10}s`}
        />
      ))}
      <LogoWrapper>
        <Logo src={logo} alt="Logo" />
        <DiscountBadge>75% OFF</DiscountBadge>
      </LogoWrapper>
      <Title>Confiança Digital</Title>
      <Subtitle onClick={handleSubtitleClick}>
        Clique aqui e veja algo especial
      </Subtitle>
      <CallToAction onClick={() => window.location.href = "/contato"}>
        Agendar Consultoria Exclusiva
      </CallToAction>
    </div>
  </Container>
);

};

export default MateusMobile;
