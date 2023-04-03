import { Metric } from 'web-vitals';
import { useEffect } from "react";

export const useReportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
  useEffect(() => {
    if (onPerfEntry && typeof window !== "undefined") {
      import("web-vitals")
        .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(onPerfEntry);
          getFID(onPerfEntry);
          getFCP(onPerfEntry);
          getLCP(onPerfEntry);
          getTTFB(onPerfEntry);
        })
        .catch((err) => {
          console.error("Failed to load web-vitals", err);
        });
    }
  }, [onPerfEntry]);
};
