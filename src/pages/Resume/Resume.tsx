import { useEffect, type CSSProperties } from "react";

const CANONICAL_RESUME_URL = "/files/mateus-cabral-resume.pdf";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background: "#000",
  color: "#fff",
  textAlign: "center",
};

const textStyle: CSSProperties = {
  margin: 0,
};

const linkStyle: CSSProperties = {
  color: "#4eff9e",
  textDecoration: "none",
  fontWeight: 600,
};

const Resume = () => {
  useEffect(() => {
    globalThis.location.replace(CANONICAL_RESUME_URL);
  }, []);

  return (
    <main style={pageStyle}>
      <p style={textStyle}>
        <span>Redirecionando para o currículo. Caso isso não aconteça, acesse </span>
        <a
          href={CANONICAL_RESUME_URL}
          style={linkStyle}
          target="_blank"
          rel="noopener noreferrer"
        >
          o PDF diretamente
        </a>
        <span>.</span>
      </p>
    </main>
  );
};

export default Resume;
