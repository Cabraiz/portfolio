import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from "web-vitals";
import { useEffect } from "react";

export const useReportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
  useEffect(() => {
    if (onPerfEntry) {
      // Chamar as métricas diretamente
      onCLS(onPerfEntry);
      onINP(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    }
  }, [onPerfEntry]);
};
