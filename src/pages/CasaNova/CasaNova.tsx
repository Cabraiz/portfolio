import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';
import './CasaNova.css';
import { isMobile } from 'react-device-detect';
import { fetchItems } from './api';
import { generatePixPayload } from './utils';
import MobileView from './MobileView';
import DesktopView from './DesktopView';
import { Item } from './types';
import { QRCodeSVG } from 'qrcode.react';

const NewHomeGiftPage: React.FC = () => {
  const [items, setItems] = useState<{ [page: number]: Item[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [itemsPerPage] = useState<number>(6);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<boolean>(false);

  const loadItems = async (pagesToLoad: number[]) => {
    try {
      setLoading(true);
  
      // Filtra as páginas que ainda não foram carregadas
      const pagesNotLoaded = pagesToLoad.filter((page) => !items[page]);
  
      // Faz fetch apenas das páginas não carregadas
      const fetchedPages = await Promise.all(
        pagesNotLoaded.map((page) => fetchItems(page, itemsPerPage))
      );
  
      // Atualiza o estado com as novas páginas
      setItems((prevItems) => {
        const newItems = { ...prevItems };
        pagesNotLoaded.forEach((page, index) => {
          newItems[page] = fetchedPages[index];
        });
        return newItems;
      });
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Carregar a página atual e pré-carregar as próximas 2 páginas
    loadItems([currentPage, currentPage + 1, currentPage + 2]);
  }, [currentPage]);

  const handleShowPayment = (item: Item) => {
    const payload = generatePixPayload(
      item.price,
      '61070800317',
      'Mateus Cardoso Cabral',
      'SAO PAULO'
    );
    setPixCode(payload);
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setPixCode(null);
  };

  const handleSwipe = async (direction: 'up' | 'down') => {
    if (transitioning) return;
  
    const totalPages = Object.keys(items).length; // Número total de páginas carregadas
  
    const nextPage =
      direction === 'up'
        ? Math.min(currentPage + 1, totalPages - 1)
        : Math.max(currentPage - 1, 0);
  
    if (nextPage !== currentPage) {
      setTransitioning(true);
      setCurrentPage(nextPage);
      setTransitioning(false);
  
      // Pré-carregar as próximas páginas
      loadItems([nextPage + 1, nextPage + 2]);
    }
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    setCurrentPage((prevPage) => {
      const nextPage =
        direction === 'next' ? prevPage + 1 : Math.max(prevPage - 1, 0);
  
      // Retorna o próximo número de página
      return nextPage;
    });
  
    // Pré-carregar as próximas páginas (opcional)
    loadItems([currentPage + 1, currentPage + 2]);
  };
  
  

  return (
    <div className="loading-container">
      {loading ? (
        <div className="loading-wrapper">Carregando...</div>
      ) : error ? (
        <div className="error-container">Erro: {error}</div>
      ) : (
        isMobile ? (
          <MobileView
            items={items[currentPage] || []} // Passa apenas os itens da página atual como array
            currentPage={currentPage}
            transitioning={transitioning}
            handleSwipe={handleSwipe}
            handleShowPayment={handleShowPayment}
          />
        ) : (
          <DesktopView
            items={items}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            handlePageChange={handlePageChange}
            handleShowPayment={handleShowPayment}
          />
        )
      )}

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Pagamento via PIX</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && pixCode && (
            <>
              <QRCodeSVG value={pixCode} size={200} />
              <textarea value={pixCode} readOnly />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NewHomeGiftPage;
