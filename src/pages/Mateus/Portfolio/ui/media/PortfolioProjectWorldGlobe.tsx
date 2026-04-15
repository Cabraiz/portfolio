import LiveWorldGlobe, {
  type LiveWorldGlobePoint,
} from "../../../Live/ui/chrome/LiveWorldGlobe";

import styles from "./PortfolioProjectWorldGlobe.module.css";

export type PortfolioProjectWorldGlobeProps = Readonly<{
  className?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  target?: LiveWorldGlobePoint | null;
  origin?: LiveWorldGlobePoint | null;
  markers?: readonly LiveWorldGlobePoint[];
  compact?: boolean;
  showArcToTarget?: boolean;
  autoRotateSpeed?: number;
  decorative?: boolean;
}>;

function joinClassNames(
  ...classNames: Array<string | null | undefined | false>
): string {
  return classNames.filter(Boolean).join(" ");
}

const DEFAULT_ORIGIN: LiveWorldGlobePoint = {
  id: "fortaleza-br",
  label: "Fortaleza",
  country: "Brasil",
  region: "América do Sul",
  lat: -3.7319,
  lng: -38.5267,
  size: 0.11,
};

const DEFAULT_TARGET: LiveWorldGlobePoint = {
  id: "global-network",
  label: "Global network",
  country: "Global",
  region: "Operação distribuída",
  lat: 35.6762,
  lng: 139.6503,
  size: 0.09,
};

const DEFAULT_MARKERS: readonly LiveWorldGlobePoint[] = [
  DEFAULT_ORIGIN,
  {
    id: "toronto-ca",
    label: "Toronto",
    country: "Canadá",
    region: "América do Norte",
    lat: 43.6532,
    lng: -79.3832,
    size: 0.075,
  },
  {
    id: "berlin-de",
    label: "Berlin",
    country: "Alemanha",
    region: "Europa",
    lat: 52.52,
    lng: 13.405,
    size: 0.07,
  },
  DEFAULT_TARGET,
];

export default function PortfolioProjectWorldGlobe({
  className,
  title = "Portfólio interativo",
  subtitle = "Sinal global ativo",
  eyebrow = "World focus",
  target = DEFAULT_TARGET,
  origin = DEFAULT_ORIGIN,
  markers = DEFAULT_MARKERS,
  compact = true,
  showArcToTarget = true,
  autoRotateSpeed = 0.0038,
  decorative = true,
}: PortfolioProjectWorldGlobeProps) {
  return (
    <div
      className={joinClassNames(styles.root, className)}
      aria-hidden={decorative ? "true" : undefined}
    >
      <div className={styles.shell}>
        <LiveWorldGlobe
          className={styles.globe}
          compact={compact}
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          target={target}
          origin={origin}
          markers={markers}
          showArcToTarget={showArcToTarget}
          autoRotateSpeed={autoRotateSpeed}
        />
      </div>
    </div>
  );
}
