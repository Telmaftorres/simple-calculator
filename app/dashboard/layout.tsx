import Link from 'next/link'
import { LayoutDashboard, Layers, Box, Settings, FileText, Package, Calculator, FlaskConical, Activity } from 'lucide-react'
import LogoutButton from '@/components/layout/LogoutButton'
import { ModeToggle } from '@/components/layout/ModeToggle'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { auth } from '@/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-indigo-800">
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-emerald-400" />
              <span>Panneau Administrateur</span>
            </h1>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <Calculator className="h-5 w-5" />
            Calculateur
          </Link>

          <Link
            href="/dashboard/my-quotes"
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <FileText className="h-5 w-5" />
            Mes Chiffrages
          </Link>

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Gestion Données
          </div>

          <Link
            href="/dashboard/plates"
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <Layers className="h-5 w-5" />
            Matières
          </Link>

          <Link
            href="/dashboard/accessories"
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <Package className="h-5 w-5" />
            Accessoires
          </Link>

          <Link
            href="/dashboard/consumables"
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <FlaskConical className="h-5 w-5" />
            Consommables
          </Link>

          <Link
            href="/dashboard/products"
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <Box className="h-5 w-5" />
            Types de PLV
          </Link>

          <Link
            href="/dashboard/formulas"
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
          >
            <Calculator className="h-5 w-5" />
            Formules de Calcul
          </Link>
        </nav>



        <div className="p-4 border-t border-slate-800 space-y-2">
          {isAdmin && (
            <Link
              href="/dashboard/activite"
              className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
            >
              <Activity className="h-5 w-5" />
              Activité
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
            >
              <Settings className="h-5 w-5" />
              Paramètres
            </Link>
          )}
          <div className="flex justify-center px-2">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 text-white flex-shrink-0">
          <div className="font-bold flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-emerald-400" />
            <span className="text-lg">Admin</span>
          </div>
          <MobileSidebar isAdmin={isAdmin} />
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
