'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, FileText, TrendingUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ProductionSheetTab } from './ProductionSheetTab'
import { ActualsTab } from './ActualsTab'
import { InfoCell, STATUS_OPTIONS, type Quote } from './quote-detail-shared'

export function QuoteDetailClient({ quote }: { quote: Quote }) {
  const [activeTab, setActiveTab] = useState<'devis' | 'production' | 'actuals'>('devis')

  const TABS = [
    { id: 'devis',      label: 'Résumé devis',       icon: FileText },
    { id: 'production', label: 'Fiche de production', icon: ClipboardCheck },
    { id: 'actuals',    label: 'Données réelles',     icon: TrendingUp },
  ] as const

  const sheetStatus = quote.productionSheet?.status ?? 'en_attente'
  const statusConfig = STATUS_OPTIONS.find(s => s.value === sheetStatus)

  return (
    <div className="space-y-4">
      {/* Onglets */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.id === 'production' && statusConfig && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Résumé devis */}
      {activeTab === 'devis' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Résumé du devis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <InfoCell label="Produit" value={quote.productType?.name} />
              <InfoCell label="Client" value={quote.client} />
              <InfoCell label="Format" value={quote.flatWidth && quote.flatHeight ? `${quote.flatWidth}×${quote.flatHeight} mm` : null} />
              <InfoCell label="Quantité" value={`${quote.quantity} pcs`} />
              <InfoCell label="Total devis HT" value={quote.totalCost != null ? <span className="font-bold text-slate-900">{quote.totalCost.toFixed(2)} €</span> : null} />
              <InfoCell label="Matière" value={quote.plate?.name} />
              <InfoCell label="Date" value={new Date(quote.createdAt).toLocaleDateString('fr-FR')} />
              <InfoCell label="Transport estimé" value={quote.transportTotal != null && quote.transportTotal > 0 ? `${quote.transportTotal.toFixed(2)} €` : null} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fiche de production */}
      {activeTab === 'production' && (
        <div className="space-y-4">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-emerald-800">Modifier la fiche de production dans le calculateur</p>
                <p className="text-sm text-emerald-600 mt-0.5">Toutes les sections du devis, pré-remplies et modifiables pour la production.</p>
              </div>
              <Link href={`/?prodId=${quote.id}`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 whitespace-nowrap">
                  <ExternalLink className="h-4 w-4" /> Ouvrir dans le calculateur
                </Button>
              </Link>
            </CardContent>
          </Card>
          <ProductionSheetTab quote={quote} />
        </div>
      )}

      {/* Données réelles */}
      {activeTab === 'actuals' && (
        <div className="space-y-4">
          <Card className="border-sky-200 bg-sky-50">
            <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sky-800">Saisir les données réelles dans le calculateur</p>
                <p className="text-sm text-sky-600 mt-0.5">Pré-rempli depuis la fiche de production. Modifiez avec les valeurs réelles et sauvegardez.</p>
              </div>
              <Link href={`/?actualsId=${quote.id}`}>
                <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2 whitespace-nowrap">
                  <ExternalLink className="h-4 w-4" /> Ouvrir dans le calculateur
                </Button>
              </Link>
            </CardContent>
          </Card>
          <ActualsTab quote={quote} />
        </div>
      )}
    </div>
  )
}
