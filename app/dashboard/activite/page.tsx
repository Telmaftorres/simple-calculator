import { requireAdmin } from '@/lib/server/auth'
import { prisma } from '@/lib/server/prisma'

const ACTION_LABELS: Record<string, string> = {
  CREATE_QUOTE:    'Devis créé',
  DELETE_QUOTE:    'Devis supprimé',
  UPSERT_ACTUALS:  'Réels renseignés',
  CREATE_USER:     'Utilisateur créé',
  UPDATE_USER:     'Utilisateur modifié',
  DELETE_USER:     'Utilisateur supprimé',
  UPDATE_SETTING:  'Paramètre modifié',
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_QUOTE:    'bg-emerald-100 text-emerald-800',
  DELETE_QUOTE:    'bg-red-100 text-red-800',
  UPSERT_ACTUALS:  'bg-blue-100 text-blue-800',
  CREATE_USER:     'bg-violet-100 text-violet-800',
  UPDATE_USER:     'bg-amber-100 text-amber-800',
  DELETE_USER:     'bg-red-100 text-red-800',
  UPDATE_SETTING:  'bg-slate-100 text-slate-800',
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function ActivitePage() {
  await requireAdmin()

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Journal d&apos;activité</h1>
        <p className="text-sm text-slate-500 mt-1">
          Les 200 dernières actions enregistrées dans le système
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm italic">
          Aucune activité enregistrée pour l&apos;instant
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Utilisateur</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Référence</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => {
                let details: Record<string, unknown> | null = null
                try {
                  if (log.details) details = JSON.parse(log.details)
                } catch {}

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {log.userName ?? <span className="text-slate-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-700'}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                      {log.entityRef ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {details
                        ? Object.entries(details)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
