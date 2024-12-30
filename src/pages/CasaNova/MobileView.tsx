import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Item } from './types';
import './LuxuryPage.css'; // Novo arquivo CSS para o design luxuoso

interface MobileViewProps {
  items: Item[];
  currentPage: number;
  transitioning: boolean; // Adiciona esta linha
  handleSwipe: (direction: 'up' | 'down') => void;
  handleShowPayment: (item: Item) => void;
}

const MobileView: React.FC<MobileViewProps> = ({
  items,
  currentPage,
  handleSwipe,
  handleShowPayment,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => {
      setIsSwiping(false);
      handleSwipe('up');
    },
    onSwipedDown: () => {
      setIsSwiping(false);
      handleSwipe('down');
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
    <>
      <div className="luxury-background"></div> {/* Adiciona o fundo global */}
      <div {...swipeHandlers} className="luxury-swipe-container">
        {items.map((item, index) => {
          const offset = index - currentPage;
          const translateY = offset * 100 + (isSwiping ? progress * 100 : 0);
  
          return (
            <div
              key={item.id}
              className="luxury-swipe-item"
              style={{
                transform: `translateY(${translateY}%)`,
                transition: isSwiping ? 'none' : 'transform 0.3s ease-in-out',
                zIndex: -Math.abs(offset),
              }}
            >
              <div className="luxury-item-card">
                <img
                  src={item.img}
                  alt={item.name}
                  className="luxury-item-image"
                />
                <div className="luxury-item-info">
                  <h5 className="luxury-item-title">{item.name}</h5>
                  <p className="luxury-item-price">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                  <button
                    className={`luxury-button ${item.purchased ? 'btn-success' : 'btn-primary'}`}
                    onClick={() => handleShowPayment(item)}
                  >
                    {item.purchased ? 'Comprado ✔️' : 'Contribuir Agora'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );  
};

export default MobileView;
