'use client'

import { QRCodeSVG } from 'qrcode.react'

interface Props {
  value: string
  size?: number
}

export function ProductionQRCode({ value, size = 56 }: Props) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor="#1e293b"   // slate-800 — fond identique au header
      fgColor="#ffffff"
      level="M"
    />
  )
}
