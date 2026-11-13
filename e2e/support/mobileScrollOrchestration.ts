// Tabelas de mobile-scroll-orchestration*.spec.ts.

const responsiveViewports = [
  { width: 273, height: 431 },
  { width: 320, height: 568 },
  { width: 340, height: 384 },
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 568, height: 320 },
  { width: 667, height: 375 },
] as const;

const homeProgressSamples = [
  0, 0.04, 0.08, 0.16, 0.24, 0.32, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9,
] as const;
export { responsiveViewports, homeProgressSamples };
