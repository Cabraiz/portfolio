// src/components/RouteGuard.tsx
import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
  routeKey: string;
  children: React.ReactNode;
}

export const RouteGuard: React.FC<Props> = ({ routeKey, children }) => {
  const unlocked = sessionStorage.getItem(`unlocked-${routeKey}`) === "true";
  return unlocked ? <>{children}</> : <Navigate to="/" replace />;
};
