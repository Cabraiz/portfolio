import { memo } from "react";

import TechnologyHexBadge, {
  type TechnologyBadgeTone,
} from "../hex/TechnologyHexBadge";

export type TechnologyRelatedStackItem = Readonly<{
  id: string;
  name: string;
  description?: string;
  iconSrc?: string;
  tone?: TechnologyBadgeTone;
  label?: string;
}>;

type TechnologyRelatedStackProps = Readonly<{
  items: readonly TechnologyRelatedStackItem[];
  title?: string;
  description?: string;
  className?: string;
}>;

function getInitials(value: string): string {
  const tokens = value
    .split(/[\s/|()-]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return "TS";
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

function TechnologyRelatedStackComponent({
  items,
  title = "Ecossistema relacionado",
  description = "Tecnologias que normalmente aparecem em conjunto no mesmo contexto de entrega.",
  className,
}: TechnologyRelatedStackProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section
      className={className}
      aria-labelledby="technology-related-stack-title"
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
          id="technology-related-stack-title"
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
        role="list"
        aria-label={title}
        style={{
          display: "grid",
          gap: 12,
        }}
      >
        {items.map((item) => (
          <article
            key={item.id}
            role="listitem"
            style={{
              minWidth: 0,
              display: "grid",
              gridTemplateColumns: "52px minmax(0, 1fr)",
              gap: 12,
              alignItems: "start",
              padding: "14px 14px 12px",
              borderRadius: 18,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.075)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.04), 0 14px 22px rgba(0,0,0,0.12)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.022)), rgba(255,255,255,0.03)",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.08), 0 10px 18px rgba(0,0,0,0.12)",
              }}
            >
              {item.iconSrc ? (
                <img
                  src={item.iconSrc}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "58%",
                    height: "58%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : (
                <span
                  style={{
                    color: "rgba(255, 248, 234, 0.94)",
                    fontSize: "0.88rem",
                    lineHeight: 1,
                    fontWeight: 800,
                    letterSpacing: "-0.05em",
                  }}
                >
                  {getInitials(item.name)}
                </span>
              )}
            </div>

            <div
              style={{
                minWidth: 0,
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <strong
                  style={{
                    color: "#fff8ea",
                    fontSize: "0.94rem",
                    lineHeight: 1.2,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.name}
                </strong>

                {item.label ? (
                  <TechnologyHexBadge
                    label={item.label}
                    tone={item.tone ?? "neutral"}
                  />
                ) : null}
              </div>

              {item.description ? (
                <p
                  style={{
                    margin: 0,
                    color: "rgba(255, 245, 230, 0.66)",
                    fontSize: "0.84rem",
                    lineHeight: 1.68,
                  }}
                >
                  {item.description}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const TechnologyRelatedStack = memo(TechnologyRelatedStackComponent);
TechnologyRelatedStack.displayName = "TechnologyRelatedStack";

export default TechnologyRelatedStack;
