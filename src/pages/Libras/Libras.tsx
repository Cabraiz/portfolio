import React from "react";
import { Link } from "react-router-dom";

const Libras: React.FC = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Página LIBRAS</h1>
      <p>Parabéns, você desbloqueou a rota Libras.</p>

      <Link to="/rosa-unlock">
        <button>Ir para próxima etapa (Rosa)</button>
      </Link>
    </div>
  );
};

export default Libras;
