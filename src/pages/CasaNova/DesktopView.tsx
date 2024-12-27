import React, { useRef, useState, useEffect } from 'react';
import { Item } from './types';
import { makeWhiteTransparent } from './utils';

const useLazyLoad = (callback: () => void) => {
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!targetRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      { rootMargin: '100px' }
    );

    observer.observe(targetRef.current);

    return () => observer.disconnect();
  }, [callback]);

  return targetRef;
};

interface DesktopViewProps {
  items: { [page: number]: Item[] };
  currentPage: number;
  itemsPerPage: number;
  totalPages: number; // Novo parâmetro para total de páginas
  handlePageChange: (direction: 'next' | 'prev') => void;
  handleShowPayment: (item: Item) => void;
}

const DesktopView: React.FC<DesktopViewProps> = ({
  items,
  currentPage,
  itemsPerPage,
  totalPages,
  handlePageChange,
  handleShowPayment,
}) => {
  const currentItems = items[currentPage] || [];
  const [processedImages, setProcessedImages] = useState<
  { id: string; processedImg: string | null }[]
>([]);

  // Processar as imagens no nível superior
  useEffect(() => {
    const processImages = async () => {
      const processed = await Promise.all(
        currentItems.map(async (item) => {
          const img = new Image();
          img.src = item.img;
          const result = await makeWhiteTransparent(img);
          return { id: item.id.toString(), processedImg: result }; // Converte ID para string
        })
      );
      setProcessedImages(processed);
    };
  
    processImages();
  }, [currentItems]);
  

  return (
    <div className="container mt-4 casanova-page">
      <div className="row gy-3">
        {currentItems.map((item) => {
          const processedImage = processedImages.find(
            (img) => img.id === item.id.toString() // Converte item.id para string
          );
          

          return (
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
                  src={processedImage?.processedImg || item.img} // Use a imagem processada ou original
                  alt={item.name}
                  className="card-img-top"
                  style={{ objectFit: 'contain', height: '150px' }}
                />
                <div className="card-body text-center">
                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-text">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </p>
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
          );
        })}
      </div>
      <button
        className={`navigation-arrow left ${currentPage === 0 ? 'disabled' : ''}`}
        onClick={() => handlePageChange('prev')}
        disabled={currentPage === 0}
      >
        ◀
      </button>
      <button
        className={`navigation-arrow right ${currentPage >= totalPages - 1 ? 'disabled' : ''}`}
        onClick={() => handlePageChange('next')}
        disabled={currentPage >= totalPages - 1}
      >
        ▶
      </button>
    </div>
  );
};

export default DesktopView;
