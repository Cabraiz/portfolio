import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import { FaCreditCard, FaCopy } from "react-icons/fa";

const PaymentModal: React.FC<{
  show: boolean;
  onClose: () => void;
  pixCode: string | null;
  handleRedirectToCreditCard: () => void; // Função para o pagamento com cartão
}> = ({ show, onClose, pixCode, handleRedirectToCreditCard }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000); // Oculta a mensagem após 2 segundos
    }
  };

  const handleQRClick = () => {
    if (pixCode && /Mobi|Android/i.test(navigator.userAgent)) {
      handleCopyToClipboard();
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Pagamento</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {pixCode && (
          <>
            <QRCodeSVG
              value={pixCode}
              size={200}
              onClick={handleQRClick}
              title="Clique para copiar"
            />
            {copied && (
              <div className="copy-feedback show">Código copiado!</div>
            )}
            <button
              onClick={handleCopyToClipboard}
              className="copy-button mt-3 payment-button"
            >
              <FaCopy /> Copiar QR Code
            </button>
            <button
              onClick={handleRedirectToCreditCard}
              className="payment-button credit-card mt-3"
            >
              <FaCreditCard /> Pagar com Cartão de Crédito
            </button>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentModal;
