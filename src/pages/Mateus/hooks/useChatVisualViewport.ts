import { useLayoutEffect, type RefObject } from 'react';

type ChatViewportRefs = {
  enabled: boolean;
  hasMessages: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
  followLatestRef: RefObject<boolean>;
};

/** Fit the overlay to the visible screen, without resizing the landing page. */
export default function useChatVisualViewport({ enabled, hasMessages, panelRef, inputRef, scrollRef, followLatestRef }: ChatViewportRefs) {
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!enabled || !panel) return;
    const viewport = window.visualViewport;
    let baselineWidth = window.innerWidth;
    let baselineHeight = window.innerHeight;
    let frame: number | null = null;
    let wasKeyboardOpen = false;
    followLatestRef.current = true;
    const variables = ['--chat-visible-top', '--chat-visible-left', '--chat-visible-width', '--chat-visible-height', '--chat-panel-height'];
    const measure = () => {
      frame = null;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      if (Math.abs(window.innerWidth - baselineWidth) > 60) {
        baselineWidth = window.innerWidth;
        baselineHeight = window.innerHeight;
      } else {
        baselineHeight = Math.max(baselineHeight, window.innerHeight, height);
      }
      const keyboardOpen = document.activeElement === inputRef.current &&
        (viewport?.scale ?? 1) < 1.05 && baselineHeight - height > 100;
      const compact = keyboardOpen || height < 480;
      const panelHeight = Math.max(0, Math.min(height - 24,
        compact ? height - 24 : Math.min(height * .8, hasMessages ? 520 : 360)));
      for (const [property, value] of [
        ['--chat-visible-top', viewport?.offsetTop ?? 0],
        ['--chat-visible-left', viewport?.offsetLeft ?? 0],
        ['--chat-visible-width', width], ['--chat-visible-height', height],
        ['--chat-panel-height', panelHeight],
      ] as const) panel.style.setProperty(property, `${value}px`);
      panel.dataset.chatCompact = String(compact);
      panel.dataset.chatKeyboardOpen = String(keyboardOpen);
      const area = scrollRef.current;
      if (area && (followLatestRef.current || keyboardOpen && !wasKeyboardOpen)) {
        area.scrollTop = area.scrollHeight;
      }
      wasKeyboardOpen = keyboardOpen;
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };
    measure();
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    panel.addEventListener('focusin', schedule);
    panel.addEventListener('focusout', schedule);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      panel.removeEventListener('focusin', schedule);
      panel.removeEventListener('focusout', schedule);
      variables.forEach(property => panel.style.removeProperty(property));
      delete panel.dataset.chatCompact;
      delete panel.dataset.chatKeyboardOpen;
    };
  }, [enabled, hasMessages, panelRef, inputRef, scrollRef, followLatestRef]);
}
