import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import './CasaNova.css';

interface Item {
  id: number;
  name: string;
  price: number;
  img: string;
  purchased: boolean;
}

const NewHomeGiftPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [itemsPerPage] = useState<number>(4);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);

  const generatePixPayload = (
    amount: number,
    pixKey: string,
    merchantName: string,
    merchantCity: string
  ): string => {
    const formatField = (id: string, value: string): string =>
      `${id}${value.length.toString().padStart(2, '0')}${value}`;
    const payload = [
      formatField('00', '01'),
      formatField(
        '26',
        formatField('00', 'BR.GOV.BCB.PIX') +
          formatField('01', pixKey)
      ),
      formatField('52', '0000'),
      formatField('53', '986'),
      formatField('54', amount.toFixed(2)),
      formatField('58', 'BR'),
      formatField('59', merchantName),
      formatField('60', merchantCity),
      formatField('62', formatField('05', 'evHhFaTSaG')),
    ];
    const payloadWithoutCRC = payload.join('');
    return `${payloadWithoutCRC}6304${calculateCRC16(payloadWithoutCRC + '6304')}`;
  };

  const calculateCRC16 = (payload: string): string => {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  };

  const fetchItems = async (page: number) => {
    try {
      setLoading(true);
      const skip = page * itemsPerPage;
      const response = await fetch(
        `https://casa-nova-api.vercel.app/casa?skip=${skip}&limit=${itemsPerPage}`
      );
      if (!response.ok) {
        throw new Error('Erro ao carregar os itens.');
      }
      const data: any[] = await response.json();
  
      const transformedItems: Item[] = await Promise.all(
        data.map(async (item) => {
          const img = new Image();
          img.src = item.imagem || 'https://via.placeholder.com/150';
          await new Promise((resolve) => (img.onload = resolve));
          const processedImg = await makeWhiteTransparent(img);
          return {
            id: item.id,
            name: item.item_nome,
            price: parseFloat(item.preco),
            img: processedImg,
            purchased: !!item.nome_pessoa,
          };
        })
      );
  
      setItems(transformedItems);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchItems(currentPage);
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

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && items.length === itemsPerPage) {
      setCurrentPage((prev) => prev + 1);
    }
    if (direction === 'prev' && currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const makeWhiteTransparent = (img: HTMLImageElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
  
      if (!context) {
        resolve(img.src);
        return;
      }
  
      // Ajusta o tamanho do canvas para o tamanho da imagem
      canvas.width = img.width;
      canvas.height = img.height;
  
      // Desenha a imagem no canvas
      context.drawImage(img, 0, 0);
  
      // Obtém os dados de pixels
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
  
      // Substitui o branco (255, 255, 255) por transparência
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
  
        if (r === 255 && g === 255 && b === 255) {
          data[i + 3] = 0; // Define alpha para 0 (transparente)
        }
      }
  
      // Atualiza os dados do canvas
      context.putImageData(imageData, 0, 0);
  
      // Retorna a imagem processada como uma URL de dados
      resolve(canvas.toDataURL());
    });
  };
  

  return (
    <div className="loading-container">
      {loading ? (
        <div className="loading-wrapper">
          <div className="skeleton-grid">
            {Array.from({ length: itemsPerPage }).map((_, index) => (
              <div key={index} className="skeleton-card">
                <div className="skeleton-img"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-button"></div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="error-container">Erro: {error}</div>
      ) : (
        <div className="container mt-4 casanova-page">
          <div className="row gy-3">
            {items.map((item) => (
              <div key={item.id} className="col">
                <div
                  className={`card h-100 shadow-sm ${
                    item.purchased ? 'border-success' : 'border-primary'
                  }`}
                >
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
  
          {/* Botões de navegação */}
          <button
            className={`navigation-arrow left ${currentPage === 0 ? 'disabled' : ''}`}
            onClick={() => handlePageChange('prev')}
            disabled={currentPage === 0}
          >
            ◀
          </button>
          <button
            className={`navigation-arrow right ${
              items.length < itemsPerPage ? 'disabled' : ''
            }`}
            onClick={() => handlePageChange('next')}
            disabled={items.length < itemsPerPage}
          >
            ▶
          </button>
        </div>
      )}
  
      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Pagamento via PIX</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedItem && pixCode && (
            <>
              <h5>{selectedItem.name}</h5>
              <p>Escaneie o QR Code ou copie o código abaixo:</p>
              <QRCodeSVG value={pixCode} size={200} />
              <textarea
                className="form-control mt-3"
                value={pixCode}
                readOnly
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
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
