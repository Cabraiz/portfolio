import { memo, useMemo } from "react";

import type { TechnologyCatalogItem } from "../../Technologies";
import TechnologyHexCard from "../hex/TechnologyHexCard";
import styles from "./TechnologyClusterSection.module.css";

function joinClasses(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

type TechnologyClusterSectionProps = Readonly<{
  id: string;
  title: string;
  description?: string;
  eyebrow?: string;
  items: readonly TechnologyCatalogItem[];
  activeItemId?: string | null;
  className?: string;
  dense?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onSelectItem?: (item: TechnologyCatalogItem) => void;
}>;

type DecoratedItem = Readonly<{
  item: TechnologyCatalogItem;
  isFeatured: boolean;
  offsetKind: "none" | "soft" | "strong";
}>;

function buildDecoratedItems(
  items: readonly TechnologyCatalogItem[],
): DecoratedItem[] {
  return items.map((item, index) => {
    const isFeatured = index === 0 && items.length >= 3;

    const offsetKind =
      index % 4 === 1
        ? "soft"
        : index % 4 === 2
          ? "strong"
          : "none";

    return {
      item,
      isFeatured,
      offsetKind,
    };
  });
}

function TechnologyClusterSectionComponent({
  id,
  title,
  eyebrow = "Capability Cluster",
  items,
  activeItemId = null,
  className,
  dense = false,
  emptyTitle = "Nenhuma tecnologia disponível neste cluster.",
  emptyDescription = "Adicione itens ao dataset para que o cluster comece a renderizar os cards hexagonais e a navegação visual.",
  onSelectItem,
}: TechnologyClusterSectionProps) {
  const decoratedItems = useMemo(() => buildDecoratedItems(items), [items]);

  return (
    <section
      id={id}
      className={joinClasses(styles.root, className)}
      aria-labelledby={`${id}-title`}
      data-technology-cluster="true"
      data-cluster-id={id}
      data-cluster-density={dense ? "dense" : "default"}
    >
      <header className={styles.header}>
        <div className={styles.headerSurface}>
          <div className={styles.headerTop}>
            <div className={styles.titleBlock}>
              <p className={styles.eyebrow}>{eyebrow}</p>

              <h2 className={styles.title} id={`${id}-title`}>
                {title}
              </h2>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {decoratedItems.length > 0 ? (
          <div
            className={joinClasses(styles.grid, dense && styles.gridCompact)}
            role="list"
            aria-label={`Tecnologias do cluster ${title}`}
          >
            {decoratedItems.map(({ item, isFeatured, offsetKind }) => (
              <div
                key={item.id}
                role="listitem"
                className={joinClasses(
                  styles.cardItem,
                  dense && styles.cardItemDense,
                  isFeatured && !dense && styles.cardItemFeatured,
                  offsetKind === "soft" && !dense && styles.cardItemOffsetSoft,
                  offsetKind === "strong" &&
                    !dense &&
                    styles.cardItemOffset,
                )}
              >
                <TechnologyHexCard
                  item={item}
                  isActive={activeItemId === item.id}
                  onSelect={onSelectItem}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateInner}>
              <h3 className={styles.emptyStateTitle}>{emptyTitle}</h3>

              <p className={styles.emptyStateDescription}>
                {emptyDescription}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const TechnologyClusterSection = memo(TechnologyClusterSectionComponent);
TechnologyClusterSection.displayName = "TechnologyClusterSection";

export default TechnologyClusterSection;
