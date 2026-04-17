'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { updatePackagingPricingRule, updateQuantityCoefficient } from '@/app/actions/reference-data'
import type { PackagingRuleForAdmin, QuantityCoefficientForAdmin } from '@/app/actions/reference-data'

const CATEGORY_LABELS: Record<string, string> = {
  ETUI: 'Étui',
  CAISSE: 'Caisse',
  PLAQUE_RAINEE: 'Plaque rainée',
}

const MATERIAL_LABELS: Record<string, string> = {
  B: 'B (simple face)',
  EB: 'EB (double face)',
}

const SIZE_LABELS: Record<string, string> = {
  PETIT: 'Petit',
  MOYEN: 'Moyen',
  GRAND: 'Grand',
}

const BAND_LABELS: Record<string, string> = {
  PETITE_SERIE: 'Petite série',
  MOYENNE_SERIE: 'Moyenne série',
  GRANDE_SERIE: 'Grande série',
}

export function PackagingPricingClient({
  initialRules,
  initialCoefficients,
}: {
  initialRules: PackagingRuleForAdmin[]
  initialCoefficients: QuantityCoefficientForAdmin[]
}) {
  const [rulePrices, setRulePrices] = useState<Record<number, string>>(
    Object.fromEntries(initialRules.map((r) => [r.id, String(r.baseUnitPrice)]))
  )
  const [coeffValues, setCoeffValues] = useState<Record<number, string>>(
    Object.fromEntries(initialCoefficients.map((c) => [c.id, String(c.coefficient)]))
  )
  const [saving, setSaving] = useState<string | null>(null)

  const handleSaveRule = async (id: number) => {
    const key = `rule-${id}`
    setSaving(key)
    try {
      await updatePackagingPricingRule(id, parseFloat(rulePrices[id] ?? '0'))
      toast.success('Prix mis à jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(null)
    }
  }

  const handleSaveCoeff = async (id: number) => {
    const key = `coeff-${id}`
    setSaving(key)
    try {
      await updateQuantityCoefficient(id, parseFloat(coeffValues[id] ?? '1'))
      toast.success('Coefficient mis à jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(null)
    }
  }

  // Group rules by category then material
  const grouped: Record<string, Record<string, PackagingRuleForAdmin[]>> = {}
  for (const rule of initialRules) {
    if (!grouped[rule.category]) grouped[rule.category] = {}
    if (!grouped[rule.category][rule.material]) grouped[rule.category][rule.material] = []
    grouped[rule.category][rule.material].push(rule)
  }

  const categories = ['ETUI', 'CAISSE', 'PLAQUE_RAINEE'].filter((c) => grouped[c])
  const materials = ['B', 'EB'].filter((m) => Object.values(grouped).some((g) => g[m]))

  return (
    <div className="space-y-6">
      {/* Pricing rules */}
      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50 border-b border-amber-100 rounded-t-lg">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">📦</span>
            Prix fournisseur externe (B / EB)
          </CardTitle>
          <CardDescription>
            Prix unitaire de base selon le type d&apos;emballage, la matière et la taille. Les coefficients de quantité s&apos;appliquent ensuite.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-slate-600">Type</th>
                  {['PETIT', 'MOYEN', 'GRAND'].map((size) => (
                    <th key={size} className="text-center py-2 px-2 font-medium text-slate-600 w-32" colSpan={2}>
                      {SIZE_LABELS[size]}
                    </th>
                  ))}
                </tr>
                <tr className="border-b bg-slate-50">
                  <th></th>
                  {['PETIT', 'MOYEN', 'GRAND'].map((size) =>
                    materials.map((mat) => (
                      <th key={`${size}-${mat}`} className="text-center py-1 px-2 text-xs font-medium text-slate-500">
                        {mat}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category} className="border-b hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-700">{CATEGORY_LABELS[category]}</td>
                    {['PETIT', 'MOYEN', 'GRAND'].map((size) =>
                      materials.map((mat) => {
                        const rule = grouped[category]?.[mat]?.find((r) => r.size === size)
                        if (!rule) return <td key={`${size}-${mat}`} className="px-2 text-center text-slate-300">—</td>
                        return (
                          <td key={`${size}-${mat}`} className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={rulePrices[rule.id] ?? ''}
                                onChange={(e) => setRulePrices((prev) => ({ ...prev, [rule.id]: e.target.value }))}
                                className="w-24 text-right text-xs h-8"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                                onClick={() => handleSaveRule(rule.id)}
                                disabled={saving === `rule-${rule.id}`}
                              >
                                <Save className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        )
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-400 mt-3">Unité : €/pce · MATERIAL_LABELS: B = kraft simple face, EB = kraft double face</p>
          </div>
        </CardContent>
      </Card>

      {/* Quantity coefficients */}
      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50 border-b border-amber-100 rounded-t-lg">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">📊</span>
            Coefficients quantité
          </CardTitle>
          <CardDescription>
            Multiplicateur appliqué au prix unitaire selon la quantité commandée.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {initialCoefficients.map((c) => (
            <div key={c.id} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{BAND_LABELS[c.quantityBand] ?? c.quantityBand}</p>
                <p className="text-xs text-slate-400">
                  {c.maxQuantity !== null
                    ? `${c.minQuantity} – ${c.maxQuantity} pces`
                    : `${c.minQuantity} pces et plus`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={coeffValues[c.id] ?? ''}
                  onChange={(e) => setCoeffValues((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  className="w-24 text-right"
                />
                <span className="text-sm text-slate-500 w-6">×</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleSaveCoeff(c.id)}
                  disabled={saving === `coeff-${c.id}`}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 pt-1">
            Exemple : prix de base 2.04 € × coeff 0.97 (moyenne série) = 1.98 €/pce facturé
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
