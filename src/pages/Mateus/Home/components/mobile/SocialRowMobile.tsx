import { useMemo, type CSSProperties } from "react";

export type MobileSocialItem = Readonly<{
  key: string;
  href: string;
  icon: string;
  alt: string;
  target?: "_blank" | "_self";
  rel?: string;
}>;

export type SocialRowMobileProps = Readonly<{
  items: readonly MobileSocialItem[];
  className?: string;
}>;

export default function SocialRowMobile({
  items,
  className,
}: SocialRowMobileProps) {
  const rootStyle = useMemo<CSSProperties>(() => {
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      flexWrap: "wrap",
    };
  }, []);

  const itemStyle = useMemo<CSSProperties>(() => {
    return {
      width: "52px",
      height: "52px",
      borderRadius: "16px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid rgba(255,255,255,0.10)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      textDecoration: "none",
      boxSizing: "border-box",
    };
  }, []);

  return (
    <div className={className} style={rootStyle} aria-label="Redes sociais">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target={item.target ?? "_blank"}
          rel={item.rel ?? "noopener noreferrer"}
          aria-label={item.alt}
          style={itemStyle}
        >
          <img
            src={item.icon}
            alt={item.alt}
            style={{
              width: "22px",
              height: "22px",
              display: "block",
              objectFit: "contain",
            }}
          />
        </a>
      ))}
    </div>
  );
}
