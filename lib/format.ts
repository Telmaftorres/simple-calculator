export function formatTimeSeconds(seconds: number): string {
  if (seconds === 0) return '0 sec'
  if (seconds < 60) return `${seconds} sec`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`
}

export function formatMinutes(mins: number): string {
  if (mins === 0) return '0 min'
  if (mins < 1) return `${Math.ceil(mins * 60)} sec`
  const wholeMins = Math.floor(mins)
  const seconds = Math.round((mins - wholeMins) * 60)
  return seconds > 0 ? `${wholeMins} min ${seconds} sec` : `${wholeMins} min`
}

// ── Détails sections calculateur ──

export function formatCuttingDetails(params: {
  cuttingMachineTimeMin: number
  cuttingSetupTimeMin: number
  hasCuttingSetup: boolean
  cuttingTimePerPoseSeconds: number
}): string {
  const totalMin = params.cuttingMachineTimeMin + (params.hasCuttingSetup ? params.cuttingSetupTimeMin : 0)
  return `${formatMinutes(totalMin)} (${formatTimeSeconds(params.cuttingTimePerPoseSeconds)}/pose${
    params.hasCuttingSetup ? ` + ${params.cuttingSetupTimeMin} min calage` : ''
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
}): string {
  const totalMinutes = (params.packTimePerPieceSeconds * params.quantity) / 60
  let details = `${formatMinutes(totalMinutes)} (${formatTimeSeconds(params.packTimePerPieceSeconds)}/pce)`
  if (params.hasAssemblyNotice) {
    const noticeCost = params.assemblyNoticeCostPerPiece * params.quantity
    details += ` + Notice: ${noticeCost.toFixed(2)}€`
  }
  return details
}