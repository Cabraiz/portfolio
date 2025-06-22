import { useLocation } from "react-router-dom";

export const useLayoutVisibility = () => {
  const { pathname } = useLocation();

  const hiddenNavbarRoutes = [
    "/enigma", "/loginhublocal", "/registerhublocal",
    "/resume", "/casanova", "/hublocal"
  ];

  const hiddenFloatingButtonRoutes = [
    "/enigma", "/loginhublocal", "/registerhublocal",
    "/resume", "/casanova", "/hublocal"
  ];

  const hiddenLandingPageRoutes = [
    "/enigma", "/loginhublocal", "/registerhublocal",
    "/resume", "/casanova", "/hublocal"
  ];

  const isNavHidden = hiddenNavbarRoutes.includes(pathname);
  const isFloatingHidden = hiddenFloatingButtonRoutes.includes(pathname);
  const isLandingHidden = hiddenLandingPageRoutes.includes(pathname);

  return {
    isNavHidden,
    isFloatingHidden,
    isLandingHidden,
  };
};
