import React, { useState, useEffect } from "react";
import AppDesktop from "./AppDesktop";
import AppMobile from "./AppMobile";

const App: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState(
    window.matchMedia("(min-width: 768px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isDesktop ? <AppDesktop /> : <AppMobile />;
};

export default App;
