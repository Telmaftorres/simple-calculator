import Image from 'next/image'
import React from 'react'

export function ScreenSuccess() {
  return (
    <div className="fixed inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative mb-8 animate-bounce">
        <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-emerald-500 max-w-xs text-center relative">
          <h2 className="text-3xl font-black text-slate-900 uppercase italic">
            Et ouai mon pote !
          </h2>
          <div className="absolute -bottom-3 left-1/2 -ml-3 w-6 h-6 bg-white border-b-4 border-r-4 border-emerald-500 transform rotate-45"></div>
        </div>
      </div>
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-2xl animate-in zoom-in duration-500">
        <Image src="/boss.png" alt="Le Patron" fill className="object-cover" />
      </div>
      <p className="mt-8 text-white text-xl font-medium animate-pulse">Sauvegarde en cours...</p>
    </div>
  )
}
