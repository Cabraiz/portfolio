import React, { useState, useEffect } from "react";
import { Item } from "./types";
import { getFromDB, saveToDB } from "./dbHelpers";
import ShimmerPlaceholder from "./ShimmerPlaceholder";
import { makeWhiteTransparent } from "./utils";

interface DesktopViewProps {
  items: { [page: number]: Item[] };
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  handlePageChange: (direction: "next" | "prev") => void;
  handleShowPayment: (item: Item) => void;
  isLoading: boolean;
}

const loadImage = async (
  id: string,
  imgSrc: string,
  inMemoryCache: { [id: string]: string | null }
): Promise<string | null> => {
  if (inMemoryCache[id]) {
    return inMemoryCache[id];
  }

  const cachedImage = await getFromDB(id);
  if (cachedImage) {
    inMemoryCache[id] = cachedImage;
    return cachedImage;
  }

  try {
    const img = new Image();
    img.src = imgSrc;

    const processedImage = await makeWhiteTransparent(img);
    if (!processedImage) {
      console.warn(`Processamento falhou para o item ${id}. Salvando imagem original.`);
      await saveToDB(id, imgSrc);
      inMemoryCache[id] = imgSrc;
      return imgSrc;
    }

    await saveToDB(id, processedImage);
    inMemoryCache[id] = processedImage;
    return processedImage;
  } catch (error) {
    console.error(`Erro ao carregar imagem para o item ${id}:`, error);
    return null;
  }
};


const DesktopView: React.FC<DesktopViewProps> = ({
  items,
  currentPage,
  itemsPerPage,
  totalPages,
  handlePageChange,
  handleShowPayment,
  isLoading,
}) => {
  const currentItems = items[currentPage] || [];
  const [processedImages, setProcessedImages] = useState<{ [id: string]: string | null }>({});
  const inMemoryCache: { [id: string]: string | null } = {}; // Cache em memória para evitar repetição

  useEffect(() => {
    const loadAllImages = async () => {
      const updates: { [id: string]: string | null } = {};
      await Promise.all(
        currentItems.map(async (item) => {
          const img = await loadImage(item.id.toString(), item.img, inMemoryCache);
          if (img) {
            updates[item.id] = img;
          } else {
            console.warn(`Imagem quebrada ou não processada para o item ${item.id}`);
            updates[item.id] = item.img; // Use a imagem original como fallback
          }
          updates[item.id] = img;
        })
      );
      setProcessedImages((prev) => ({ ...prev, ...updates }));
    };

    loadAllImages();
  }, [currentItems]);

  return (
    <div className="container mt-4 casanova-page">
      <div className="row gy-3">
        {isLoading
          ? // Exibir placeholders durante o carregamento
            Array.from({ length: itemsPerPage }).map((_, index) => (
              <div key={`shimmer-${index}`} className="col">
                <div className="card h-100 shadow-sm">
                  <ShimmerPlaceholder height="150px" />
                  <div className="card-body text-center">
                    <ShimmerPlaceholder width="70%" height="20px" />
                    <ShimmerPlaceholder width="50%" height="20px" style={{ marginTop: "10px" }} />
                  </div>
                </div>
              </div>
            ))
          : // Exibir itens reais
            currentItems.map((item, index) => (
              <div
                key={item.id || `item-${index}`}
                className="col"
              >
                <div
                  className={`card h-100 shadow-sm position-relative ${
                    item?.purchased ? "border-success" : "border-primary"
                  }`}
                >
                  <div
                    className="shimmer-wrapper"
                    style={{
                      height: "150px",
                      backgroundColor: "#f0f0f0",
                    }}
                  >
                    {processedImages[item.id] ? (
                      <img
                        src={processedImages[item.id] ?? item.img}
                        alt={item.name || "Imagem indisponível"}
                        className="card-img-top"
                        style={{ objectFit: "contain", height: "100%" }}
                      />
                    ) : (
                      <ShimmerPlaceholder height="100%" />
                    )}
                  </div>
                  <div className="card-body text-center">
                    <h5 className="card-title">
                      {item.name ? (
                        item.name
                      ) : (
                        <ShimmerPlaceholder width="70%" height="20px" />
                      )}
                    </h5>
                    <p className="card-text">
                      {item.price ? (
                        `R$ ${item.price.toFixed(2).replace(".", ",")}`
                      ) : (
                        <ShimmerPlaceholder width="50%" height="20px" />
                      )}
                    </p>
                    <button
                      className={`btn w-100 ${
                        item.purchased ? "btn-success" : "btn-primary"
                      }`}
                      onClick={() => handleShowPayment(item)}
                      disabled={!item.price}
                    >
                      {item.purchased ? "Comprado ✔️" : "Ajudar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>
      <button
        className={`navigation-arrow left ${currentPage === 0 ? "disabled" : ""}`}
        onClick={() => handlePageChange("prev")}
        disabled={currentPage === 0}
      >
        ◀
      </button>
      <button
        className={`navigation-arrow right ${
          currentPage >= totalPages - 1 ? "disabled" : ""
        }`}
        onClick={() => handlePageChange("next")}
        disabled={currentPage >= totalPages - 1}
      >
        ▶
      </button>
    </div>
  );
};

export default DesktopView;
