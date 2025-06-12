// RouteAccessContext.tsx
import React, { createContext, useContext, useState } from "react";

type RouteAccess = {
  rota1: boolean;
  rota2: boolean;
  rota3: boolean;
};

const defaultAccess = {
  rota1: false,
  rota2: false,
  rota3: false,
};

const RouteAccessContext = createContext<{
  access: RouteAccess;
  unlock: (route: keyof RouteAccess) => void;
}>({
  access: defaultAccess,
  unlock: () => {},
});

export const RouteAccessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [access, setAccess] = useState<RouteAccess>(() => {
    const saved = sessionStorage.getItem("route-access");
    return saved ? JSON.parse(saved) : defaultAccess;
  });

  const unlock = (route: keyof RouteAccess) => {
    const updated = { ...access, [route]: true };
    setAccess(updated);
    sessionStorage.setItem("route-access", JSON.stringify(updated));
  };

  return (
    <RouteAccessContext.Provider value={{ access, unlock }}>
      {children}
    </RouteAccessContext.Provider>
  );
};

export const useRouteAccess = () => useContext(RouteAccessContext);
