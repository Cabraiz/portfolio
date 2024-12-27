import React from 'react';
import { Item } from './types';

interface DesktopViewProps {
  items: Item[];
  currentPage: number;
  itemsPerPage: number;
  handlePageChange: (direction: 'next' | 'prev') => void;
  handleShowPayment: (item: Item) => void;
}

const DesktopView: React.FC<DesktopViewProps> = ({ items, currentPage, itemsPerPage, handlePageChange, handleShowPayment }) => {
  return (
    <div className="container mt-4 casanova-page">
      <div className="row gy-3">
        {items.map((item) => (
          <div key={item.id} className="col">
            <div
              className={`card h-100 shadow-sm position-relative ${
                item.purchased ? 'border-success' : 'border-primary'
              }`}
            >
              <div className="progress-circle">
                <span className="progress-text">
                  {item.quantity - (item.purchased ? 1 : 0)}/{item.quantity}
                </span>
              </div>
              <img
                src={item.img}
                alt={item.name}
                className="card-img-top"
                style={{ objectFit: 'contain', height: '150px' }}
              />
              <div className="card-body text-center">
                <h5 className="card-title">{item.name}</h5>
                <p className="card-text">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                <button
                  className={`btn w-100 ${
                    item.purchased ? 'btn-success' : 'btn-primary'
                  }`}
                  onClick={() => handleShowPayment(item)}
                >
                  {item.purchased ? 'Comprado ✔️' : 'Pagar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        className={`navigation-arrow left ${
          currentPage === 0 ? "disabled" : ""
        }`}
        onClick={() => handlePageChange("prev")}
        disabled={currentPage === 0}
      >
        ◀
      </button>
      <button
        className={`navigation-arrow right ${
          items.length < itemsPerPage ? "disabled" : ""
        }`}
        onClick={() => handlePageChange("next")}
        disabled={items.length < itemsPerPage}
      >
        ▶
      </button>
    </div>
  );
};

export default DesktopView;
