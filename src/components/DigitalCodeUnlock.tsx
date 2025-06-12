import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DigitalCodeUnlock.css";

interface Props {
  routeKey: string;
  next: string;
}

const CODES: Record<string, string> = {
  enigma: "0000",
  libras: "1234",
  rosa: "4321",
  vinho: "7890",
};

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "enter"];

const DigitalCodeUnlock: React.FC<Props> = ({ routeKey, next }) => {
  const [digits, setDigits] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [timer, setTimer] = useState(5);
  const navigate = useNavigate();

  const playClick = () => new Audio("/sounds/mw.mp3").play();
  const playError = () => new Audio("/sounds/ib.mp3").play();

  const crackPaths = [
    "M5,90 L30,70 L40,80 L60,60 L80,75 L95,60",
    "M10,90 L25,65 L35,75 L55,55 L75,70 L90,55",
    "M5,95 L20,70 L35,85 L50,60 L70,80 L95,50",
    "M0,80 L20,60 L40,78 L60,58 L85,70 L100,55",
  ];


  const handleKeyPress = (key: string) => {
    if (isLocked) return;

    playClick();

    if (key === "clear") {
      setDigits([]);
      return;
    }

    if (key === "enter") {
      if (digits.length !== 4) return;

      const typed = digits.join("");
      if (typed === CODES[routeKey]) {
        sessionStorage.setItem(`unlocked-${routeKey}`, "true");
        navigate(next);
      } else {
        playError();
        setIsLocked(true);
        setTimer(5);
        let countdown = 5;
        const interval = setInterval(() => {
          countdown--;
          setTimer(countdown);
          if (countdown === 0) {
            clearInterval(interval);
            setIsLocked(false);
            setDigits([]);
          }
        }, 1000);
      }

      return;
    }

    if (digits.length < 4) {
      setDigits([...digits, key]);
    }
  };

  return (
    <div className="unlock-container">
      {isLocked ? (
        <div className="led-timer">{timer}</div>
      ) : (
        <div className="keypad-wrapper">
<div className="lcd-display">
  {Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="lcd-digit">
     <span
        className={`digit-char ${!digits[i] ? "blinking" : ""}`}
      >
        {digits[i] ?? "•"}
      </span>

      <svg
        className="digit-blood"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M20,0 Q25,30 20,50 Q30,60 20,80"
          stroke="none"
          fill="rgba(255, 0, 0, 0.3)"
        />
      </svg>
    </div>
  ))}
</div>


          <div className="keypad">
            {keys.map((key, idx) => {
  const randomDelay = Math.random() * 4; // entre 0s e 4s
  return (
    <button
      key={key}
      onClick={() => handleKeyPress(key)}
      className={`key ${key}`}
    >
      <span className="key-label">{key}</span>

      <svg
        className="crack-overlay"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ animationDelay: `${randomDelay}s` }}
      >
        <path
          d={crackPaths[Math.floor(Math.random() * crackPaths.length)]}
          stroke="#fff"
          strokeWidth="0.3"
          fill="none"
        />
      </svg>
    </button>
  );
})}

          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalCodeUnlock;
