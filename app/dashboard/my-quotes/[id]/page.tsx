import { notFound, redirect } from 'next/navigation'
import { getQuoteDetail } from '@/app/actions/quotes'
import { auth } from '@/auth'
import { QuoteDetailClient } from './QuoteDetailClient'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/')

  const { id } = await params
  const quoteId = parseInt(id)
  if (isNaN(quoteId)) notFound()

  const quote = await getQuoteDetail(quoteId)
  if (!quote) notFound()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/my-quotes">
              <Button variant="ghost" size="sm" className="gap-1 text-slate-500 -ml-2">
                <ArrowLeft className="h-4 w-4" /> Mes chiffrages
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {quote.reference ?? '—'}
            {quote.study && (
              <span className="ml-3 text-base font-normal text-slate-500">
                Dossier {quote.study.number}
              </span>
            )}
            {quote.client && (
              <span className="ml-2 text-base font-normal text-emerald-600">
                — {quote.client}
              </span>
            )}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/?viewId=${quote.id}`}>
            <Button variant="outline" size="sm">Voir le devis</Button>
          </Link>
          <Link href={`/?editId=${quote.id}`}>
            <Button variant="outline" size="sm">Modifier</Button>
          </Link>
        </div>
      </div>

      <QuoteDetailClient quote={quote} />
    </div>
  )
}
