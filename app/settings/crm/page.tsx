import { getCrmApiUrl } from '@/app/actions/crm-config'
import { CrmConfigClient } from './CrmConfigClient'

export default async function CrmSettingsPage() {
  const crmUrl = await getCrmApiUrl()
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Connexion CRM</h2>
        <p className="text-slate-500 mt-1">
          Connectez le calculateur à votre CRM pour utiliser ses stocks de matières et accessoires.
        </p>
      </div>
      <CrmConfigClient initialUrl={crmUrl} />
    </div>
  )
}
