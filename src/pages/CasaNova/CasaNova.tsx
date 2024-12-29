import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';
import './CasaNova.css';
import { isMobile } from 'react-device-detect';
import { fetchItems, fetchTotalItems } from './api';
import { generatePixPayload } from './utils';
import MobileView from './MobileView';
import DesktopView from './DesktopView';
import { Item } from './types';
import { QRCodeSVG } from 'qrcode.react';

const NewHomeGiftPage: React.FC = () => {
  const [totalItems, setTotalItems] = useState<number>(0);
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
  
      // Verifique se o total de itens já está armazenado no localStorage
      if (totalItems === 0) {
        const storedTotalItems = localStorage.getItem('totalItems');
        if (storedTotalItems) {
          // Se o total estiver no localStorage, use-o
          setTotalItems(parseInt(storedTotalItems, 10));
        } else {
          // Caso contrário, busque da API e armazene no localStorage
          const total = await fetchTotalItems();
          setTotalItems(total);
          localStorage.setItem('totalItems', total.toString());
        }
      }
  
      // Recuperar itens do localStorage
      const storedItems = JSON.parse(localStorage.getItem('items') ?? '{}');
  
      // Filtre as páginas que ainda não foram carregadas
      const pagesToFetch = pagesToLoad.filter((page) => !storedItems[page]);
  
      // Carregue novas páginas, se necessário
      if (pagesToFetch.length > 0) {
        const fetchedPages = await Promise.all(
          pagesToFetch.map(async (page) => {
            const items = await fetchItems(page, itemsPerPage);
            return { page, items };
          })
        );
  
        // Atualize o estado e o localStorage
        const updatedItems = { ...storedItems };
        fetchedPages.forEach(({ page, items }) => {
          updatedItems[page] = items;
        });
  
        localStorage.setItem('items', JSON.stringify(updatedItems)); // Salve os itens no localStorage
        setItems(updatedItems);
      } else {
        // Se todos os itens estiverem no localStorage, atualize o estado diretamente
        setItems(storedItems);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro desconhecido.');
      }
    } finally {
      setLoading(false);
    }
  };  
  
  // UseEffect para carregar dados iniciais
  useEffect(() => {
    // Carregar a página atual e pré-carregar as próximas 2 páginas
    loadItems([currentPage, currentPage + 1, currentPage + 2]);
  }, [currentPage]);
  
  
  
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

  const handleSwipe = (direction: 'up' | 'down') => {
    if (transitioning) return;
  
    const totalItemsFlat = Object.values(items).flat(); // Unifica todos os itens em um único array
    const totalItemsCount = totalItemsFlat.length;
  
    let newIndex = currentPage;
  
    if (direction === 'up') {
      newIndex = Math.min(currentPage + 1, totalItemsCount - 1); // Vai para o próximo item
    } else if (direction === 'down') {
      newIndex = Math.max(currentPage - 1, 0); // Volta para o item anterior
    }
  
    if (newIndex !== currentPage) {
      setTransitioning(true); // Ativa transição
      setTimeout(() => setTransitioning(false), 300); // Duração da animação (300ms)
      setCurrentPage(newIndex); // Atualiza o índice atual
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
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="loading-container">
      {loading ? (
        <div className="loading-wrapper">Carregando...</div>
      ) : error ? (
        <div className="error-container">Erro: {error}</div>
      ) : (
        isMobile ? (
<MobileView
  items={Object.values(items).flat()} // Passa todos os itens como um array único
  currentPage={currentPage} // Índice global atual
  transitioning={transitioning}
  handleSwipe={handleSwipe}
  handleShowPayment={handleShowPayment}
/>

        ) : (
          <DesktopView
            items={items}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalPages={totalPages} // Passe totalPages como prop
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
