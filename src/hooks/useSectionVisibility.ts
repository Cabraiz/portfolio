import { useEffect, useState } from "react";

export const useSectionVisibility = () => {
  const [currentSection, setCurrentSection] = useState<string>(() => {
    return window.location.hash?.replace("#", "") || "home";
  });

  useEffect(() => {
    const updateSection = () => {
      const hash = window.location.hash?.replace("#", "") || "home";
      setCurrentSection(hash);
    };

    window.addEventListener("hashchange", updateSection);

    return () => {
      window.removeEventListener("hashchange", updateSection);
    };
  }, []);

  const isNavHidden = ["enigma"].includes(currentSection);
  const isFloatingHidden = ["enigma"].includes(currentSection);
  const isLandingHidden = ["enigma"].includes(currentSection);

  return {
    currentSection,
    isNavHidden,
    isFloatingHidden,
    isLandingHidden,
  };
};
