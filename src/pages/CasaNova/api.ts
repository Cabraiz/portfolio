export const fetchItems = async (page: number, itemsPerPage: number): Promise<{ id: string; name: string; img: string; price: number; quantity: number; purchased: boolean }[]> => {
  const skip = page * itemsPerPage;

  // Incluí o parâmetro ordenar_por=preco para busca padrão por preço
  const response = await fetch(
    `https://casa-nova-api.vercel.app/casa?skip=${skip}&limit=${itemsPerPage}&ordenar_por=preco&ordem=asc`
  );

  if (!response.ok) {
    throw new Error('Erro ao carregar os itens.');
  }

  const data: any[] = await response.json();

  // Retorne apenas os dados essenciais
  const transformedItems = data.map((item) => ({
    id: item.id,
    name: item.item_nome,
    img: item.imagem || 'https://via.placeholder.com/150', // Apenas o URL da imagem
    price: parseFloat(item.preco) || 0, // Valor padrão 0 para evitar erros
    quantity: parseInt(item.quantidade, 10) || 0, // Valor padrão 0
    purchased: !!item.nome_pessoa,
  }));

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
