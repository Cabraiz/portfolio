import React, { useLayoutEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import logo from "../../assets/icones/logo.svg";

gsap.registerPlugin(ScrollTrigger);

// Animação de brilho dourado
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

const Logo = styled.img`
  width: 120px;
  height: auto;
  margin-bottom: 2rem;
  animation: ${shine} 4s linear infinite;
  background: linear-gradient(90deg, #d4af37, #fff, #d4af37);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
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
`;

const Subtitle = styled.p`
  font-size: 4vw;
  opacity: 0.8;
  text-align: center;
  max-width: 600px;
  margin-top: 1rem;
`;

const CallToAction = styled.button`
  margin-top: 2rem;
  background: #d4af37;
  color: #111;
  border: none;
  padding: 1rem 2rem;
  font-size: 4vw;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background: #fff;
    color: #000;
  }
`;

// Partículas decorativas
const Particle = styled.span<{ left: string; size: string; delay: string; duration: string }>`
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
  const lenis = useLenis();

  useLayoutEffect(() => {
    if (!containerRef.current || !lenis?.rootElement) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          y: 40,
          filter: "blur(10px)",
        },
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

  return (
    <Container ref={containerRef}>
      {/* Partículas */}
      {Array.from({ length: 15 }).map((_, i) => (
        <Particle
          key={i}
          left={`${Math.random() * 100}%`}
          size={`${Math.random() * 8 + 4}px`}
          delay={`${Math.random() * 5}s`}
          duration={`${Math.random() * 15 + 10}s`}
        />
      ))}
      <Logo src={logo} alt="Logo" />
      <Title>O Verdadeiro Profissional</Title>
      <Subtitle>
        Transforme sua presença digital com consultoria de alto nível: websites, vídeos, redes sociais e muito mais.
      </Subtitle>
      <CallToAction onClick={() => window.location.href = "/contato"}>
        Quero Criar Meu Site
      </CallToAction>
    </Container>
  );
};

export default MateusMobile;
