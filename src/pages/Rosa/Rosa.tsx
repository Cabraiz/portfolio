import React from "react";
import { Link } from "react-router-dom";

const Rosa: React.FC = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Página ROSA</h1>
      <p>Você avançou com sucesso para a etapa Rosa.</p>

      <Link to="/vinho-unlock">
        <button>Ir para etapa final (Vinho)</button>
      </Link>
    </div>
  );
};

export default Rosa;
