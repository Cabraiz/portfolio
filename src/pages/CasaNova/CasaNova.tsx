import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CasaNova.css';
import { isMobile } from 'react-device-detect';
import { fetchItems, fetchTotalItems } from './api';
import { generatePixPayload } from './utils';
import MobileView from './MobileView';
import DesktopView from './DesktopView';
import { Item } from './types';
import { clearDB, saveToDB } from './dbHelpers';
import PaymentModal from './PaymentModal';

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
  
      // Limpar IndexedDB e LocalStorage ao reiniciar
      if (totalItems === 0) {
        await clearDB(); // Limpa o IndexedDB
        localStorage.clear(); // Limpa o localStorage
      }
  
      // Verifique se o total de itens já está armazenado no localStorage
      if (totalItems === 0) {
        const storedTotalItems = localStorage.getItem('totalItems');
        if (storedTotalItems) {
          setTotalItems(parseInt(storedTotalItems, 10));
        } else {
          const total = await fetchTotalItems();
          setTotalItems(total);
          localStorage.setItem('totalItems', total.toString());
        }
      }
  
      // Recuperar itens do localStorage
      const storedItems = JSON.parse(localStorage.getItem('items') ?? '{}');
  
      // Filtrar páginas que precisam ser carregadas
      const pagesToFetch = pagesToLoad.filter((page) => !storedItems[page]);
  
      if (pagesToFetch.length > 0) {
        const fetchedPages = await Promise.all(
          pagesToFetch.map(async (page) => {
            const items = await fetchItems(page, itemsPerPage);
      
            console.log('Itens carregados para a página:', page, items);
      
            // Salvar os itens no IndexedDB
            for (const item of items) {
              const key = item.id || `page-${page}-index-${items.indexOf(item)}`;

            
              await saveToDB(key, JSON.stringify(item));
            }
            
      
            return { page, items };
          })
        );
      
        // Atualizar localStorage e estado
        const updatedItems = { ...storedItems };
        fetchedPages.forEach(({ page, items }) => {
          updatedItems[page] = items;
        });
      
        localStorage.setItem('items', JSON.stringify(updatedItems));
        setItems(updatedItems);
      } else {
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

  const getMaxInstallments = (price: number): number => {
    if (price > 200) {
      return 5; // 5x para valores acima de R$200
    } else if (price > 160) {
      return 4; // 4x para valores acima de R$160
    } else if (price > 120) {
      return 3; // 3x para valores acima de R$120
    } else if (price > 80) {
      return 2; // 2x para valores acima de R$80
    }
    return 1; // 1x (à vista) para valores abaixo de R$80
  };
  
  
  useEffect(() => {
    const nextPages = [currentPage, currentPage + 1, currentPage + 2];
    const pagesToLoad = nextPages.filter((page) => !items[page]);
    if (pagesToLoad.length > 0) {
      loadItems(pagesToLoad);
    }
  }, [currentPage, items]);

  const handleShowPayment = (item: Item) => {
    console.log("Abrindo modal para o item:", item); // Log para verificar
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
  
  const handleRedirectToCreditCard = async () => {
    if (!selectedItem) {
      console.error("Nenhum item selecionado para pagamento.");
      return;
    }
  
    try {
      const formattedPrice = parseFloat(selectedItem.price.toFixed(2));
      const maxInstallments = getMaxInstallments(formattedPrice);
  
      const response = await fetch(import.meta.env.VITE_MP_BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          items: [
            {
              title: selectedItem.name || 'Sem título',
              quantity: 1,
              unit_price: formattedPrice,
            },
          ],
          back_urls: {
            success: `${import.meta.env.REACT_APP_BASE_API}/success`,
            failure: `${import.meta.env.REACT_APP_BASE_API}/failure`,
            pending: `${import.meta.env.REACT_APP_BASE_API}/pending`,
          },
          auto_return: 'approved',
          payment_methods: {
            installments: maxInstallments, // Define o número máximo de parcelas
            default_installments: 1, // Padrão: pagamento à vista
          },
        }),
      });
  
      if (!response.ok) {
        const errorDetails = await response.json();
        console.error("Erro ao criar preferência de pagamento:", errorDetails);
        throw new Error(`Erro: ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log("Redirecionando para:", data.init_point);
      window.location.href = data.init_point; // Redireciona para o checkout
    } catch (error) {
      console.error("Erro ao redirecionar para pagamento:", error);
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
    <div className={`loading-container ${isMobile ? 'mobile-margins' : ''}`}>
      {error ? (
        <div className="error-container">Erro: {error}</div>
      ) : isMobile ? (
        <MobileView
          items={Object.values(items).flat()}
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
          totalPages={Math.ceil(totalItems / itemsPerPage)}
          handlePageChange={handlePageChange}
          handleShowPayment={handleShowPayment}
          isLoading={loading} // Passa a flag de loading para o DesktopView
        />
      )}
      <PaymentModal
        show={showModal}
        onClose={handleCloseModal}
        pixCode={pixCode}
        handleRedirectToCreditCard={handleRedirectToCreditCard}
      />
    </div>
  );  
};

export default NewHomeGiftPage;
