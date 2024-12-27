import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { Item } from './types';

interface MobileViewProps {
  items: Item[];
  currentPage: number;
  transitioning: boolean;
  handleSwipe: (direction: 'up' | 'down') => void;
  handleShowPayment: (item: Item) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ items, currentPage, transitioning, handleSwipe, handleShowPayment }) => {
  const swipeHandlers = useSwipeable({
    onSwipedUp: () => handleSwipe('up'),
    onSwipedDown: () => handleSwipe('down'),
    preventScrollOnSwipe: true,
  });

  return (
    <div {...swipeHandlers} className="mobile-swipe-container">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`swipe-item ${
            index === currentPage
              ? "active"
              : index === currentPage - 1
              ? "previous"
              : index === currentPage + 1
              ? "next"
              : "hidden"
          }`}
          style={{
            transform:
              index === currentPage
                ? "translateY(0)"
                : index < currentPage
                ? "translateY(-100%)"
                : "translateY(100%)",
            transition: transitioning ? "transform 0.3s ease-in-out" : "none",
          }}
        >
          <img
            src={item.img}
            alt={item.name}
            style={{
              width: "100%",
              height: "300px",
              objectFit: "cover",
            }}
          />
          <h5>{item.name}</h5>
          <p>R$ {item.price.toFixed(2).replace(".", ",")}</p>
          <button
            className={`btn ${
              item.purchased ? "btn-success" : "btn-primary"
            }`}
            onClick={() => handleShowPayment(item)}
          >
            {item.purchased ? "Comprado ✔️" : "Pagar"}
          </button>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
