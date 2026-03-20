import React, { useMemo, useRef, type CSSProperties } from "react";

import logo from "../../../assets/icones/logo.svg";
import vortexSound from "public/sounds/vortex.mp3";

import useRevealOnScroll from "../../../features/animations/useRevealOnScroll";
import useMateusMobileSequence from "./useMateusMobileSequence";

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
  ConfirmButton,
} from "./MateusMobile.styles";

type ParticleItem = Readonly<{
  id: number;
  left: string;
  size: string;
  delay: string;
  duration: string;
}>;

const contentWrapperStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const MateusMobile: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useRevealOnScroll({
    targetRef: containerRef,
    triggerRef: containerRef,
    preset: "softReveal",
    start: "top 80%",
    end: "bottom 30%",
    duration: 1.2,
    ease: "power4.out",
    once: false,
    refreshOnMount: false,
  });

  const {
    holeActive,
    showBookingForm,
    selectedDay,
    setSelectedDay,
    selectedTime,
    setSelectedTime,
    handleSubtitleClick,
    handleCallToAction,
    handleConfirmBooking,
  } = useMateusMobileSequence({
    contentRef,
    logoRef,
    titleRef,
    audioSrc: vortexSound,
    scatterDurationMs: 2500,
    scatterDistance: 400,
    logoShiftY: 80,
  });

  const particles = useMemo<ParticleItem[]>(
    () =>
      Array.from({ length: 30 }, (_, index) => ({
        id: index,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 8 + 4}px`,
        delay: `${Math.random() * 3}s`,
        duration: `${Math.random() * 6 + 8}s`,
      })),
    [],
  );

  return (
    <Container ref={containerRef}>
      <BlackHole active={holeActive} />

      {particles.map((particle) => (
        <Particle
          key={particle.id}
          left={particle.left}
          size={particle.size}
          delay={particle.delay}
          duration={particle.duration}
        />
      ))}

      <div ref={contentRef} style={contentWrapperStyle}>
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
            onChange={(event) => setSelectedDay(event.target.value)}
          >
            <option value="">Selecione o dia</option>
            <option value="2025-07-10">10/07/2025</option>
            <option value="2025-07-11">11/07/2025</option>
            <option value="2025-07-12">12/07/2025</option>
          </Select>

          {selectedDay && (
            <Select
              value={selectedTime}
              onChange={(event) => setSelectedTime(event.target.value)}
            >
              <option value="">Selecione o horário</option>
              <option value="09:00">09:00</option>
              <option value="14:00">14:00</option>
              <option value="18:00">18:00</option>
            </Select>
          )}

          <ConfirmButton
            onClick={() =>
              handleConfirmBooking(
                ({ selectedDay: bookedDay, selectedTime: bookedTime }) => {
                  alert(
                    `Consultoria agendada para ${bookedDay} às ${bookedTime}`,
                  );
                },
              )
            }
          >
            Confirmar Agendamento
          </ConfirmButton>
        </BookingFormContainer>
      )}
    </Container>
  );
};

export default MateusMobile;
