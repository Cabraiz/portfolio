// src/pages/Mateus/Home/components/mobile/game/elevator/HomeElevatorGame.tsx

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  HOME_ELEVATOR_CAPACITY,
  HOME_ELEVATOR_FLOOR_COUNT,
  HOME_ELEVATOR_TOP_FLOOR,
} from "./domains/homeElevator.constants";
import {
  createHomeElevatorInitialState,
  getHomeElevatorRuntimeSnapshot,
  tickHomeElevatorRuntime,
} from "./domains/homeElevator.runtime";
import type { HomeElevatorRuntimeState } from "./domains/homeElevator.types";
import styles from "./HomeElevatorGame.module.css";

export type HomeElevatorGameProps = Readonly<{
  onClose?: () => void;
}>;

type PendingCommand = Readonly<{
  selectedTargetFloor?: number;
  requestDoorToggle?: boolean;
  forceSpawn?: boolean;
}>;

const FLOOR_NUMBERS = Array.from(
  { length: HOME_ELEVATOR_FLOOR_COUNT },
  (_, index) => HOME_ELEVATOR_TOP_FLOOR - index,
);

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function formatScore(score: number): string {
  return Math.round(score).toLocaleString("pt-BR");
}

function getDoorOpenRatio(doorState: HomeElevatorRuntimeState["cabin"]["doorState"]): number {
  switch (doorState) {
    case "opening":
    case "open":
      return 1;
    case "closing":
    case "closed":
    default:
      return 0;
  }
}

function getStatusText(state: HomeElevatorRuntimeState): string {
  const { cabin, waiting } = state;

  if (state.energy <= 0) {
    return "Energia zerada. Segure o prédio e reinicie a operação.";
  }

  if (cabin.doorState === "open") {
    return "Portas abertas: entregando passageiros e embarcando quem está no andar.";
  }

  if (cabin.doorState === "opening") {
    return "Abrindo portas.";
  }

  if (cabin.doorState === "closing") {
    return "Fechando portas.";
  }

  if (Math.abs(cabin.targetFloor - cabin.yFloor) > 0.05) {
    return `Indo para o ${cabin.targetFloor}º andar.`;
  }

  if (cabin.onboard.length > 0) {
    return "Escolha o destino mais próximo para manter sequência de entrega.";
  }

  if (waiting.length > 0) {
    return "Há chamadas ativas. Toque em um andar com ponto vermelho.";
  }

  return "Prédio sob controle. Aguarde a próxima chamada.";
}

