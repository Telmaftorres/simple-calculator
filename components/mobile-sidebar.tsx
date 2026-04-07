'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Menu,
  LayoutDashboard,
  Layers,
  Box,
  Settings,
  FileText,
  Package,
  Calculator,
  FlaskConical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import LogoutButton from '@/components/LogoutButton'
import { ModeToggle } from '@/components/mode-toggle'

export function MobileSidebar({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-slate-900 text-white p-0 border-r-slate-800 flex flex-col">
        <SheetHeader className="p-6 border-b border-slate-800 text-left">
          <SheetTitle className="text-xl font-bold flex items-center gap-2 text-white">
            <LayoutDashboard className="h-6 w-6 text-emerald-400" />
            <span>Menu Admin</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 p-4 space-y-2 overflow-auto">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <Calculator className="h-5 w-5" />
            Calculateur
          </Link>

          <Link
            href="/dashboard/my-quotes"
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <FileText className="h-5 w-5" />
            Mes Devis
          </Link>

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Gestion Données
          </div>

          <Link
            href="/dashboard/plates"
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <Layers className="h-5 w-5" />
            Matières
          </Link>

          <Link
            href="/dashboard/accessories"
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <Package className="h-5 w-5" />
            Accessoires
          </Link>

          <Link
            href="/dashboard/consumables"
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <FlaskConical className="h-5 w-5" />
            Consommables
          </Link>

          <Link
            href="/dashboard/products"
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <Box className="h-5 w-5" />
            Types de PLV
          </Link>

          <Link
            href="/dashboard/formulas"
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <Calculator className="h-5 w-5" />
            Formules de Calcul
          </Link>
        </nav>



        <div className="p-4 border-t border-slate-800 space-y-2">
          {isAdmin && (
            <Link
              href="/settings"
              onClick={close}
              className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
            >
              <Settings className="h-5 w-5" />
              Paramètres
            </Link>
          )}
          <div className="flex items-center justify-between px-2">
            <ModeToggle />
            <LogoutButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
