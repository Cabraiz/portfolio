import { openDB, IDBPDatabase } from 'idb';
import { Item } from './types';

const DB_NAME = 'lazyLoadingDB';
const STORE_NAME = 'images';


// Inicializa o banco de dados
export const initDB = async (): Promise<IDBPDatabase> => {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Criação da ObjectStore com keyPath
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
  return db;
};


export const syncDBWithServer = async (fetchItemsFn: (page: number, itemsPerPage: number) => Promise<Item[]>, itemsPerPage: number): Promise<void> => {
  const db = await initDB();

  // Limpa os dados locais antes de sincronizar
  await db.clear(STORE_NAME);

  // Realiza paginação para buscar todos os itens do servidor
  let currentPage = 0;
  let hasMore = true;

  while (hasMore) {
    const items = await fetchItemsFn(currentPage, itemsPerPage);

    if (items.length > 0) {
      // Salva os itens no IndexedDB
      for (const item of items) {
        await db.put(STORE_NAME, { id: item.id, value: item.img });
      }
      currentPage++;
    } else {
      hasMore = false; // Interrompe se não houver mais itens
    }
  }
};


// Salva um valor no IndexedDB
export const saveToDB = async (key: string, value: string): Promise<void> => {
  const db = await initDB();
  // Salva apenas o valor da imagem no IndexedDB
  await db.put(STORE_NAME, { id: key, value });
};



// Recupera um valor do IndexedDB
export const getFromDB = async (key: string): Promise<string | undefined> => {
  const db = await initDB();
  const result = await db.get(STORE_NAME, key);
  return result?.value; // Retorna apenas o valor Base64
};

// Remove um valor do IndexedDB
export const deleteFromDB = async (key: string): Promise<void> => {
  const db = await initDB();
  await db.delete(STORE_NAME, key);
};

// Limpa todo o IndexedDB
export const clearDB = async (): Promise<void> => {
  const db = await initDB();
  await db.clear(STORE_NAME);
};
