'use client'

import { useState } from 'react'
import { updateSetting } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

interface Setting {
  id: number
  key: string
  value: string
  label: string
  unit: string | null
}

export function SettingsClient({ settings }: { settings: Setting[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  )
  const [saving, setSaving] = useState<string | null>(null)

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      await updateSetting(key, values[key])
      toast.success('Paramètre mis à jour !')
    } catch (e) {
      toast.error('Erreur lors de la mise à jour')
      console.error(e)
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Constantes métier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.key} className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">
                {setting.label}
              </label>
              <p className="text-xs text-slate-400">{setting.key}</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="any"
                value={values[setting.key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                }
                className="w-28 text-right"
              />
              {setting.unit && (
                <span className="text-sm text-slate-500 w-12">{setting.unit}</span>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => handleSave(setting.key)}
                disabled={saving === setting.key}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}