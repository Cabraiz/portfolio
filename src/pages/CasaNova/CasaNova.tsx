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
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [itemsPerPage] = useState<number>(6);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<boolean>(false);

  const loadItems = async (page: number) => {
    try {
      setLoading(true);
      const fetchedItems = await fetchItems(page, itemsPerPage);
      setItems(fetchedItems);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(currentPage);
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
    const nextPage =
      direction === 'up'
        ? Math.min(currentPage + 1, items.length - 1)
        : Math.max(currentPage - 1, 0);

    if (nextPage !== currentPage) {
      setTransitioning(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setCurrentPage(nextPage);
      setTransitioning(false);
    }
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && items.length === itemsPerPage) {
      setCurrentPage((prev) => prev + 1);
    }
    if (direction === 'prev' && currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
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
            items={items}
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
