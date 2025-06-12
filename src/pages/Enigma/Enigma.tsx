import React from "react";
import { Link } from "react-router-dom";

const Enigma: React.FC = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>🔍 Enigma Inicial</h1>
      <p>Bem-vindo ao enigma! Quando estiver pronto, avance para desbloquear a primeira etapa.</p>

      <Link to="/libras-unlock">
        <button>Ir para etapa 1 (Libras)</button>
      </Link>
    </div>
  );
};

export default Enigma;
