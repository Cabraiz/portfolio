import { useEffect } from "react";

export type UseNavbarBodyScrollLockParams = Readonly<{
  isMobileView: boolean;
  menuOpen: boolean;
  lockOverflowValue?: string;
}>;

function getBrowserDocument(): Document | null {
  if (typeof document === "undefined") {
    return null;
  }

  return document;
}

function removeOverflow(documentRef: Document): void {
  documentRef.documentElement.style.removeProperty("overflow");
  documentRef.body.style.removeProperty("overflow");
}

export function useNavbarBodyScrollLock({
  isMobileView,
  menuOpen,
  lockOverflowValue = "hidden",
}: UseNavbarBodyScrollLockParams): void {
  useEffect(() => {
    const browserDocument = getBrowserDocument();

    if (!browserDocument) {
      return;
    }

    const root = browserDocument.documentElement;
    const { body } = browserDocument;

    if (!isMobileView) {
      removeOverflow(browserDocument);
      return;
    }

    if (menuOpen) {
      root.style.overflow = lockOverflowValue;
      body.style.overflow = lockOverflowValue;
    } else {
      removeOverflow(browserDocument);
    }

    return () => {
      removeOverflow(browserDocument);
    };
  }, [isMobileView, menuOpen, lockOverflowValue]);
}

export default useNavbarBodyScrollLock;
