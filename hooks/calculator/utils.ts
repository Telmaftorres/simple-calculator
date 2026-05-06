export function resolveVerso(
  isRectoVerso: boolean,
  rectoVersoType: string | null,
  inkMlPerPlate: number,
  inkMlVerso: number
) {
  const isDifferent = isRectoVerso && rectoVersoType === 'different' && inkMlVerso > 0
  return {
    effectiveInkMl: isDifferent ? (inkMlPerPlate + inkMlVerso) / 2 : inkMlPerPlate,
    effectiveIsRectoVerso: isRectoVerso,
  }
}
