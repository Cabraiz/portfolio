// utils.ts
export const calculateCRC16 = (payload: string): string => {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  };
  
  export const generatePixPayload = (
    amount: number,
    pixKey: string,
    merchantName: string,
    merchantCity: string
  ): string => {
    const formatField = (id: string, value: string): string =>
      `${id}${value.length.toString().padStart(2, '0')}${value}`;
    const payload = [
      formatField('00', '01'),
      formatField('26', formatField('00', 'BR.GOV.BCB.PIX') + formatField('01', pixKey)),
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
  
  export const makeWhiteTransparent = (img: HTMLImageElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!img.complete || img.naturalWidth === 0) {
        img.onload = () => {
          processImage(img, resolve, reject);
        };
        img.onerror = () => reject(new Error("Falha ao carregar a imagem."));
      } else {
        processImage(img, resolve, reject);
      }
    });
  };
  
  const processImage = (
    img: HTMLImageElement,
    resolve: (value: string) => void,
    reject: (reason?: any) => void
  ) => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(img.src);
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
          data[i + 3] = 0; // Tornando transparente
        }
      }
      context.putImageData(imageData, 0, 0);
      const base64Image = canvas.toDataURL();
      resolve(base64Image);
    } catch (error) {
      console.error("Erro ao processar a imagem:", error);
      reject(error);
    }
  };
  