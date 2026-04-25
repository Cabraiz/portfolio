import React, { useMemo, useState } from "react";

type HomeArcadePhase = "playing" | "paused" | "lost" | "won";

type ArcadePlayer = Readonly<{
  x: number;
  y: number;
  size: number;
  invulnerableFor?: number;
}>;

type ArcadeCoin = Readonly<{
  id?: string | number;
  x: number;
  y: number;
  size: number;
}>;

type ArcadeHazard = Readonly<{
  id?: string | number;
  x: number;
  y: number;
  width: number;
  height: number;
}>;

type LeaderboardEntry = Readonly<{
  rank: number;
  name: string;
  score: number;
  isCurrentPlayer: boolean;
}>;

export type HomeArcadeCanvasProps = Readonly<{
  portraitSrc: string;
  portraitAlt?: string;
  phase: HomeArcadePhase;
  player: ArcadePlayer;
  coins: readonly ArcadeCoin[];
  hazards: readonly ArcadeHazard[];
  score: number;
  bestCombo: number;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
}>;

const LOGICAL_ARENA_WIDTH = 480;
const LOGICAL_ARENA_HEIGHT = 386;
const GROUND_HEIGHT = 68;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function createSeed(score: number, bestCombo: number, phase: HomeArcadePhase) {
  const phaseValue = phase === "won" ? 97 : phase === "lost" ? 53 : 21;
  return score * 17 + bestCombo * 37 + phaseValue * 101;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pickFrom<T>(items: readonly T[], seed: number): T {
  const index = Math.floor(seededRandom(seed) * items.length);
  return items[index];
}

function buildRandomName(seed: number): string {
  const prefixes = [
    "Sir",
    "Lord",
    "Duke",
    "Ash",
    "Iron",
    "Dark",
    "Stone",
    "Wolf",
    "Raven",
    "Night",
    "Storm",
    "Gold",
    "Flame",
    "Frost",
    "Void",
    "Crimson",
  ] as const;

  const suffixes = [
    "blade",
    "warden",
    "fang",
    "crown",
    "shield",
    "reaper",
    "thorn",
    "hunter",
    "forge",
    "bloom",
    "watch",
    "claw",
    "born",
    "heart",
    "veil",
    "strike",
  ] as const;

  const middle = [
    "Arden",
    "Kael",
    "Riven",
    "Tiber",
    "Auron",
    "Varek",
    "Lucan",
    "Draven",
    "Soren",
    "Eldric",
    "Cassian",
    "Theron",
    "Leoric",
    "Maelis",
  ] as const;

  const mode = Math.floor(seededRandom(seed + 1) * 3);

  if (mode === 0) {
    return `${pickFrom(prefixes, seed + 2)}${pickFrom(suffixes, seed + 3)}`;
  }

  if (mode === 1) {
    return `${pickFrom(middle, seed + 4)} ${pickFrom(suffixes, seed + 5)}`;
  }

  return `${pickFrom(prefixes, seed + 6)} ${pickFrom(middle, seed + 7)}`;
}

function buildLeaderboard(
  score: number,
  bestCombo: number,
  phase: HomeArcadePhase,
  playerName: string,
): {
  currentRank: number;
  entries: readonly LeaderboardEntry[];
} {
  const seed = createSeed(score, bestCombo, phase);

  const scoreFactor = clamp(score / 1800, 0, 1);
  const comboFactor = clamp(bestCombo / 12, 0, 1);
  const phaseFactor = phase === "won" ? 0.22 : 0.08;

  const performance = clamp(
    0.18 + scoreFactor * 0.48 + comboFactor * 0.22 + phaseFactor,
    0,
    1,
  );

  const rawRank = Math.round(5000 - performance * 4200);
  const currentRank = clamp(rawRank, 3, 4998);

  const safePlayerName = playerName.trim() || "Your Name";

  const entries: LeaderboardEntry[] = [];

  for (let offset = -2; offset <= 2; offset += 1) {
    const rank = currentRank + offset;
    const deltaSeed = seed + rank * 19 + offset * 101;

    let entryScore = score;

    if (offset < 0) {
      entryScore =
        score +
        180 +
        Math.round(seededRandom(deltaSeed + 10) * 520) +
        Math.abs(offset) * 90;
    } else if (offset > 0) {
      entryScore =
        score -
        (140 + Math.round(seededRandom(deltaSeed + 20) * 460) + offset * 80);
    }

    entryScore = Math.max(120, entryScore);

    entries.push({
      rank,
      name: offset === 0 ? safePlayerName : buildRandomName(deltaSeed),
      score: entryScore,
      isCurrentPlayer: offset === 0,
    });
  }

  return {
    currentRank,
    entries,
  };
}

function toPercentX(x: number): string {
  return `${(x / LOGICAL_ARENA_WIDTH) * 100}%`;
}

function toPercentY(y: number): string {
  return `${(y / LOGICAL_ARENA_HEIGHT) * 100}%`;
}

function toPercentWidth(width: number): string {
  return `${(width / LOGICAL_ARENA_WIDTH) * 100}%`;
}

function toPercentHeight(height: number): string {
  return `${(height / LOGICAL_ARENA_HEIGHT) * 100}%`;
}

export default function HomeArcadeCanvas({
  portraitSrc,
  portraitAlt = "Mateus Cabral",
  phase,
  player,
  coins,
  hazards,
  score,
  bestCombo,
  onPrimaryAction,
  onSecondaryAction,
}: HomeArcadeCanvasProps) {
  const [playerName, setPlayerName] = useState("");

  const leaderboard = useMemo(() => {
    return buildLeaderboard(score, bestCombo, phase, playerName);
  }, [bestCombo, phase, playerName, score]);

  const isPaused = phase === "paused";
  const showResultOverlay = phase === "lost" || phase === "won";
  const showOverlay = isPaused || showResultOverlay;

  const rootStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "relative",
      width: "100%",
      height: "100%",
      minHeight: 0,
      overflow: "hidden",
      borderRadius: "24px",
      background:
        "radial-gradient(circle at 50% 18%, rgba(255, 177, 70, 0.16) 0%, rgba(255,255,255,0.00) 26%), linear-gradient(180deg, rgba(23,23,37,0.98) 0%, rgba(12,10,18,1) 100%)",
      border: "1px solid rgba(255, 206, 120, 0.10)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.03), 0 12px 24px rgba(0,0,0,0.18)",
      boxSizing: "border-box",
      isolation: "isolate",
    };
  }, []);

  const dustStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "radial-gradient(circle at 15% 26%, rgba(255,255,255,0.08) 0 1px, transparent 1.5px), radial-gradient(circle at 80% 24%, rgba(255,255,255,0.06) 0 1px, transparent 1.5px), radial-gradient(circle at 62% 34%, rgba(255,210,120,0.12) 0 1.2px, transparent 1.7px), radial-gradient(circle at 32% 14%, rgba(255,255,255,0.05) 0 1px, transparent 1.5px)",
      opacity: 0.65,
    };
  }, []);

  const castleGlowStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      left: "50%",
      bottom: `${(GROUND_HEIGHT / LOGICAL_ARENA_HEIGHT) * 100 + 8}%`,
      transform: "translateX(-50%)",
      width: "72%",
      height: "54%",
      pointerEvents: "none",
      background:
        "radial-gradient(circle at 50% 70%, rgba(255, 179, 83, 0.18) 0%, rgba(255, 179, 83, 0.08) 24%, rgba(255,255,255,0.00) 62%)",
      filter: "blur(16px)",
      opacity: 0.9,
    };
  }, []);

  const floorStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: toPercentHeight(GROUND_HEIGHT),
      background:
        "linear-gradient(180deg, rgba(92,65,28,0.95) 0%, rgba(58,37,14,1) 100%)",
      borderTop: "1px solid rgba(255, 214, 136, 0.16)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      zIndex: 1,
    };
  }, []);

  const floorTextureStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(90deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 30px), linear-gradient(180deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 100%)",
      opacity: 0.28,
      pointerEvents: "none",
    };
  }, []);

  const bannerStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      top: "12px",
      left: "12px",
      right: "12px",
      zIndex: 5,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      pointerEvents: "none",
    };
  }, []);

  const badgeStyle = useMemo<React.CSSProperties>(() => {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "30px",
      padding: "0 10px",
      borderRadius: "999px",
      border: "1px solid rgba(255, 205, 118, 0.24)",
      background:
        "linear-gradient(180deg, rgba(64,44,18,0.86) 0%, rgba(25,17,8,0.96) 100%)",
      color: "rgba(255, 236, 196, 0.94)",
      fontSize: "0.68rem",
      fontWeight: 800,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      boxShadow:
        "0 8px 14px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.04)",
      whiteSpace: "nowrap",
    };
  }, []);

  const arenaDimStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      background: showOverlay ? "rgba(5, 5, 8, 0.48)" : "transparent",
      zIndex: 6,
      transition: "background 220ms ease",
      pointerEvents: "none",
    };
  }, [showOverlay]);

  const overlayWrapStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      zIndex: 7,
      display: showOverlay ? "flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      padding: "14px",
      boxSizing: "border-box",
      overflow: "auto",
    };
  }, [showOverlay]);

  const overlayCardStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      maxWidth: "360px",
      maxHeight: "100%",
      overflow: "auto",
      borderRadius: "24px",
      border: "1px solid rgba(255, 207, 128, 0.22)",
      background:
        "linear-gradient(180deg, rgba(36,24,10,0.96) 0%, rgba(16,11,5,0.985) 100%)",
      boxShadow:
        "0 22px 44px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,245,220,0.05)",
      padding: "16px 14px 14px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      boxSizing: "border-box",
      color: "rgba(255, 244, 224, 0.96)",
      textAlign: "center",
    };
  }, []);

  const pausedTitleStyle = useMemo<React.CSSProperties>(() => {
    return {
      margin: 0,
      fontSize: "0.88rem",
      fontWeight: 800,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "rgba(255, 214, 142, 0.92)",
    };
  }, []);

  const pausedHeadlineStyle = useMemo<React.CSSProperties>(() => {
    return {
      margin: 0,
      fontSize: "0.96rem",
      fontWeight: 800,
      lineHeight: 1.2,
      color: "rgba(255, 246, 229, 0.98)",
      letterSpacing: "-0.02em",
    };
  }, []);

  const rankBlockStyle = useMemo<React.CSSProperties>(() => {
    return {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "18px",
      padding: "14px 12px 10px",
      background:
        "linear-gradient(180deg, rgba(88,58,20,0.42) 0%, rgba(39,24,7,0.5) 100%)",
      border: "1px solid rgba(255, 213, 132, 0.16)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    };
  }, []);

  const rankLabelStyle = useMemo<React.CSSProperties>(() => {
    return {
      margin: 0,
      fontSize: "0.64rem",
      fontWeight: 800,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "rgba(255, 216, 148, 0.82)",
    };
  }, []);

  const rankValueStyle = useMemo<React.CSSProperties>(() => {
    return {
      margin: 0,
      fontSize: "2.1rem",
      lineHeight: 1,
      fontWeight: 900,
      letterSpacing: "-0.08em",
      color: "#ffe8b2",
      textShadow: "0 2px 16px rgba(0,0,0,0.28)",
    };
  }, []);

  const leaderboardStyle = useMemo<React.CSSProperties>(() => {
    return {
      display: "grid",
      gap: "8px",
      width: "100%",
    };
  }, []);

  const getLeaderboardRowStyle = (isCurrentPlayer: boolean): React.CSSProperties => {
    return {
      width: "100%",
      minHeight: "50px",
      display: "grid",
      gridTemplateColumns: "54px minmax(0, 1fr) 72px",
      alignItems: "center",
      gap: "8px",
      padding: "9px 10px",
      borderRadius: "14px",
      background: isCurrentPlayer
        ? "linear-gradient(180deg, rgba(132,91,26,0.86) 0%, rgba(78,50,14,0.98) 100%)"
        : "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      border: isCurrentPlayer
        ? "1px solid rgba(255, 216, 132, 0.24)"
        : "1px solid rgba(255,255,255,0.05)",
      boxShadow: isCurrentPlayer
        ? "0 12px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)"
        : "0 10px 18px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.03)",
      boxSizing: "border-box",
    };
  };

  const leaderboardRankStyle = useMemo<React.CSSProperties>(() => {
    return {
      fontSize: "0.84rem",
      fontWeight: 900,
      letterSpacing: "-0.03em",
      color: "rgba(255, 234, 198, 0.98)",
      textAlign: "left",
      whiteSpace: "nowrap",
    };
  }, []);

  const leaderboardNameStyle = useMemo<React.CSSProperties>(() => {
    return {
      fontSize: "0.8rem",
      fontWeight: 800,
      color: "rgba(255, 244, 224, 0.96)",
      textAlign: "left",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      minWidth: 0,
    };
  }, []);

  const leaderboardScoreStyle = useMemo<React.CSSProperties>(() => {
    return {
      fontSize: "0.76rem",
      fontWeight: 900,
      color: "rgba(255, 230, 184, 0.96)",
      textAlign: "right",
      whiteSpace: "nowrap",
      letterSpacing: "-0.02em",
    };
  }, []);

  const currentPlayerInputStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: "100%",
      minWidth: 0,
      height: "32px",
      borderRadius: "10px",
      border: "1px solid rgba(255, 220, 162, 0.18)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
      color: "rgba(255, 247, 229, 0.98)",
      padding: "0 10px",
      outline: "none",
      boxSizing: "border-box",
      fontSize: "0.78rem",
      fontWeight: 800,
    };
  }, []);

  const actionRowStyle = useMemo<React.CSSProperties>(() => {
    return {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
      width: "100%",
    };
  }, []);

  const primaryButtonStyle = useMemo<React.CSSProperties>(() => {
    return {
      minHeight: "46px",
      borderRadius: "16px",
      border: "1px solid rgba(255, 213, 124, 0.34)",
      background:
        "linear-gradient(180deg, rgba(130,91,34,0.98) 0%, rgba(72,45,15,1) 100%)",
      color: "rgba(255, 245, 226, 0.98)",
      fontSize: "0.78rem",
      fontWeight: 800,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      cursor: "pointer",
      boxShadow:
        "0 12px 22px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
      transition: "transform 120ms ease, opacity 120ms ease",
    };
  }, []);

  const secondaryButtonStyle = useMemo<React.CSSProperties>(() => {
    return {
      minHeight: "46px",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      color: "rgba(255, 239, 215, 0.88)",
      fontSize: "0.74rem",
      fontWeight: 800,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      cursor: "pointer",
      boxShadow:
        "0 10px 18px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.04)",
      transition: "transform 120ms ease, opacity 120ms ease",
    };
  }, []);

  const renderPlayerStyle = useMemo<React.CSSProperties>(() => {
    return {
      position: "absolute",
      left: toPercentX(player.x),
      top: toPercentY(player.y),
      width: "11.6%",
      height: "14.5%",
      minWidth: "40px",
      minHeight: "40px",
      maxWidth: "56px",
      maxHeight: "56px",
      borderRadius: "20px",
      overflow: "hidden",
      border: "2px solid rgba(255, 216, 144, 0.16)",
      background:
        "linear-gradient(180deg, rgba(30,30,36,0.96) 0%, rgba(13,13,16,1) 100%)",
      boxShadow:
        "0 14px 20px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.03) inset",
      zIndex: 4,
      opacity: player.invulnerableFor && player.invulnerableFor > 0 ? 0.78 : 1,
      boxSizing: "border-box",
    };
  }, [player]);

  return (
    <div style={rootStyle}>
      <div style={dustStyle} />
      <div style={castleGlowStyle} />

      <div style={bannerStyle}>
        <span style={badgeStyle}>Score {formatInteger(score)}</span>
        <span style={badgeStyle}>Combo x{bestCombo}</span>
      </div>

      {coins.map((coin, index) => {
        return (
          <div
            key={coin.id ?? `coin-${index}`}
            style={{
              position: "absolute",
              left: toPercentX(coin.x),
              top: toPercentY(coin.y),
              width: "5%",
              height: "6.2%",
              minWidth: "18px",
              minHeight: "18px",
              maxWidth: "24px",
              maxHeight: "24px",
              borderRadius: "999px",
              background:
                "radial-gradient(circle, rgba(255,228,156,1) 0%, rgba(255,193,74,0.98) 52%, rgba(176,111,24,1) 100%)",
              border: "1px solid rgba(255, 239, 190, 0.28)",
              boxShadow:
                "0 0 18px rgba(255, 198, 82, 0.2), inset 0 1px 0 rgba(255,255,255,0.24)",
              zIndex: 3,
              boxSizing: "border-box",
            }}
          />
        );
      })}

      {hazards.map((hazard, index) => {
        return (
          <div
            key={hazard.id ?? `hazard-${index}`}
            style={{
              position: "absolute",
              left: toPercentX(hazard.x),
              top: toPercentY(hazard.y),
              width: toPercentWidth(hazard.width),
              height: toPercentHeight(hazard.height),
              minWidth: "22px",
              minHeight: "18px",
              borderRadius: "12px 12px 6px 6px",
              background:
                "linear-gradient(180deg, rgba(93,75,58,0.98) 0%, rgba(40,28,22,1) 100%)",
              border: "1px solid rgba(255, 214, 145, 0.08)",
              boxShadow:
                "0 10px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
              zIndex: 2,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "12%",
                right: "12%",
                top: "-8px",
                height: "10px",
                background:
                  "repeating-linear-gradient(90deg, rgba(203, 182, 144, 0.9) 0 10px, transparent 10px 18px)",
                clipPath:
                  "polygon(0 100%, 10% 0, 20% 100%, 30% 0, 40% 100%, 50% 0, 60% 100%, 70% 0, 80% 100%, 90% 0, 100% 100%)",
              }}
            />
          </div>
        );
      })}

      <div style={renderPlayerStyle}>
        <img
          src={portraitSrc}
          alt={portraitAlt}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
            userSelect: "none",
            WebkitUserDrag: "none",
          }}
        />
      </div>

      <div style={floorStyle}>
        <div style={floorTextureStyle} />
      </div>

      <div style={arenaDimStyle} />

      <div style={overlayWrapStyle}>
        {isPaused ? (
          <div style={overlayCardStyle}>
            <p style={pausedTitleStyle}>Pausa</p>
            <h3 style={pausedHeadlineStyle}>Jornada interrompida</h3>

            <div style={actionRowStyle}>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={onSecondaryAction}
              >
                Continuar
              </button>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={onPrimaryAction}
              >
                Reiniciar
              </button>
            </div>
          </div>
        ) : null}

        {showResultOverlay ? (
          <div style={overlayCardStyle}>
            <div style={rankBlockStyle}>
              <p style={rankLabelStyle}>Rank</p>
              <p style={rankValueStyle}>#{leaderboard.currentRank}</p>
            </div>

            <div style={leaderboardStyle}>
              {leaderboard.entries.map((entry) => {
                return (
                  <div
                    key={`${entry.rank}-${entry.name}-${entry.score}`}
                    style={getLeaderboardRowStyle(entry.isCurrentPlayer)}
                  >
                    <div style={leaderboardRankStyle}>#{entry.rank}</div>

                    <div style={leaderboardNameStyle}>
                      {entry.isCurrentPlayer ? (
                        <input
                          type="text"
                          value={playerName}
                          onChange={(event) => setPlayerName(event.target.value)}
                          placeholder="Your name"
                          maxLength={18}
                          style={currentPlayerInputStyle}
                        />
                      ) : (
                        entry.name
                      )}
                    </div>

                    <div style={leaderboardScoreStyle}>
                      {formatInteger(entry.score)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={actionRowStyle}>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={onPrimaryAction}
              >
                Jogar de novo
              </button>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={onSecondaryAction}
              >
                Encerrar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
