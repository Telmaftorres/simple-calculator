'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Calendar, Box, Search, Pencil, Trash2, Eye, ClipboardCheck, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { deleteQuote, sendQuoteToUser } from '@/app/actions/quotes'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

interface Quote {
  id: number
  reference: string | null
  client: string | null
  createdAt: Date
  quantity: number
  flatWidth: number | null
  flatHeight: number | null
  totalCost: number | null
  userId: string | null
  sentByUserName: string | null
  study: { number: string } | null
  productType: { name: string } | null
  plate: { name: string } | null
  productionSheet: { status: string; updatedAt: Date } | null
  actuals: { id: number; updatedAt: Date } | null
  user: { id: string; name: string | null; firstName: string | null; lastName: string | null } | null
}

interface UserForSharing {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
}

interface MyQuotesClientProps {
  quotes: Quote[]
  allQuotes: Quote[]
  users: UserForSharing[]
  currentUserId: string
}

type SortField = 'date' | 'reference' | 'client'
type SortDir = 'asc' | 'desc'

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ArrowUpDown className="h-3 w-3 text-slate-300" />
  return dir === 'asc'
    ? <ArrowUp className="h-3 w-3 text-emerald-500" />
    : <ArrowDown className="h-3 w-3 text-emerald-500" />
}

function userName(user: UserForSharing): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  return user.name ?? user.id
}

type TabId = 'devis' | 'production' | 'actuals' | 'a_valider'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  en_attente: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  en_cours:   { label: 'En cours',   className: 'bg-blue-100 text-blue-800' },
  termine:    { label: 'Terminé',    className: 'bg-green-100 text-green-800' },
}

function creatorName(user: Quote['user']): string {
  if (!user) return '—'
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  return user.name ?? '—'
}

