import { formatMinutes, formatTimeSeconds } from './numbers'

export function formatCuttingDetails(params: {
  cuttingMachineTimeMin: number
  cuttingSetupTimeMin: number
  cuttingSetupType: 'none' | 'standard' | 'complexe'
  cuttingTimePerPoseSeconds: number
}): string {
  const hasSetup = params.cuttingSetupType !== 'none'
  const totalMin = params.cuttingMachineTimeMin + (hasSetup ? params.cuttingSetupTimeMin : 0)
  return `${formatMinutes(totalMin)} (${formatTimeSeconds(params.cuttingTimePerPoseSeconds)}/pose${
    hasSetup ? ` + calage ${params.cuttingSetupType}` : ''
  })`
}

export function formatAssemblyDetails(params: {
  assemblyTimePerPieceSeconds: number
  quantity: number
}): string {
  const totalMinutes = (params.assemblyTimePerPieceSeconds * params.quantity) / 60
  return `${formatMinutes(totalMinutes)} (${formatTimeSeconds(params.assemblyTimePerPieceSeconds)}/pce)`
}

export function formatPackDetails(params: {
  packTimePerPieceSeconds: number
  quantity: number
  hasAssemblyNotice: boolean
  assemblyNoticeCostPerPiece: number
  hasPoseEtiquette?: boolean
  poseEtiquetteCostPerPiece?: number
}): string {
  const totalMinutes = (params.packTimePerPieceSeconds * params.quantity) / 60
  let details = `${formatMinutes(totalMinutes)} (${formatTimeSeconds(params.packTimePerPieceSeconds)}/pce)`
  if (params.hasAssemblyNotice) {
    const noticeCost = params.assemblyNoticeCostPerPiece * params.quantity
    details += ` + Notice: ${noticeCost.toFixed(2)}€`
  }
  if (params.hasPoseEtiquette && params.poseEtiquetteCostPerPiece != null) {
    const etiquetteCost = params.poseEtiquetteCostPerPiece * params.quantity
    details += ` + Étiquette: ${etiquetteCost.toFixed(2)}€`
  }
  return details
}
