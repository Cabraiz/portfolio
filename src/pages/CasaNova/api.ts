import { Item } from "./types";

// api.ts
const BASE_URL = "https://casa-nova-api.vercel.app";

export const fetchItems = async (
  page: number,
  itemsPerPage: number,
  sortCriterion: "price" | "name"
) => {
  const skip = page * itemsPerPage;
  const ordenarPor = sortCriterion === "price" ? "preco" : "nome"; // Tradução para os parâmetros do backend
  const response = await fetch(
    `${BASE_URL}/casa/filtro?ordenar_por=${ordenarPor}&ordem=asc&skip=${skip}&limit=${itemsPerPage}`
  );

  if (!response.ok) {
    throw new Error("Erro ao carregar os itens.");
  }

  const data: any[] = await response.json();
  return data.map((item) => ({
    id: item.id,
    name: item.item_nome,
    img: item.imagem || "https://via.placeholder.com/150",
    price: parseFloat(item.preco) || 0,
    quantity: parseInt(item.quantidade, 10) || 0,
    purchased: !!item.nome_pessoa,
  }));
};

export const fetchTotalItems = async () => {
  const response = await fetch(`${BASE_URL}/casa/quantidade`);

  if (!response.ok) {
    throw new Error("Erro ao carregar o total de itens.");
  }

  const data = await response.json();
  if (typeof data.quantidade !== "number") {
    throw new Error("Formato de resposta inválido da API de quantidade.");
  }
  return data.quantidade;
};

export const createPaymentPreference = async (
  item: Item,
  maxInstallments: number
): Promise<any> => {
  const response = await fetch(import.meta.env.VITE_MP_BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: item.name || "Sem título",
          quantity: 1,
          unit_price: parseFloat(item.price.toFixed(2)),
        },
      ],
      back_urls: {
        success: `${import.meta.env.REACT_APP_BASE_API}/success`,
        failure: `${import.meta.env.REACT_APP_BASE_API}/failure`,
        pending: `${import.meta.env.REACT_APP_BASE_API}/pending`,
      },
      auto_return: "approved",
      payment_methods: {
        installments: maxInstallments,
        default_installments: 1,
      },
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.json();
    console.error("Erro ao criar preferência de pagamento:", errorDetails);
    throw new Error(`Erro: ${response.statusText}`);
  }

  return response.json();
};
