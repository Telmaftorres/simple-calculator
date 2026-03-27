export const QUOTE_DEFAULTS = {
  printMode: 'production' as 'production' | 'quality',
  isRectoVerso: false as boolean,
  hasVarnish: false as boolean,
  hasFlatColor: false as boolean,
  varnishSurfacePercent: 0 as number,   // ✅ nouveau
  flatColorSurfacePercent: 0 as number, // ✅ nouveau
  cuttingTimePerPoseSeconds: 0 as number,
  assemblyTimePerPieceSeconds: 0 as number,
  packTimePerPieceSeconds: 0 as number,
  hasAssemblyNotice: false as boolean,
  hasPackaging: false as boolean,
  packagingCuttingTimePerPoseSeconds: 20 as number,
  hasPrintSetup: true as boolean,
  hasCuttingSetup: true as boolean,
  hasImpression: true as boolean,
  hasFaconnage: true as boolean,
  hasConditionnement: true as boolean,
  hasAccessoires: false as boolean,
  isMultiProduct: false as boolean,
}