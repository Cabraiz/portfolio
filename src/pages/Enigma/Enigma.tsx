import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AncientPaper from "../../components/AncientPaper";

const Enigma: React.FC = () => {
  useEffect(() => {
    sessionStorage.removeItem("unlocked-enigma");
    sessionStorage.removeItem("unlocked-libras");
    sessionStorage.removeItem("unlocked-rosa");
    sessionStorage.removeItem("unlocked-vinho");
  }, []);

  return (
    <AncientPaper>
      <h1>🔍 Enigma Inicial</h1>
      <p>Resolva o enigma para continuar sua jornada.</p>
      <Link to="/libras-unlock">
        <button>Iniciar Desbloqueio</button>
      </Link>
    </AncientPaper>
  );
};

export default Enigma;
