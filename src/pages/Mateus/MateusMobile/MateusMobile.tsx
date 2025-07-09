import React, { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import logo from "../../../assets/icones/logo.svg";
import vortexSound from "public/sounds/vortex.mp3";

import {
  Container,
  LogoWrapper,
  Logo,
  DiscountBadge,
  Title,
  Subtitle,
  CallToAction,
  Particle,
  BlackHole,
  BookingFormContainer,
  FormTitle,
  Select,
  ConfirmButton
} from "./MateusMobile.styles";

gsap.registerPlugin(ScrollTrigger);

const MateusMobile: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [holeActive, setHoleActive] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
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

    const audio = new Audio(vortexSound);
    audio.play();

    setHoleActive(true);

    gsap.to(contentRef.current.children, {
      x: () => (Math.random() - 0.5) * 400,
      y: () => (Math.random() - 0.5) * 400,
      rotation: () => (Math.random() - 0.5) * 360,
      scale: 0,
      opacity: 0,
      duration: 2,
      ease: "power3.in",
    });

    setTimeout(() => {
      setShowBookingForm(true);
      setHoleActive(false);

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

      if (logoRef.current && titleRef.current) {
        gsap.to([logoRef.current, titleRef.current], {
          y: 80,
          duration: 1,
          ease: "power3.out",
        });
      }
    }, 2500);
  };

  const handleCallToAction = () => {
    setShowBookingForm(true);
  };

  return (
    <Container ref={containerRef}>
      <BlackHole active={holeActive} />
      {Array.from({ length: 30 }).map((_, i) => (
        <Particle
          key={i}
          left={`${Math.random() * 100}%`}
          size={`${Math.random() * 8 + 4}px`}
          delay={`${Math.random() * 3}s`}
          duration={`${Math.random() * 6 + 8}s`}
        />
      ))}
      <div
        ref={contentRef}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <LogoWrapper ref={logoRef}>
          <Logo src={logo} alt="Logo" />
          <DiscountBadge>75% OFF</DiscountBadge>
        </LogoWrapper>
        <Title ref={titleRef}>Confiança Digital</Title>
        {!showBookingForm && (
          <>
            <Subtitle onClick={handleSubtitleClick}>
              Clique aqui e veja algo especial
            </Subtitle>
            <CallToAction onClick={handleCallToAction}>
              Agendar Consultoria Exclusiva
            </CallToAction>
          </>
        )}
      </div>

      {showBookingForm && (
        <BookingFormContainer>
          <FormTitle>Agende Sua Consultoria</FormTitle>
          <Select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="">Selecione o dia</option>
            <option value="2025-07-10">10/07/2025</option>
            <option value="2025-07-11">11/07/2025</option>
            <option value="2025-07-12">12/07/2025</option>
          </Select>
          {selectedDay && (
            <Select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              <option value="">Selecione o horário</option>
              <option value="09:00">09:00</option>
              <option value="14:00">14:00</option>
              <option value="18:00">18:00</option>
            </Select>
          )}
          <ConfirmButton
            onClick={() => {
              alert(`Consultoria agendada para ${selectedDay} às ${selectedTime}`);
              setShowBookingForm(false);
              if (logoRef.current && titleRef.current) {
                gsap.to([logoRef.current, titleRef.current], {
                  y: 0,
                  duration: 0.8,
                  ease: "power3.out",
                });
              }
            }}
          >
            Confirmar Agendamento
          </ConfirmButton>
        </BookingFormContainer>
      )}
    </Container>
  );
};

export default MateusMobile;
