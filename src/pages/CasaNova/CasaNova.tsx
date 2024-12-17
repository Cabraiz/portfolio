import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const itemsList = [
  { id: 1, name: 'Conjunto de Panelas', price: 'R$ 250,00', img: 'https://via.placeholder.com/150', purchased: false },
  { id: 2, name: 'Jogo de Toalhas', price: 'R$ 80,00', img: 'https://via.placeholder.com/150', purchased: true },
  { id: 3, name: 'Conjunto de Copos', price: 'R$ 60,00', img: 'https://via.placeholder.com/150', purchased: false },
  { id: 4, name: 'Liquidificador', price: 'R$ 150,00', img: 'https://via.placeholder.com/150', purchased: false },
  { id: 5, name: 'Ferro de Passar', price: 'R$ 120,00', img: 'https://via.placeholder.com/150', purchased: true },
];

const NewHomeGiftPage = () => {
  const [items, setItems] = useState(itemsList);

  const togglePurchased = (id: number) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, purchased: !item.purchased } : item
    );
    setItems(updatedItems);
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Chá de Casa Nova 🎉</h1>
      <p className="text-center mb-4">
        Ajude a montar o novo lar escolhendo um item da lista abaixo!
      </p>

      <div className="row gy-3">
        {items.map((item) => (
          <div key={item.id} className="col-12 col-sm-6 col-md-4">
            <div
              className={`card h-100 shadow-sm ${
                item.purchased ? 'border-success' : 'border-primary'
              }`}
            >
              <img
                src={item.img}
                className="card-img-top"
                alt={item.name}
                style={{ objectFit: 'cover', height: '200px' }}
              />
              <div className="card-body text-center">
                <h5 className="card-title">{item.name}</h5>
                <p className="card-text">{item.price}</p>
                <button
                  className={`btn w-100 ${
                    item.purchased ? 'btn-success' : 'btn-primary'
                  }`}
                  onClick={() => togglePurchased(item.id)}
                >
                  {item.purchased ? 'Comprado ✔️' : 'Marcar como Comprado'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewHomeGiftPage;
