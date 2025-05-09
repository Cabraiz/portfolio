import React, { useState } from "react";
import { Button, Image } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import logoGmail from "./assets/icones/7.svg";
import IconGmail from "./assets/Mateus/icon/IconGoogle.png";

interface GoogleSignInButtonProps {
    animate?: boolean;
    onClick?: () => void;
  }
  
  const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    animate = false,
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
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#ffffffd9",
    border: "1px solid #ccc",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    transition: "all 0.3s ease-in-out",
  }}
>
  <Image
    src={IconGmail}
    alt="Gmail"
    style={{
      width: "50px",
      height: "50px",
      objectFit: "contain",
    }}
  />
</Button>

        ) : (
          <Button
            className={`google-signin-button ${animate ? "google-animate-bounce" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              paddingTop: "5vh",
              paddingBottom: "6px",
              paddingLeft: "16px",
              paddingRight: "16px",
              height: "11vh",
              fontSize: "1.2rem",
              fontFamily: '"Roboto", sans-serif',
              fontWeight: 500,
              letterSpacing: "1px",
              lineHeight: "24px",
              backgroundColor: "#ffffffcf",
              color: "#3c4043",
              alignSelf: "flex-start",
              border: "1px solid #dadce0",
              borderTopLeftRadius: "0px",
              borderTopRightRadius: "0px",
              borderBottomLeftRadius: "15px",
              borderBottomRightRadius: "15px",
              boxShadow:
                "0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15)",
              marginRight: "1.5vw",
              cursor: "pointer",
            }}
            onClick={onClick}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 12px",
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: "24px",
                border: "1px solid rgba(0,0,0,0.5)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                boxShadow: "inset 0 0 0.3px rgba(255,255,255,0.3)",
                position: "relative",
                zIndex: 2,
              }}
            >
              <Image src={logoGmail} alt="Google Logo" style={{ width: "18px", height: "18px" }} />
              <span style={{ color: "#3c4043", fontWeight: 600, textShadow: "none" }}>
                {t("google.login")}
              </span>
            </div>
          </Button>
        )}
      </>
    );
  };
  
  export default GoogleSignInButton;