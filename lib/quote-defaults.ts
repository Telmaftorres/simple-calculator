// lib/quote-defaults.ts

export const QUOTE_DEFAULTS = {
  printMode: 'production' as const,
  isRectoVerso: false,
  hasVarnish: false,
  hasFlatColor: false,
  cuttingTimePerPoseSeconds: 0,
  assemblyTimePerPieceSeconds: 0,
  packTimePerPieceSeconds: 0,
  hasAssemblyNotice: false,
  hasPackaging: false,
  packagingCuttingTimePerPoseSeconds: 20,
  hasPrintSetup: true,
  hasCuttingSetup: true,
  hasImpression: true,
  hasFaconnage: true,
  hasConditionnement: true,
  hasAccessoires: false,
} as const