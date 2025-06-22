import React, { useState } from "react";
import { Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import IconGmail from "../../assets/Mateus/Icon/IconGoogle.png";
import "./GoogleSignInButton.css";

interface GoogleSignInButtonProps {
  onClick?: () => void;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick = () => alert("Login with Google (coming soon!)"),
}) => {
  const { t } = useTranslation();
  const [showFullButton, setShowFullButton] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setShowFullButton(true);
    }
  };

  const handleKeyDownFull = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <>
      {!showFullButton ? (
        <button
          type="button"
          className="google-liquid-button"
          onClick={() => setShowFullButton(true)}
          onKeyDown={handleKeyDown}
          aria-label="Login with Google"
        >
          <div className="google-liquid-fill" />
          <img src={IconGmail} alt="Google" className="google-liquid-icon" />
        </button>
      ) : (
        <button
          type="button"
          className="google-login-card"
          onClick={onClick}
          onKeyDown={handleKeyDownFull}
          aria-label="Sign in with Google"
        >
          <div className="google-login-icon">
            <Image src={IconGmail} alt="Google" />
          </div>
          <div className="google-login-text">{t("google.login")}</div>
        </button>
      )}
    </>
  );
};

export default GoogleSignInButton;
