// MateusMobile.styles.ts
import styled, { keyframes, css } from "styled-components";

export const shine = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const float = keyframes`
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
`;

export const Container = styled.div`
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

export const LogoWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

export const Logo = styled.img`
  width: 120px;
  height: auto;
  animation: ${shine} 4s linear infinite;
  background: linear-gradient(90deg, #d4af37, #fff, #d4af37);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
`;

export const DiscountBadge = styled.div`
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

export const Title = styled.h1`
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

export const Subtitle = styled.button`
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

export const CallToAction = styled.button`
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

export const Particle = styled.span<{
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

export const BlackHole = styled.div<{ active: boolean }>`
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

export const BookingFormContainer = styled.div`
  position: absolute;
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
  background: #111;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.6);
  z-index: 10;
  animation: fadeIn 0.6s ease forwards;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -20%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
`;

export const FormTitle = styled.h2`
  font-size: 2rem;
  color: #d4af37;
  margin-bottom: 1rem;
  text-align: center;
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 6px;
  border: 1px solid #444;
  background: #222;
  color: #fff;
  font-size: 1rem;
`;

export const ConfirmButton = styled.button`
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 6px;
  background: #d4af37;
  color: #000;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #fff;
  }
`;