export default function HomeElevatorGame({ onClose }: HomeElevatorGameProps) {
  const [runtime, setRuntime] = useState<HomeElevatorRuntimeState>(() =>
    createHomeElevatorInitialState(),
  );
  const runtimeRef = useRef(runtime);
  const commandRef = useRef<PendingCommand>({});

  useEffect(() => {
    runtimeRef.current = runtime;
  }, [runtime]);

  useEffect(() => {
    let frameId = 0;
    let lastTimestamp = 0;
    let isActive = true;

    const tick = (timestamp: number) => {
      if (!isActive) {
        return;
      }

      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      const deltaSeconds = clamp((timestamp - lastTimestamp) / 1000, 0, 0.08);
      lastTimestamp = timestamp;

      const command = commandRef.current;
      commandRef.current = {};

      setRuntime((current) => {
        if (current.energy <= 0 && !command.forceSpawn) {
          return current;
        }

        return tickHomeElevatorRuntime(current, {
          deltaSeconds,
          ...command,
        });
      });

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      isActive = false;
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const snapshot = useMemo(() => {
    return getHomeElevatorRuntimeSnapshot(runtime);
  }, [runtime]);

  const waitingByFloor = useMemo(() => {
    const map = new Map<number, HomeElevatorRuntimeState["waiting"]>();

    for (let floor = 0; floor < HOME_ELEVATOR_FLOOR_COUNT; floor += 1) {
      map.set(floor, []);
    }

    for (const passenger of runtime.waiting) {
      const floorPassengers = map.get(passenger.originFloor) ?? [];
      map.set(passenger.originFloor, [...floorPassengers, passenger]);
    }

    return map;
  }, [runtime.waiting]);

  const queuedFloors = useMemo(() => {
    return new Set([
      ...runtime.waiting.map((passenger) => passenger.originFloor),
      ...runtime.cabin.onboard.map((passenger) => passenger.destinationFloor),
    ]);
  }, [runtime.cabin.onboard, runtime.waiting]);

  const cabinBottomPercent = useMemo(() => {
    return `${(runtime.cabin.yFloor / HOME_ELEVATOR_TOP_FLOOR) * 90}%`;
  }, [runtime.cabin.yFloor]);

  const counterweightTopPercent = useMemo(() => {
    return `${((HOME_ELEVATOR_TOP_FLOOR - runtime.cabin.yFloor) / HOME_ELEVATOR_TOP_FLOOR) * 86}%`;
  }, [runtime.cabin.yFloor]);

  const doorOpenRatio = getDoorOpenRatio(runtime.cabin.doorState);

  const cabinStyle = useMemo<CSSProperties>(() => {
    return {
      bottom: cabinBottomPercent,
      "--door-open": doorOpenRatio,
    } as CSSProperties;
  }, [cabinBottomPercent, doorOpenRatio]);

  const counterweightStyle = useMemo<CSSProperties>(() => {
    return {
      top: counterweightTopPercent,
    };
  }, [counterweightTopPercent]);

  const handleSelectFloor = useCallback((floor: number) => {
    commandRef.current = {
      ...commandRef.current,
      selectedTargetFloor: floor,
    };
  }, []);

  const handleMoveRelative = useCallback((direction: -1 | 1) => {
    const current = runtimeRef.current;
    const baseFloor = Math.round(current.cabin.yFloor);
    const nextFloor = clamp(baseFloor + direction, 0, HOME_ELEVATOR_TOP_FLOOR);

    commandRef.current = {
      ...commandRef.current,
      selectedTargetFloor: nextFloor,
    };
  }, []);

  const handleDoorToggle = useCallback(() => {
    commandRef.current = {
      ...commandRef.current,
      requestDoorToggle: true,
    };
  }, []);

  const handleForceSpawn = useCallback(() => {
    commandRef.current = {
      ...commandRef.current,
      forceSpawn: true,
    };
  }, []);

  const handleRestart = useCallback(() => {
    setRuntime(createHomeElevatorInitialState());
    commandRef.current = {};
  }, []);

  const doorLabel =
    runtime.cabin.doorState === "closed" || runtime.cabin.doorState === "closing"
      ? "Abrir"
      : "Fechar";

  const statusText = getStatusText(runtime);

  return (
    <section className={styles.root} aria-label="Jogo do elevador">
      <header className={styles.topBar}>
        <div className={styles.titleBlock}>
          <span className={styles.kicker}>Cabraiz Arcade</span>
          <h1 className={styles.title}>Elevator Control</h1>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fechar jogo do elevador"
        >
          ×
        </button>
      </header>

      <div className={styles.hud} aria-label="Indicadores do elevador">
        <div className={styles.hudCard}>
          <span className={styles.hudLabel}>Score</span>
          <span className={styles.hudValue}>{formatScore(runtime.score)}</span>
        </div>
        <div className={styles.hudCard}>
          <span className={styles.hudLabel}>Entregas</span>
          <span className={styles.hudValue}>{runtime.delivered}</span>
        </div>
        <div className={styles.hudCard}>
          <span className={styles.hudLabel}>Cabine</span>
          <span className={styles.hudValue}>
            {runtime.cabin.onboard.length}/{HOME_ELEVATOR_CAPACITY}
          </span>
        </div>
        <div className={styles.hudCard}>
          <span className={styles.hudLabel}>Energia</span>
          <span className={styles.hudValue}>{Math.round(runtime.energy)}%</span>
          <span className={styles.energyMeter} aria-hidden="true">
            <span
              className={styles.energyFill}
              style={{ width: `${runtime.energy}%` }}
            />
          </span>
        </div>
      </div>

      <div className={styles.stage}>
        <div className={styles.building} aria-label="Prédio com andares">
          <div className={styles.floorGrid}>
            {FLOOR_NUMBERS.map((floor) => {
              const waiting = waitingByFloor.get(floor) ?? [];
              const floorSnapshot = snapshot.floorSnapshots[floor];
              const visiblePassengers = waiting.slice(0, 6);
              const remainingCount = Math.max(0, waiting.length - visiblePassengers.length);

              return (
                <div key={floor} className={styles.floorRow}>
                  <span className={styles.floorNumber}>{floor}</span>
                  <span className={styles.floorWaiting} aria-label={`${waiting.length} passageiros aguardando no ${floor}º andar`}>
                    {visiblePassengers.map((passenger) => (
                      <span
                        key={passenger.id}
                        className={styles.passengerDot}
                        style={{
                          "--passenger-hue": passenger.hue,
                        } as CSSProperties}
                        title={`${passenger.originFloor} → ${passenger.destinationFloor}`}
                      />
                    ))}
                    {remainingCount > 0 ? (
                      <span className={styles.callMeta}>+{remainingCount}</span>
                    ) : null}
                  </span>
                  {floorSnapshot && floorSnapshot.waitingCount > 0 ? (
                    <span className={styles.callMeta} aria-hidden="true">
                      ↑{floorSnapshot.upCount} ↓{floorSnapshot.downCount}
                    </span>
                  ) : null}
                  <span className={styles.patienceBar} aria-hidden="true">
                    <span
                      className={styles.patienceFill}
                      style={{
                        transform: `scaleX(${floorSnapshot?.minPatienceRatio ?? 1})`,
                      }}
                    />
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.shaft} aria-hidden="true">
            <span className={styles.counterweight} style={counterweightStyle} />
            <div className={styles.cabin} style={cabinStyle}>
              <span className={`${styles.cabinDoor} ${styles.cabinDoorLeft}`} />
              <span className={`${styles.cabinDoor} ${styles.cabinDoorRight}`} />
              <span className={styles.cabinPeople}>
                {runtime.cabin.onboard.map((passenger) => (
                  <span
                    key={passenger.id}
                    className={styles.passengerDot}
                    style={{
                      "--passenger-hue": passenger.hue,
                      height: "12px",
                      width: "7px",
                    } as CSSProperties}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>

        <nav className={styles.panel} aria-label="Painel de andares">
          {FLOOR_NUMBERS.map((floor) => {
            const isActive = runtime.cabin.targetFloor === floor;
            const isCurrent = runtime.cabin.currentFloor === floor;
            const isQueued = queuedFloors.has(floor);

            return (
              <button
                key={floor}
                type="button"
                className={[
                  styles.floorButton,
                  isActive || isCurrent ? styles.floorButtonActive : "",
                  isQueued ? styles.floorButtonQueued : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleSelectFloor(floor)}
                aria-label={`Ir para o ${floor}º andar`}
              >
                {floor}
              </button>
            );
          })}
        </nav>
      </div>

      <footer className={styles.bottomControls}>
        <div className={`${styles.controlCluster} ${styles.controlClusterTall}`}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={() => handleMoveRelative(1)}
            aria-label="Subir um andar"
          >
            Subir
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={() => handleMoveRelative(-1)}
            aria-label="Descer um andar"
          >
            Descer
          </button>
        </div>

        <div className={`${styles.controlCluster} ${styles.controlClusterTall}`}>
          <button
            type="button"
            className={`${styles.controlButton} ${styles.controlButtonPrimary}`}
            onClick={handleDoorToggle}
            aria-label={`${doorLabel} portas`}
          >
            {doorLabel}
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={handleForceSpawn}
            aria-label="Adicionar nova chamada"
          >
            Chamada
          </button>
        </div>

        <div className={styles.controlCluster}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={handleRestart}
            aria-label="Reiniciar jogo do elevador"
          >
            Reiniciar
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={onClose}
            aria-label="Sair do jogo do elevador"
          >
            Sair
          </button>
        </div>

        <p className={styles.statusLine}>{statusText}</p>
      </footer>
    </section>
  );
}
