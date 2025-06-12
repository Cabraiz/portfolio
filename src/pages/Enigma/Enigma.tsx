import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const Enigma: React.FC = () => {
  useEffect(() => {
    // Remove flags de desbloqueio anteriores
    sessionStorage.removeItem("unlocked-enigma");
    sessionStorage.removeItem("unlocked-libras");
    sessionStorage.removeItem("unlocked-rosa");
    sessionStorage.removeItem("unlocked-vinho");
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🔍 Enigma Inicial</h1>
      <p>Resolva o enigma para continuar.</p>

      <Link to="/libras-unlock">
        <button>Iniciar Desbloqueio</button>
      </Link>
    </div>
  );
};

export default Enigma;
