import React, { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { Item } from "./types";
import "./LuxuryPage.css";

interface MobileViewProps {
  items: Item[];
  currentPage: number;
  transitioning: boolean;
  handleSwipe: (direction: "up" | "down") => void;
  handleShowPayment: (item: Item) => void;
  sortItems: (criterion: "price" | "name") => void;
}

const MobileView: React.FC<MobileViewProps> = ({
  items,
  currentPage,
  transitioning,
  handleSwipe,
  handleShowPayment,
  sortItems,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const [showSortModal, setShowSortModal] = useState(false); // Estado do modal

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => {
      setIsSwiping(false);
      handleSwipe("up");
    },
    onSwipedDown: () => {
      setIsSwiping(false);
      handleSwipe("down");
    },
    onSwiping: (e) => {
      setIsSwiping(true);
      setProgress(e.deltaY / window.innerHeight);
    },
    onSwiped: () => setProgress(0),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <div className="luxury-mobile-container">
      {/* Botão de ordenar no topo */}
      <div className="luxury-sort-top">
        <button
          className="luxury-sort-button"
          onClick={() => setShowSortModal((prev) => !prev)} // Alterna a exibição do modal
        >
          Ordenar
        </button>
      </div>

      {/* Modal de opções de ordenação */}
      {showSortModal && (
        <div className="luxury-sort-options">
          <button
            onClick={() => {
              setShowSortModal(false); // Fecha o modal
              sortItems("price"); // Notifica o componente pai sobre o critério 'price'
            }}
          >
            Por Preço
          </button>
          <button
            onClick={() => {
              setShowSortModal(false); // Fecha o modal
              sortItems("name"); // Notifica o componente pai sobre o critério 'name'
            }}
          >
            Por Nome
          </button>
        </div>
      )}

      <div {...swipeHandlers} className="luxury-swipe-container">
        {items.map((item, index) => {
          const offset = index - currentPage;
          const translateY = offset * 100 + (isSwiping ? progress * 100 : 0);

          return (
            <div
              key={`${item.id}-${index}`} // Combina ID e índice para garantir chave única
              className="luxury-swipe-item"
              style={{
                transform: `translateY(${translateY}%)`,
                transition: isSwiping ? "none" : "transform 0.3s ease-in-out",
                zIndex: -Math.abs(offset),
              }}
            >
              <div
                className="luxury-item-card"
                onClick={() => handleShowPayment(item)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={item.img}
                  alt={item.name}
                  className="luxury-item-image"
                />
                <div className="luxury-item-info">
                  <h5 className="luxury-item-title">{item.name}</h5>
                  <p className="luxury-item-price">
                    R${" "}
                    {item.price
                      ? item.price.toFixed(2).replace(".", ",")
                      : "0,00"}
                  </p>
                  <button
                    className={`luxury-button luxury-button-glow ${
                      item.purchased ? "btn-success" : "btn-primary"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowPayment(item);
                    }}
                  >
                    {item.purchased ? "Comprado ✔️" : "Contribuir Agora"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="luxury-footer">
        <button
          className={`luxury-nav-button ${currentPage === 0 ? "disabled" : ""}`}
          onClick={() => handleSwipe("down")}
          disabled={currentPage === 0}
        >
          ◀
        </button>
        <div className="luxury-quantity-indicator">
          <span className="luxury-quantity-text">
            {currentPage + 1} / {items.length}
          </span>
          <div className="luxury-progress-bar">
            <div
              className="luxury-progress-bar-fill"
              style={{
                width: `${((currentPage + 1) / items.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
        <button
          className={`luxury-nav-button ${
            currentPage === items.length - 1 ? "disabled" : ""
          }`}
          onClick={() => handleSwipe("up")}
          disabled={currentPage === items.length - 1}
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default MobileView;
