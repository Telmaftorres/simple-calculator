'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setCrmApiUrl, testCrmConnection } from '@/app/actions/crm-config'
import { Plug, Unplug, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function CrmConfigClient({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

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
          Le calculateur appellera <code className="bg-slate-100 px-1 rounded">/accessoires</code> et <code className="bg-slate-100 px-1 rounded">/matieres</code> sur cette URL.
        </p>
      </div>

      {/* Résultat test */}
      {testResult && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${testResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {testResult.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {testResult.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={!url.trim() || testing}
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plug className="h-4 w-4 mr-1.5" />}
          Tester la connexion
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-700"
        >
          Enregistrer
        </Button>
        {isConnected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={saving}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Unplug className="h-4 w-4 mr-1.5" /> Déconnecter
          </Button>
        )}
      </div>

      {/* Doc pour le dev CRM */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Documentation pour le développeur CRM</p>
        <p className="text-xs text-slate-500">Le CRM doit exposer deux endpoints qui retournent du JSON :</p>
        <div className="space-y-2 text-xs font-mono">
          <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-1">
            <p className="text-emerald-600 font-semibold">GET /accessoires</p>
            <p className="text-slate-400">{`[{ "id": 1, "name": "Vis M4", "price": 0.05 }, ...]`}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-1">
            <p className="text-emerald-600 font-semibold">GET /matieres</p>
            <p className="text-slate-400">{`[{ "id": 1, "name": "Carton B", "width": 1000, "height": 700, "cost": 2.50 }, ...]`}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">Les dimensions sont en mm, les prix en €. Aucune authentification requise sur ces endpoints.</p>
      </div>

    </div>
  )
}
