export function formatCurrency(value: number): string {
  return `${value.toFixed(2)} €`
}

export function formatMargin(coeff: number): string {
  const pct = Math.round((coeff - 1) * 100)
  return `×${coeff.toFixed(1)} (+${pct}%)`
}

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
