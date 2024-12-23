import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import './CasaNova.css';

interface Item {
  id: number;
  name: string;
  price: number; // Agora price é um número
  img: string;
  purchased: boolean;
}

const NewHomeGiftPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0); // Página atual
  const [itemsPerPage, setItemsPerPage] = useState<number>(4); // Itens por página
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);

  // Função para gerar o payload PIX
  const generatePixPayload = (
    amount: number,
    pixKey: string,
    merchantName: string,
    merchantCity: string
  ): string => {
    const TRANSACTION_AMOUNT = amount.toFixed(2); // Valor formatado

    // Função auxiliar para formatar os campos
    const formatField = (id: string, value: string): string =>
      `${id}${value.length.toString().padStart(2, '0')}${value}`;

    const payload = [
      formatField('00', '01'), // Payload Format Indicator
      formatField(
        '26',
        formatField('00', 'BR.GOV.BCB.PIX') + // Merchant Account Information GUI
          formatField('01', pixKey) // Chave PIX
      ),
      formatField('52', '0000'), // Merchant Category Code
      formatField('53', '986'), // Moeda (BRL)
      formatField('54', TRANSACTION_AMOUNT), // Valor da transação
      formatField('58', 'BR'), // Código do país
      formatField('59', merchantName), // Nome do recebedor
      formatField('60', merchantCity), // Cidade do recebedor
      formatField(
        '62',
        formatField('05', 'evHhFaTSaG') // ID único de transação (Exemplo: evHhFaTSaG)
      ),
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

  // Função para buscar itens
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
      const transformedItems: Item[] = data.map((item) => ({
        id: item.id,
        name: item.item_nome,
        price: parseFloat(item.preco), // Converte o preço para número
        img: item.imagem || 'https://via.placeholder.com/150',
        purchased: !!item.nome_pessoa,
      }));
      setItems(transformedItems);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(currentPage);
  }, [currentPage, itemsPerPage]);

  const handleShowPayment = (item: Item) => {
    const payload = generatePixPayload(
      item.price,
      '61070800317', // Substitua pela sua chave PIX
      'Mateus Cardoso Cabral', // Nome do recebedor
      'SAO PAULO' // Cidade do recebedor
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

  if (loading) {
    return <div className="text-center mt-5">Carregando itens...</div>;
  }

  if (error) {
    return <div className="text-center mt-5 text-danger">Erro: {error}</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Chá de Casa Nova 🎉</h1>

      {/* Lista de Itens */}
      <div className="row gy-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`col-${12 / itemsPerPage}`}
            style={{ transition: '0.3s' }}
          >
            <div
              className={`card h-100 shadow-sm ${
                item.purchased ? 'border-success' : 'border-primary'
              }`}
            >
              <img
                src={item.img}
                alt={item.name}
                className="card-img-top p-2"
                style={{ objectFit: 'contain', height: '200px' }}
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

      {/* Navegação entre páginas */}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <button
          className="btn btn-lg btn-primary"
          onClick={() => handlePageChange('prev')}
          disabled={currentPage === 0}
        >
          ◀
        </button>
        <span>Página {currentPage + 1}</span>
        <button
          className="btn btn-lg btn-primary"
          onClick={() => handlePageChange('next')}
          disabled={items.length < itemsPerPage}
        >
          ▶
        </button>
      </div>

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
