import React, { useState } from "react";
import { Button, Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import IconGmail from "./assets/Mateus/Icon/IconGoogle.png";
import "./GoogleSignInButton.css";

interface GoogleSignInButtonProps {
  onClick?: () => void;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick = () => alert("Login with Google (coming soon!)"),
}) => {
  const { t } = useTranslation();
  const [showFullButton, setShowFullButton] = useState(false);

  return (
    <>
      {!showFullButton ? (
        <Button
          onClick={() => setShowFullButton(true)}
          className="google-circle-button"
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.4)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Image
            src={IconGmail}
            alt="Gmail"
            style={{
              width: "24px",
              height: "24px",
              objectFit: "contain",
            }}
          />
        </Button>
      ) : (
        <div className="google-login-card" onClick={onClick}>
          <div className="google-login-icon">
            <Image src={IconGmail} alt="Google" />
          </div>
          <div className="google-login-text">
            {t("google.login")}
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleSignInButton;
