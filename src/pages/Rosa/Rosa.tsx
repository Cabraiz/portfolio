import React from "react";
import { Link } from "react-router-dom";
import AncientPaper from "../../components/AncientPaper"; // ajuste se o caminho for diferente

const Rosa: React.FC = () => {
  return (
    <AncientPaper>
      <h1>🌹 Etapa ROSA</h1>
      <p>Você avançou com sucesso para a etapa Rosa do contrato.</p>

      <Link to="/vinho-unlock">
        <button className="btn-continue">Ir para etapa final (Vinho)</button>
      </Link>
    </AncientPaper>
  );
};

export default Rosa;
