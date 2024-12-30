import React, { useState, useEffect } from "react";
import { Item } from "./types";
import { initDB, saveToDB, getFromDB } from "./dbHelpers";
import ShimmerPlaceholder from "./ShimmerPlaceholder"; // Componente de shimmer

interface DesktopViewProps {
  items: { [page: number]: Item[] };
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  handlePageChange: (direction: "next" | "prev") => void;
  handleShowPayment: (item: Item) => void;
  isLoading: boolean; // Propriedade para indicar o estado de carregamento
}

const loadImage = async (id: string, imgSrc: string): Promise<string | null> => {
  const cachedImage = await getFromDB(id); // Verifica o cache no IndexedDB
  if (cachedImage) {
    return cachedImage;
  }
  try {
    const response = await fetch(imgSrc); // Faz o download da imagem
    if (!response.ok) throw new Error(`Erro ao carregar imagem ${imgSrc}`);
    const blob = await response.blob();
    const objectURL = URL.createObjectURL(blob);

    await saveToDB(id, objectURL); // Armazena no IndexedDB
    return objectURL;
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

  useEffect(() => {
    const loadAllImages = async () => {
      const updates: { [id: string]: string | null } = {};
      await Promise.all(
        currentItems.map(async (item) => {
          const img = await loadImage(item.id.toString(), item.img); // Faz o carregamento da imagem
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
            currentItems.map((item) => (
              <div key={item.id} className="col">
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
                        src={processedImages[item.id] ?? undefined}
                        alt={item.name}
                        className="card-img-top"
                        style={{ objectFit: "contain", height: "100%" }}
                      />
                    ) : (
                      <ShimmerPlaceholder height="100%" />
                    )}
                  </div>
                  <div className="card-body text-center">
                    <h5 className="card-title">
                      {item.name || <ShimmerPlaceholder width="70%" height="20px" />}
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
