import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import './CasaNova.css';


interface Item {
  id: number;
  name: string;
  price: string;
  img: string;
  purchased: boolean;
}

const ITEMS_PER_PAGE = 10; // Número de itens por página

// Função para gerar o payload PIX no formato correto
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

  // Campos do payload
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

  // Junta os campos e calcula o CRC16
  const payloadWithoutCRC = payload.join('');
  const crc16 = calculateCRC16(`${payloadWithoutCRC}6304`); // Adiciona '6304' para o CRC16
  return `${payloadWithoutCRC}6304${crc16}`;
};

// Função para calcular o CRC16
const calculateCRC16 = (payload: string): string => {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

const NewHomeGiftPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0); // Página atual
  const [totalPages, setTotalPages] = useState<number>(1); // Total de páginas
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Função para buscar itens
  const fetchItems = async (page: number) => {
    try {
      setLoading(true);
      const skip = page * ITEMS_PER_PAGE;
      const response = await fetch(
        `https://casa-nova-api.vercel.app/casa?skip=${skip}&limit=${ITEMS_PER_PAGE}`
      );
      if (!response.ok) {
        throw new Error('Erro ao carregar os itens.');
      }
      const data: any[] = await response.json();
      const transformedItems: Item[] = data.map((item) => ({
        id: item.id,
        name: item.item_nome,
        price: `R$ ${item.preco.toFixed(2).replace('.', ',')}`,
        img: item.imagem || 'https://via.placeholder.com/150',
        purchased: !!item.nome_pessoa,
      }));
      setItems(transformedItems);
      if (response.headers.get('X-Total-Count')) {
        const totalCount = parseInt(response.headers.get('X-Total-Count')!, 10);
        setTotalPages(Math.ceil(totalCount / ITEMS_PER_PAGE));
      }
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
    const amount = parseFloat(item.price.replace('R$', '').replace(',', '.'));
    const pixPayload = generatePixPayload(
      amount,
      '61070800317', // Substitua pela sua chave PIX
      'Mateus Cardoso Cabral', // Nome do recebedor
      'SAO PAULO' // Cidade
    );
    setSelectedItem({ ...item, price: pixPayload });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
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
                alt={item.name}
                className="card-img-top"
                style={{ objectFit: 'contain', backgroundColor: 'white', height: '200px' }}
              />
              <div className="card-body text-center">
                <h5 className="card-title">{item.name}</h5>
                <p className="card-text">{item.price}</p>
                <button
                  className={`btn w-100 ${item.purchased ? 'btn-success' : 'btn-primary'}`}
                  onClick={() => handleShowPayment(item)}
                >
                  {item.purchased ? 'Comprado ✔️' : 'Pagar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Pagamento via PIX</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedItem && (
            <>
              <h5>{selectedItem.name}</h5>
              <p>Escaneie o QR Code ou copie o código abaixo:</p>
              <QRCodeSVG value={selectedItem.price} size={200} />
              <textarea
                className="form-control mt-3"
                value={selectedItem.price}
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
