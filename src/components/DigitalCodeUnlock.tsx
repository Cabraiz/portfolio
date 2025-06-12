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

const DigitalCodeUnlock: React.FC<Props> = ({ routeKey, next }) => {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [isLocked, setIsLocked] = useState(false);
  const [timer, setTimer] = useState(5);
  const navigate = useNavigate();

  const handleChange = (index: number, value: string) => {
    if (isLocked || !/^\d?$/.test(value)) return;

    const updated = [...digits];
    updated[index] = value;
    setDigits(updated);

    new Audio("/sounds/mw.mp3").play();

    if (value && index < 3) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }

    if (updated.every((d) => d.length === 1)) {
      const typedCode = updated.join("");
      if (typedCode === CODES[routeKey]) {
        sessionStorage.setItem(`unlocked-${routeKey}`, "true");
        navigate(next);
      } else {
        new Audio("/sounds/ib.mp3").play();
        setIsLocked(true);
        setTimer(5);
        setDigits(["", "", "", ""]);

        let countdown = 5;
        const interval = setInterval(() => {
          countdown -= 1;
          setTimer(countdown);
          if (countdown === 0) {
            clearInterval(interval);
            setIsLocked(false);
            setDigits(["", "", "", ""]);
            document.getElementById("digit-0")?.focus();
          }
        }, 1000);
      }
    }
  };

  return (
    <div className="unlock-container">
      {isLocked ? (
        <div className="led-timer">{timer}</div>
      ) : (
        <div className="code-box">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              id={`digit-${idx}`}
              maxLength={1}
              type="password"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              className="digit-input"
              autoFocus={idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DigitalCodeUnlock;
