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

// Fundo piscando
const flash = keyframes`
  0% { background: #0a0a0a; }
  20% { background: #d4af37; }
  40% { background: #0a0a0a; }
  60% { background: #d4af37; }
  100% { background: #0a0a0a; }
`;

const Container = styled.div<{ flashing: boolean }>`
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
  ${(props) =>
    props.flashing &&
    css`
      animation: ${flash} 1.2s ease forwards;
    `}
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

const AnimatedBrand = styled.div`
  font-size: 6vw;
  font-weight: 900;
  background: linear-gradient(90deg, #d4af37, #fff, #d4af37);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-align: center;
  opacity: 0;
  transform: scale(0.8);
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

const MateusMobile: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const [flashing, setFlashing] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
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
    setShowBrand(true);
    setFlashing(true);

    if (brandRef.current) {
      gsap.fromTo(
        brandRef.current,
        { opacity: 0, scale: 0.8, rotate: 0 },
        {
          opacity: 1,
          scale: 1,
          rotate: 360,
          duration: 1,
          ease: "power3.out",
        }
      );
    }

    setTimeout(() => {
      if (brandRef.current) {
        gsap.to(brandRef.current, {
          opacity: 0,
          scale: 0.8,
          duration: 0.6,
          ease: "power3.in",
        });
      }
      setFlashing(false);
      setTimeout(() => setShowBrand(false), 600);
    }, 2000);
  };

  return (
    <Container ref={containerRef} flashing={flashing}>
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
      {!showBrand && (
        <Subtitle onClick={handleSubtitleClick}>
          Clique aqui e veja algo especial.
        </Subtitle>
      )}
      {showBrand && (
        <AnimatedBrand ref={brandRef}>CABRAIZ</AnimatedBrand>
      )}
      <CallToAction onClick={() => window.location.href = "/contato"}>
        Agendar Consultoria Exclusiva
      </CallToAction>
    </Container>
  );
};

export default MateusMobile;
