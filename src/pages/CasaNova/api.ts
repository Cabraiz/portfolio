import { Item } from './types';
import { makeWhiteTransparent } from './utils';

export const fetchItems = async (page: number, itemsPerPage: number): Promise<Item[]> => {
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
      const processedImg = await makeWhiteTransparent(img);

      return {
        id: item.id,
        name: item.item_nome,
        price: parseFloat(item.preco),
        img: processedImg,
        purchased: !!item.nome_pessoa,
        quantity: parseInt(item.quantidade, 10),
      };
    })
  );

  return transformedItems;
};

export const fetchTotalItems = async (): Promise<number> => {
    const response = await fetch('https://casa-nova-api.vercel.app/casa/quantidade');
  
    if (!response.ok) {
      throw new Error('Erro ao carregar o total de itens.');
    }
  
    const data = await response.json();
  
    if (typeof data.quantidade !== 'number') {
      throw new Error('Formato de resposta inválido da API de quantidade.');
    }
  
    return data.quantidade;
  };
  

