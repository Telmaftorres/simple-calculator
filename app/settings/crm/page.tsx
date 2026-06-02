import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCrmApiUrl, getApiKey } from '@/app/actions/crm-config'
import { CrmConfigClient } from './CrmConfigClient'
import { ModeToggle } from '@/components/layout/ModeToggle'

export default async function CrmSettingsPage() {
  const [crmUrl, apiKey] = await Promise.all([getCrmApiUrl(), getApiKey()])

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Connexion CRM</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Synchronisez les stocks, devis et fiches de production avec votre CRM.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings/crm/doc" target="_blank">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentation développeur
            </Button>
          </Link>
          <ModeToggle />
        </div>
      </div>

      <CrmConfigClient initialUrl={crmUrl} initialApiKey={apiKey} />
    </div>
  )
}
