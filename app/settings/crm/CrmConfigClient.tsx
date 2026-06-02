'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setCrmApiUrl, testCrmConnection, generateApiKey } from '@/app/actions/crm-config'
import { syncCrmSignedQuotes, type SyncResult } from '@/app/actions/crm-sync'
import { Plug, Unplug, CheckCircle, XCircle, Loader2, Key, Copy, RefreshCw, Link } from 'lucide-react'

interface Props {
  initialUrl: string | null
  initialApiKey: string | null
}

export function CrmConfigClient({ initialUrl, initialApiKey }: Props) {
  const [url, setUrl] = useState(initialUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [generatingKey, setGeneratingKey] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const isConnected = !!initialUrl

  const handleSave = async () => {
    setSaving(true)
    try {
      await setCrmApiUrl(url || null)
      toast.success(url ? 'URL CRM enregistrée' : 'Connexion CRM désactivée')
      setTestResult(null)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!url.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const result = await testCrmConnection(url)
      setTestResult(result)
    } finally {
      setTesting(false)
    }
  }

  const handleDisconnect = async () => {
    setSaving(true)
    try {
      await setCrmApiUrl(null)
      setUrl('')
      setTestResult(null)
      toast.success('Connexion CRM désactivée')
    } catch {
      toast.error('Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateKey = async () => {
    setGeneratingKey(true)
    try {
      const newKey = await generateApiKey()
      setApiKey(newKey)
      toast.success('Nouvelle clé générée')
    } catch {
      toast.error('Erreur lors de la génération')
    } finally {
      setGeneratingKey(false)
    }
  }

  const handleCopyKey = async () => {
    if (!apiKey) return
    await navigator.clipboard.writeText(apiKey)
    toast.success('Clé copiée')
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncCrmSignedQuotes()
      setSyncResult(result)
      if (result.created > 0) {
        toast.success(`${result.created} fiche(s) de prod créée(s)`)
      } else {
        toast.info('Aucune nouvelle fiche à créer')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur de synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">

      {/* Statut */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        {isConnected
          ? <><CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" /><div><p className="text-sm font-semibold text-emerald-800">CRM connecté</p><p className="text-xs text-emerald-600 truncate">{initialUrl}</p></div></>
          : <><XCircle className="h-5 w-5 text-slate-400 shrink-0" /><p className="text-sm text-slate-500">Aucun CRM connecté — les données locales sont utilisées</p></>
        }
      </div>

      {/* Champ URL */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">URL de base de l&apos;API CRM</label>
        <input
          type="url"
          value={url}
          onChange={e => { setUrl(e.target.value); setTestResult(null) }}
          placeholder="https://crm-entreprise.fr/api"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
        />
        <p className="text-xs text-slate-400">
          Le calculateur appellera <code className="bg-slate-100 px-1 rounded">/accessoires</code>, <code className="bg-slate-100 px-1 rounded">/matieres</code> et <code className="bg-slate-100 px-1 rounded">/devis?status=signe</code> sur cette URL.
        </p>
      </div>

      {/* Résultat test */}
      {testResult && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${testResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {testResult.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {testResult.message}
        </div>
      )}

      {/* Actions URL */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleTest} disabled={!url.trim() || testing}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plug className="h-4 w-4 mr-1.5" />}
          Tester la connexion
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-700">
          Enregistrer
        </Button>
        {isConnected && (
          <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={saving} className="text-red-500 hover:text-red-700 hover:bg-red-50">
            <Unplug className="h-4 w-4 mr-1.5" /> Déconnecter
          </Button>
        )}
      </div>

      {/* Séparateur */}
      <div className="border-t border-slate-200" />

      {/* Clé API */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-slate-500" />
          <p className="text-sm font-semibold text-slate-700">Clé API (CRM → Calculateur)</p>
        </div>
        <p className="text-xs text-slate-500">
          Le CRM utilise cette clé pour lire les devis et fiches de production du calculateur via <code className="bg-slate-100 px-1 rounded">Authorization: Bearer &lt;clé&gt;</code>.
        </p>

        {apiKey ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg font-mono truncate text-slate-700">
              {apiKey}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyKey}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateKey} disabled={generatingKey} title="Regénérer (invalide l'ancienne clé)">
              {generatingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={handleGenerateKey} disabled={generatingKey}>
            {generatingKey ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Key className="h-4 w-4 mr-1.5" />}
            Générer une clé API
          </Button>
        )}
      </div>

      {/* Séparateur */}
      <div className="border-t border-slate-200" />

      {/* Sync devis signés */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-slate-500" />
          <p className="text-sm font-semibold text-slate-700">Synchronisation des devis signés</p>
        </div>
        <p className="text-xs text-slate-500">
          Interroge le CRM pour récupérer les devis validés par le client (<code className="bg-slate-100 px-1 rounded">GET /devis?status=signe</code>) et crée automatiquement les fiches de production correspondantes.
        </p>

        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing || !isConnected}>
          {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
          Synchroniser maintenant
        </Button>

        {syncResult && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
            <p className="font-semibold text-slate-700">Résultat :</p>
            <p className="text-emerald-700">✓ {syncResult.created} fiche(s) créée(s)</p>
            {syncResult.alreadySynced > 0 && <p className="text-slate-500">↩ {syncResult.alreadySynced} déjà synchronisé(s)</p>}
            {syncResult.notFound.length > 0 && (
              <p className="text-amber-700">⚠ Références introuvables : {syncResult.notFound.join(', ')}</p>
            )}
            {syncResult.errors.length > 0 && (
              <p className="text-red-700">✗ Erreurs : {syncResult.errors.join(' | ')}</p>
            )}
          </div>
        )}
      </div>

      {/* Doc */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Documentation pour le développeur CRM</p>
        <div className="space-y-2 text-xs font-mono">
          <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-1">
            <p className="text-slate-500 font-sans font-medium">CRM expose (calculateur lit) :</p>
            <p className="text-emerald-600">GET /matieres &nbsp; GET /accessoires &nbsp; GET /devis?status=signe</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-1">
            <p className="text-slate-500 font-sans font-medium">Calculateur expose (CRM lit) :</p>
            <p className="text-emerald-600">GET /api/v1/quotes</p>
            <p className="text-emerald-600">GET /api/v1/production-sheets/:quoteId</p>
            <p className="text-slate-400">→ Header requis : Authorization: Bearer &lt;clé API&gt;</p>
          </div>
        </div>
        <a href="/settings/crm/doc" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2">
          <Link className="h-3 w-3" /> Documentation complète
        </a>
      </div>

    </div>
  )
}
