import { memo, useMemo, useState } from "react";

export type TechnologyEvidenceGalleryItem = Readonly<{
  id: string;
  title: string;
  description?: string;
  imageSrc?: string;
  meta?: string;
}>;

type TechnologyEvidenceGalleryProps = Readonly<{
  items: readonly TechnologyEvidenceGalleryItem[];
  title?: string;
  description?: string;
  initialActiveId?: string | null;
  className?: string;
}>;

function getInitialIndex(
  items: readonly TechnologyEvidenceGalleryItem[],
  initialActiveId?: string | null,
): number {
  if (!items.length) {
    return -1;
  }

  if (!initialActiveId) {
    return 0;
  }

  const foundIndex = items.findIndex((item) => item.id === initialActiveId);
  return foundIndex >= 0 ? foundIndex : 0;
}

function TechnologyEvidenceGalleryComponent({
  items,
  title = "Evidências visuais",
  description = "Provas de contexto, uso e ecossistema visual da tecnologia em um formato mais editorial.",
  initialActiveId = null,
  className,
}: TechnologyEvidenceGalleryProps) {
  const initialIndex = useMemo(
    () => getInitialIndex(items, initialActiveId),
    [items, initialActiveId],
  );

  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);
  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

  if (!items.length || !activeItem) {
    return null;
  }

  return (
    <section
      className={className}
      aria-labelledby="technology-evidence-gallery-title"
      style={{
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 8,
        }}
      >
        <h3
          id="technology-evidence-gallery-title"
          style={{
            margin: 0,
            color: "#fff8ea",
            fontSize: "1rem",
            lineHeight: 1.12,
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: 0,
            color: "rgba(255, 245, 230, 0.66)",
            fontSize: "0.9rem",
            lineHeight: 1.68,
          }}
        >
          {description}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        <figure
          style={{
            margin: 0,
            width: "100%",
            minWidth: 0,
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              minHeight: 240,
              borderRadius: 22,
              overflow: "hidden",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), radial-gradient(circle at top, rgba(212,175,55,0.12), transparent 58%), rgba(10,10,13,0.94)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 30px rgba(0,0,0,0.16)",
            }}
          >
            {activeItem.imageSrc ? (
              <img
                src={activeItem.imageSrc}
                alt=""
                loading="lazy"
                decoding="async"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  padding: 20,
                }}
              >
                <div
                  style={{
                    width: "72%",
                    maxWidth: 220,
                    aspectRatio: 1,
                    borderRadius: 28,
                    display: "grid",
                    placeItems: "center",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025)), rgba(255,255,255,0.03)",
                    boxShadow:
                      "inset 0 0 0 1px rgba(255,255,255,0.08), 0 16px 28px rgba(0,0,0,0.14)",
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255, 248, 234, 0.94)",
                      fontSize: "clamp(1.2rem, 2vw, 1.8rem)",
                      lineHeight: 1,
                      fontWeight: 800,
                      letterSpacing: "-0.05em",
                    }}
                  >
                    {activeItem.title}
                  </span>
                </div>
              </div>
            )}

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(6,6,9,0.08) 0%, rgba(6,6,9,0.22) 52%, rgba(6,6,9,0.62) 100%)",
              }}
            />
          </div>

          <figcaption
            style={{
              display: "grid",
              gap: 6,
            }}
          >
            <strong
              style={{
                color: "#fff8ea",
                fontSize: "0.94rem",
                lineHeight: 1.22,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {activeItem.title}
            </strong>

            {activeItem.description ? (
              <p
                style={{
                  margin: 0,
                  color: "rgba(255, 245, 230, 0.68)",
                  fontSize: "0.84rem",
                  lineHeight: 1.68,
                }}
              >
                {activeItem.description}
              </p>
            ) : null}

            {activeItem.meta ? (
              <span
                style={{
                  color: "rgba(255, 245, 230, 0.5)",
                  fontSize: "0.72rem",
                  lineHeight: 1,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {activeItem.meta}
              </span>
            ) : null}
          </figcaption>
        </figure>

        {items.length > 1 ? (
          <div
            role="tablist"
            aria-label="Selecionar evidência visual"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: 10,
            }}
          >
            {items.map((item, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveIndex(index)}
                  style={{
                    minWidth: 0,
                    display: "grid",
                    gap: 8,
                    padding: 10,
                    borderRadius: 16,
                    background:
                      isActive
                        ? "linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.028)), rgba(255,255,255,0.03)"
                        : "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), rgba(255,255,255,0.02)",
                    border: isActive
                      ? "1px solid rgba(212,175,55,0.34)"
                      : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isActive
                      ? "0 0 0 1px rgba(212,175,55,0.14), 0 14px 22px rgba(0,0,0,0.14)"
                      : "0 10px 18px rgba(0,0,0,0.1)",
                    color: "inherit",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      borderRadius: 12,
                      overflow: "hidden",
                      display: "block",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)), rgba(255,255,255,0.02)",
                    }}
                  >
                    {item.imageSrc ? (
                      <img
                        src={item.imageSrc}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "block",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                          color: "rgba(255, 248, 234, 0.8)",
                          fontSize: "0.74rem",
                          lineHeight: 1.2,
                          fontWeight: 700,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {item.title}
                      </span>
                    )}
                  </span>

                  <span
                    style={{
                      color: isActive
                        ? "rgba(255, 248, 234, 0.96)"
                        : "rgba(255, 245, 230, 0.76)",
                      fontSize: "0.76rem",
                      lineHeight: 1.36,
                      fontWeight: 700,
                    }}
                  >
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

const TechnologyEvidenceGallery = memo(TechnologyEvidenceGalleryComponent);
TechnologyEvidenceGallery.displayName = "TechnologyEvidenceGallery";

export default TechnologyEvidenceGallery;
