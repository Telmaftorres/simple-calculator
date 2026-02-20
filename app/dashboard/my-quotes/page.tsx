import { getUserQuotes } from '@/app/actions/get-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Calendar, Box, Layers } from 'lucide-react'

// Helper to format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function MyQuotesPage() {
  const quotes = await getUserQuotes()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Mes Devis</h2>
        <p className="text-slate-500">Retrouvez ici l&apos;historique de vos devis sauvegardés.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-500" />
            Historique ({quotes.length})
          </CardTitle>
          <CardDescription>
            Les devis sont triés par date de création, du plus récent au plus ancien.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dossier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Matière</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Montant HT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500 italic">
                    Aucun devis trouvé. Créez votre premier devis dans le calculateur !
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{quote.study?.number}</span>
                        <span className="text-[10px] text-slate-400">ID: {quote.id}</span>
                      </div>
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
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200/80">
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
