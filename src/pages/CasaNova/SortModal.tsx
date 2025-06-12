import React, { useState } from "react";
import "./LuxuryPage.css"; // Arquivo CSS para estilos do modal

const SortModal: React.FC<{
  sortItems: (criterion: "price" | "name" | "priority") => void;
}> = ({ sortItems }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="luxury-sort-modal">
      <button
        className={`luxury-sort-button ${isExpanded ? "expanded" : ""}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Fechar" : "Ordenar"}
      </button>

      {isExpanded && (
        <div className="luxury-sort-options">
          <button onClick={() => sortItems("price")}>Ordenar por Preço</button>
          <button onClick={() => sortItems("name")}>Ordenar por Nome</button>
        </div>
      )}
    </div>
  );
};

export default SortModal;
