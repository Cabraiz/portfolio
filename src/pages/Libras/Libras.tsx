import React from "react";
import { Link } from "react-router-dom";
import AncientPaper from "../../components/AncientPaper"; // ajuste o caminho se necessário

const Libras: React.FC = () => {
  return (
    <AncientPaper>
      <h1>📜 Etapa LIBRAS</h1>
      <p>Parabéns, você desbloqueou a rota Libras.</p>

      <Link to="/rosa-unlock">
        <button className="btn-continue">Ir para próxima etapa (Rosa)</button>
      </Link>
    </AncientPaper>
  );
};

export default Libras;