export function MyQuotesClient({ quotes, allQuotes, users, currentUserId }: MyQuotesClientProps) {
  const [scope, setScope] = useState<'mine' | 'all'>('mine')
  const [activeTab, setActiveTab] = useState<TabId>('devis')

  const activeQuotes = scope === 'mine' ? quotes : allQuotes
  const [search, setSearch] = useState('')
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [sendModalQuoteId, setSendModalQuoteId] = useState<number | null>(null)
  const [sendingToUserId, setSendingToUserId] = useState<string | null>(null)
  const router = useRouter()

  const quotesWithProd = activeQuotes.filter(q => q.productionSheet !== null)
  const quotesWithActuals = activeQuotes.filter(q => q.actuals !== null)
  const quotesToValidate = activeQuotes.filter(q => q.productionSheet?.status === 'termine' && !q.actuals)

  const handleDeleteClick = (id: number) => {
    setConfirmingDeleteId(id)
  }

  const handleDeleteConfirm = async (id: number) => {
    setConfirmingDeleteId(null)
    setIsDeleting(id)
    try {
      await deleteQuote(id)
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleSendToUser = async (quoteId: number, targetUserId: string) => {
    setSendingToUserId(targetUserId)
    try {
      await sendQuoteToUser(quoteId, targetUserId)
      const target = users.find(u => u.id === targetUserId)
      toast.success(`Devis envoyé à ${target ? userName(target) : 'l\'utilisateur'}`)
      setSendModalQuoteId(null)
      router.refresh()
    } catch (error) {
      console.error('Send error:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSendingToUserId(null)
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'date' ? 'desc' : 'asc')
    }
  }

  const filtered = activeQuotes
    .filter((quote) => {
      const q = search.toLowerCase()
      return (
        quote.study?.number.toLowerCase().includes(q) ||
        quote.reference?.toLowerCase().includes(q) ||
        quote.client?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortField === 'reference') {
        cmp = (a.reference ?? '').localeCompare(b.reference ?? '', 'fr')
      } else if (sortField === 'client') {
        cmp = (a.client ?? '').localeCompare(b.client ?? '', 'fr')
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Chiffrages</h2>
          <p className="text-slate-500">Retrouvez ici l&apos;historique des dossiers sauvegardés.</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-sm">
          <button
            onClick={() => setScope('mine')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${scope === 'mine' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Mes devis
          </button>
          <button
            onClick={() => setScope('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${scope === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Tous les devis
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">{allQuotes.length}</span>
          </button>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="flex gap-1 border-b border-slate-200 flex-wrap">
        {([
          { id: 'devis',      label: 'Mes devis',       count: quotes.length },
          { id: 'production', label: 'Fiches de prod',  count: quotesWithProd.length },
          { id: 'actuals',    label: 'Données réelles', count: quotesWithActuals.length },
          { id: 'a_valider',  label: 'À valider',       count: quotesToValidate.length, alert: quotesToValidate.length > 0 },
        ] as { id: TabId; label: string; count: number; alert?: boolean }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-white border border-b-white border-slate-200 -mb-px text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.alert && <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab.alert && activeTab !== tab.id
                ? 'bg-amber-100 text-amber-700'
                : activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                {activeTab === 'devis' && <>Historique ({filtered.length}{search ? ` / ${quotes.length}` : ''})</>}
                {activeTab === 'production' && <>Fiches de production ({quotesWithProd.length})</>}
                {activeTab === 'actuals' && <>Données réelles ({quotesWithActuals.length})</>}
                {activeTab === 'a_valider' && <>À valider — données réelles en attente ({quotesToValidate.length})</>}
              </CardTitle>
              <CardDescription>
                {activeTab === 'devis' && 'Cliquez sur les en-têtes pour trier. Recherche par dossier, référence ou client.'}
                {activeTab === 'production' && 'Dossiers avec une fiche de production créée.'}
                {activeTab === 'actuals' && 'Dossiers avec des données réelles saisies.'}
                {activeTab === 'a_valider' && 'Fiches terminées sans données réelles — à compléter après production.'}
              </CardDescription>
            </div>
            {activeTab === 'devis' && (
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Dossier, référence, client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6 overflow-x-auto">
          {activeTab === 'production' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Dossier</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Mis à jour</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotesWithProd.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 italic">
                      Aucune fiche de production créée.
                    </TableCell>
                  </TableRow>
                ) : quotesWithProd.map((quote) => {
                  const s = STATUS_LABELS[quote.productionSheet!.status] ?? STATUS_LABELS.en_attente
                  const isOwned = quote.userId === currentUserId
                  return (
                    <TableRow key={quote.id} className={`hover:bg-slate-50 ${!isOwned ? 'bg-blue-50/40' : ''}`}>
                      <TableCell>
                        <Link href={`/dashboard/my-quotes/${quote.id}`}>
                          {quote.reference
                            ? <span className="font-mono text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{quote.reference}</span>
                            : <span className="text-slate-400 italic text-xs">—</span>}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{quote.study?.number}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{quote.client || <span className="text-slate-300 italic text-xs">—</span>}</TableCell>
                      <TableCell className="text-sm">{quote.productType?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
                            {s.label}
                          </span>
                          {!isOwned && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500">
                              En production
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">{formatDate(quote.productionSheet!.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/dashboard/my-quotes/${quote.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Voir la fiche">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {isOwned && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                              title="Envoyer à un utilisateur"
                              onClick={() => setSendModalQuoteId(quote.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {activeTab === 'actuals' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Dossier</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Montant HT</TableHead>
                  <TableHead>Mis à jour</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotesWithActuals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 italic">
                      Aucune donnée réelle saisie.
                    </TableCell>
                  </TableRow>
                ) : quotesWithActuals.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-slate-50">
                    <TableCell>
                      <Link href={`/dashboard/my-quotes/${quote.id}`}>
                        {quote.reference
                          ? <span className="font-mono text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{quote.reference}</span>
                          : <span className="text-slate-400 italic text-xs">—</span>}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{quote.study?.number}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{quote.client || <span className="text-slate-300 italic text-xs">—</span>}</TableCell>
                    <TableCell className="text-sm">{quote.productType?.name}</TableCell>
                    <TableCell className="font-bold text-slate-900">{quote.totalCost ? `${quote.totalCost.toFixed(2)} €` : '—'}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{formatDate(quote.actuals!.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/my-quotes/${quote.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600" title="Voir les données réelles">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === 'a_valider' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Dossier</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Montant HT</TableHead>
                  <TableHead>Fiche terminée le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotesToValidate.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 italic">
                      Aucun dossier en attente de données réelles.
                    </TableCell>
                  </TableRow>
                ) : quotesToValidate.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-amber-50 border-l-2 border-amber-300">
                    <TableCell>
                      <Link href={`/dashboard/my-quotes/${quote.id}`}>
                        {quote.reference
                          ? <span className="font-mono text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{quote.reference}</span>
                          : <span className="text-slate-400 italic text-xs">—</span>}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{quote.study?.number}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{quote.client || <span className="text-slate-300 italic text-xs">—</span>}</TableCell>
                    <TableCell className="text-sm">{quote.productType?.name}</TableCell>
                    <TableCell className="font-bold text-slate-900">{quote.totalCost ? `${quote.totalCost.toFixed(2)} €` : '—'}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{formatDate(quote.productionSheet!.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/my-quotes/${quote.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 text-xs font-semibold border border-amber-200">
                          <ClipboardCheck className="h-3.5 w-3.5" /> Saisir les données réelles
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === 'devis' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-slate-800 transition-colors"
                    onClick={() => toggleSort('reference')}
                  >
                    Référence <SortIcon field="reference" current={sortField} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead>Dossier</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-slate-800 transition-colors"
                    onClick={() => toggleSort('client')}
                  >
                    Client <SortIcon field="client" current={sortField} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-slate-800 transition-colors"
                    onClick={() => toggleSort('date')}
                  >
                    Date <SortIcon field="date" current={sortField} dir={sortDir} />
                  </button>
                </TableHead>
                {scope === 'all' && <TableHead>Créateur</TableHead>}
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Montant HT</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={scope === 'all' ? 9 : 8} className="text-center py-8 text-slate-500 italic">
                    {search
                      ? `Aucun devis trouvé pour "${search}"`
                      : 'Aucun devis trouvé. Créez votre premier devis dans le calculateur !'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((quote) => {
                  const isOwned = quote.userId === currentUserId
                  return (
                    <TableRow key={quote.id} className={`hover:bg-slate-50 ${!isOwned ? 'bg-blue-50/30' : ''}`}>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/dashboard/my-quotes/${quote.id}`}>
                            {quote.reference ? (
                              <span className="font-mono text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded hover:bg-emerald-100 transition-colors cursor-pointer">
                                {quote.reference}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs hover:text-slate-600 transition-colors cursor-pointer">—</span>
                            )}
                          </Link>
                          {quote.sentByUserName && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 whitespace-nowrap">
                              Reçu de {quote.sentByUserName}
                            </span>
                          )}
                          {!isOwned && !quote.sentByUserName && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                              En production
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/my-quotes/${quote.id}`} className="hover:text-emerald-700 transition-colors">
                          {quote.study?.number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {quote.client || <span className="text-slate-300 italic text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {formatDate(quote.createdAt)}
                        </div>
                      </TableCell>
                      {scope === 'all' && (
                        <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                          {creatorName(quote.user)}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Box className="h-3 w-3 text-emerald-600" />
                          {quote.productType?.name}
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold border-transparent bg-slate-100 text-slate-900">
                            {quote.flatWidth}x{quote.flatHeight}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{quote.quantity}</TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {quote.totalCost ? `${quote.totalCost.toFixed(2)} €` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isOwned && (
                            <Link href={`/dashboard/my-quotes/${quote.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-sky-600" title="Données réelles">
                                <ClipboardCheck className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          <Link href={`/?viewId=${quote.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Voir le récapitulatif">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {isOwned && (
                            <>
                              <Link href={`/?editId=${quote.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600" title="Modifier">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                title="Envoyer à un utilisateur"
                                onClick={() => setSendModalQuoteId(quote.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              {confirmingDeleteId === quote.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    className="text-xs px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 font-medium"
                                    onClick={() => handleDeleteConfirm(quote.id)}
                                  >
                                    Confirmer
                                  </button>
                                  <button
                                    className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50"
                                    onClick={() => setConfirmingDeleteId(null)}
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-rose-600"
                                  onClick={() => handleDeleteClick(quote.id)}
                                  disabled={isDeleting === quote.id}
                                  title="Supprimer"
                                >
                                  <Trash2 className={`h-4 w-4 ${isDeleting === quote.id ? 'animate-pulse' : ''}`} />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Modal envoi ── */}
      {sendModalQuoteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSendModalQuoteId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-80 max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-slate-900 mb-1">Envoyer le devis</h3>
            <p className="text-sm text-slate-500 mb-4">Choisissez le destinataire :</p>
            <div className="space-y-1">
              {users.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                  Aucun autre utilisateur disponible.
                </p>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    disabled={sendingToUserId !== null}
                    onClick={() => handleSendToUser(sendModalQuoteId, user.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-indigo-50 text-sm text-slate-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {(user.firstName?.[0] ?? user.name?.[0] ?? '?').toUpperCase()}
                    </div>
                    {sendingToUserId === user.id ? 'Envoi...' : userName(user)}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setSendModalQuoteId(null)}
              className="mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
