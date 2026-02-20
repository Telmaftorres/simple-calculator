'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Calendar, Box, Layers, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

interface Quote {
  id: number
  reference: string | null
  createdAt: Date
  quantity: number
  flatWidth: number | null
  flatHeight: number | null
  totalCost: number | null
  study: { number: string } | null
  productType: { name: string } | null
  plate: { name: string } | null
}

interface MyQuotesClientProps {
  quotes: Quote[]
}

export function MyQuotesClient({ quotes }: MyQuotesClientProps) {
  const [search, setSearch] = useState('')

  const filtered = quotes.filter((quote) => {
    const q = search.toLowerCase()
    return (
      quote.study?.number.toLowerCase().includes(q) ||
      quote.reference?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Mes Devis</h2>
        <p className="text-slate-500">Retrouvez ici l&apos;historique de vos devis sauvegardés.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                Historique ({filtered.length}{search ? ` / ${quotes.length}` : ''})
              </CardTitle>
              <CardDescription>
                Les devis sont triés par date de création, du plus récent au plus ancien.
              </CardDescription>
            </div>
            {/* Barre de recherche */}
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par dossier ou référence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Dossier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Matière</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Montant HT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500 italic">
                    {search
                      ? `Aucun devis trouvé pour "${search}"`
                      : 'Aucun devis trouvé. Créez votre premier devis dans le calculateur !'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-slate-50">
                    <TableCell>
                      {quote.reference ? (
                        <span className="font-mono text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {quote.reference}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {quote.study?.number}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {formatDate(quote.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Box className="h-3 w-3 text-emerald-600" />
                        {quote.productType?.name}
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold border-transparent bg-slate-100 text-slate-900">
                          {quote.flatWidth}x{quote.flatHeight}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Layers className="h-3 w-3 text-blue-600" />
                        {quote.plate?.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{quote.quantity}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {quote.totalCost ? `${quote.totalCost.toFixed(2)} €` : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}