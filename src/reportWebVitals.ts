import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from "web-vitals";
import { useEffect } from "react";

export const useReportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
  useEffect(() => {
    if (onPerfEntry) {
      // Chamar as métricas diretamente
      onCLS(onPerfEntry);
      onFID(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    }
  }, [onPerfEntry]);
};
