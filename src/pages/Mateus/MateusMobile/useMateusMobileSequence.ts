import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import gsap from "gsap";

type UseMateusMobileSequenceParams = Readonly<{
  contentRef: RefObject<HTMLDivElement | null>;
  logoRef: RefObject<HTMLDivElement | null>;
  titleRef: RefObject<HTMLHeadingElement | null>;
  audioSrc: string;
  scatterDurationMs?: number;
  scatterDistance?: number;
  logoShiftY?: number;
}>;

type ResetAnimationOptions = Readonly<{
  hideBookingForm?: boolean;
  resetFormSelection?: boolean;
  resetLogoAndTitle?: boolean;
  stopAudio?: boolean;
}>;

type ConfirmBookingPayload = Readonly<{
  selectedDay: string;
  selectedTime: string;
}>;

type UseMateusMobileSequenceReturn = Readonly<{
  holeActive: boolean;
  showBookingForm: boolean;
  selectedDay: string;
  setSelectedDay: Dispatch<SetStateAction<string>>;
  selectedTime: string;
  setSelectedTime: Dispatch<SetStateAction<string>>;
  isSequenceRunning: boolean;
  handleSubtitleClick: () => void;
  handleCallToAction: () => void;
  handleConfirmBooking: (
    onConfirm?: (payload: ConfirmBookingPayload) => void
  ) => void;
  resetAnimation: (options?: ResetAnimationOptions) => void;
  audioControls: Readonly<{
    play: () => Promise<void>;
    stop: () => void;
    reset: () => void;
  }>;
}>;

function getContentTargets(contentRef: RefObject<HTMLDivElement | null>): HTMLElement[] {
  const element = contentRef.current;
  if (!element) {
    return [];
  }

  return Array.from(element.children) as HTMLElement[];
}

export function useMateusMobileSequence({
  contentRef,
  logoRef,
  titleRef,
  audioSrc,
  scatterDurationMs = 2500,
  scatterDistance = 400,
  logoShiftY = 80,
}: UseMateusMobileSequenceParams): UseMateusMobileSequenceReturn {
  const [holeActive, setHoleActive] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSequenceRunning, setIsSequenceRunning] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sequenceTimeoutRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);

  const clearPendingTimeout = useCallback(() => {
    if (sequenceTimeoutRef.current !== null) {
      window.clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
  }, []);

  const resetAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
  }, []);

  const playAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    try {
      audio.currentTime = 0;
      await audio.play();
    } catch {
      // Silencioso de propósito:
      // autoplay/restrições do navegador não devem quebrar a sequência.
    }
  }, []);

  const resetAnimation = useCallback(
    (options?: ResetAnimationOptions) => {
      const {
        hideBookingForm = false,
        resetFormSelection = false,
        resetLogoAndTitle = true,
        stopAudio: shouldStopAudio = true,
      } = options ?? {};

      clearPendingTimeout();
      setHoleActive(false);
      setIsSequenceRunning(false);

      if (hideBookingForm) {
        setShowBookingForm(false);
      }

      if (resetFormSelection) {
        setSelectedDay("");
        setSelectedTime("");
      }

      if (shouldStopAudio) {
        resetAudio();
      }

      const contentTargets = getContentTargets(contentRef);
      if (contentTargets.length > 0) {
        gsap.killTweensOf(contentTargets);
        gsap.to(contentTargets, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          overwrite: "auto",
        });
      }

      if (resetLogoAndTitle) {
        const headerTargets = [logoRef.current, titleRef.current].filter(
          Boolean
        ) as HTMLElement[];

        if (headerTargets.length > 0) {
          gsap.killTweensOf(headerTargets);
          gsap.to(headerTargets, {
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      }
    },
    [clearPendingTimeout, contentRef, logoRef, resetAudio, titleRef]
  );

  const handleSubtitleClick = useCallback(() => {
    const contentTargets = getContentTargets(contentRef);
    if (contentTargets.length === 0 || isSequenceRunning) {
      return;
    }

    clearPendingTimeout();
    setIsSequenceRunning(true);
    setShowBookingForm(false);
    setHoleActive(true);

    void playAudio();

    gsap.killTweensOf(contentTargets);
    gsap.to(contentTargets, {
      x: () => (Math.random() - 0.5) * scatterDistance,
      y: () => (Math.random() - 0.5) * scatterDistance,
      rotation: () => (Math.random() - 0.5) * 360,
      scale: 0,
      opacity: 0,
      duration: 2,
      ease: "power3.in",
      overwrite: "auto",
    });

    sequenceTimeoutRef.current = window.setTimeout(() => {
      if (isUnmountedRef.current) {
        return;
      }

      setShowBookingForm(true);
      setHoleActive(false);
      setIsSequenceRunning(false);

      const freshTargets = getContentTargets(contentRef);
      if (freshTargets.length > 0) {
        gsap.killTweensOf(freshTargets);
        gsap.to(freshTargets, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          overwrite: "auto",
        });
      }

      const headerTargets = [logoRef.current, titleRef.current].filter(
        Boolean
      ) as HTMLElement[];

      if (headerTargets.length > 0) {
        gsap.killTweensOf(headerTargets);
        gsap.to(headerTargets, {
          y: logoShiftY,
          duration: 1,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    }, scatterDurationMs);
  }, [
    clearPendingTimeout,
    contentRef,
    isSequenceRunning,
    logoRef,
    logoShiftY,
    playAudio,
    scatterDistance,
    scatterDurationMs,
    titleRef,
  ]);

  const handleCallToAction = useCallback(() => {
    clearPendingTimeout();
    setHoleActive(false);
    setIsSequenceRunning(false);
    setShowBookingForm(true);
  }, [clearPendingTimeout]);

  const handleConfirmBooking = useCallback(
    (onConfirm?: (payload: ConfirmBookingPayload) => void) => {
      if (onConfirm) {
        onConfirm({
          selectedDay,
          selectedTime,
        });
      }

      setShowBookingForm(false);
      setSelectedDay("");
      setSelectedTime("");

      resetAnimation({
        hideBookingForm: false,
        resetFormSelection: false,
        resetLogoAndTitle: true,
        stopAudio: true,
      });
    },
    [resetAnimation, selectedDay, selectedTime]
  );

  useEffect(() => {
    isUnmountedRef.current = false;

    if (typeof Audio === "undefined") {
      return () => {
        isUnmountedRef.current = true;
      };
    }

    const audio = new Audio(audioSrc);
    audio.preload = "auto";
    audio.load();
    audioRef.current = audio;

    return () => {
      isUnmountedRef.current = true;
      clearPendingTimeout();

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      audioRef.current = null;
    };
  }, [audioSrc, clearPendingTimeout]);

  const audioControls = useMemo(
    () => ({
      play: playAudio,
      stop: stopAudio,
      reset: resetAudio,
    }),
    [playAudio, resetAudio, stopAudio]
  );

  return {
    holeActive,
    showBookingForm,
    selectedDay,
    setSelectedDay,
    selectedTime,
    setSelectedTime,
    isSequenceRunning,
    handleSubtitleClick,
    handleCallToAction,
    handleConfirmBooking,
    resetAnimation,
    audioControls,
  };
}

export default useMateusMobileSequence;
