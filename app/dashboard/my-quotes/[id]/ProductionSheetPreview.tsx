'use client'

import type { Quote } from './quote-detail-shared'
import { ProductionQRCode } from './ProductionQRCode'

type PreviewRun = {
  name: string
  platesCount: number | null
  cuttingTimeSec: number | null
  hasImpression: boolean
  plateName: string | null
  items: { name: string; countPerPlate: number }[]
}

function rvLabel(rv: boolean, type: string | null): string {
  if (!rv) return 'Recto'
  if (type === 'parfait') return 'R/V parfait'
  if (type === 'tete_beche') return 'R/V tête-bêche'
  return 'R/V'
}

function fmtSec(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem > 0 ? `${m}min${rem}s` : `${m}min`
}

function fmtMin(m: number): string {
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h${rem}` : `${h}h`
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between items-baseline border-b border-slate-100 py-0.5 last:border-0 gap-2">
      <span className="text-[10px] text-slate-500 min-w-0 truncate">{label}</span>
      <span className="text-[11px] font-medium text-slate-800 shrink-0">{value != null && value !== '' ? String(value) : '—'}</span>
    </div>
  )
}

function SectionCard({ title, colorClass, children }: { title: string; colorClass: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden mb-2">
      <div className={`px-3 py-1.5 ${colorClass}`}>
        <p className="text-[10px] uppercase tracking-widest font-semibold">{title}</p>
      </div>
      <div className="px-3 py-2 bg-white space-y-0.5">
        {children}
      </div>
    </div>
  )
}

function findQuotePlate(quote: Quote, lineName: string): { name: string } | null {
  if (quote.isMultiProduct && quote.products.length > 0) {
    const match = quote.products.find(p =>
      (p.productTypeName ?? '').toLowerCase() === lineName.toLowerCase()
    ) ?? quote.products[0]
    return match?.plate ?? null
  }
  if (quote.amalgameRuns.length > 0) {
    const run = quote.amalgameRuns.find(r => r.name.toLowerCase() === lineName.toLowerCase())
      ?? quote.amalgameRuns[0]
    return run?.plate ?? null
  }
  return quote.plate ?? null
}

export function ProductionSheetPreview({ quote }: { quote: Quote }) {
  const ps = quote.productionSheet

  // ── Amalgame logic ──
  const prodRuns = ps?.productionAmalgameRuns ?? []
  const quoteRuns = quote.amalgameRuns ?? []
  const hasAmalgame = quote.hasAmalgame || prodRuns.length > 0 || quoteRuns.length > 0
  const amalgameScope = ps?.amalgameScope ?? 'decoupe_impression'
  const isAmalgameImpression = hasAmalgame && amalgameScope === 'decoupe_impression'

  const runs: PreviewRun[] = prodRuns.length > 0
    ? prodRuns.map(r => ({
        name: r.name,
        platesCount: r.platesCount,
        cuttingTimeSec: null,
        hasImpression: true,
        plateName: null,
        items: r.items.map(it => ({ name: it.name, countPerPlate: it.countPerPlate })),
      }))
    : quoteRuns.map(r => ({
        name: r.name,
        platesCount: r.platesCount,
        cuttingTimeSec: r.cuttingTimePerPoseSeconds,
        hasImpression: r.hasImpression,
        plateName: r.plate?.name ?? null,
        items: r.items.map(it => ({ name: it.name, countPerPlate: it.countPerPlate })),
      }))

  // ── Effective values ──
  const effectiveBe = ps?.prodBeTimeMinutesOverride ?? (quote.hasBE ? quote.beTimeMinutes : null)
  const effectiveBat = ps?.prodBatTimeMinutesOverride ?? (quote.batTimeMinutes || null)
  const effectiveCutting = ps?.prodCuttingTimePerPoseSeconds ?? quote.cuttingTimePerPoseSeconds
  const effectivePlatesCount = ps?.prodPlatesCount ?? quote.platesCount
  const effectiveInk = ps?.prodInkMlPerPlate ?? quote.inkMlPerPlate
  const effectiveIsRV = ps?.prodIsRectoVerso ?? quote.isRectoVerso
  const effectiveRVType = ps?.prodRectoVersoType ?? quote.rectoVersoType
  const effectiveHasVarnish = ps?.prodHasVarnish ?? quote.hasVarnish
  const effectiveHasFlatColor = ps?.prodHasFlatColor ?? quote.hasFlatColor
  const effectiveAssembly = ps?.prodAssemblyTimePerPieceSeconds ?? quote.assemblyTimePerPieceSeconds
  const effectivePack = ps?.prodPackTimePerPieceSeconds ?? quote.packTimePerPieceSeconds
  const effectiveItemsPerPlate = ps?.prodItemsPerPlate ?? quote.itemsPerPlate

  const prodLines = ps?.productionProductLines ?? []
  const products = quote.products ?? []
  const accessories = quote.accessories ?? []
  const typeLabel = (v: string | null) => {
    if (v === 'kit_unitaire') return 'Kit unitaire'
    if (v === 'caisse') return 'Caisse'
    if (v === 'palette') return 'Palette'
    if (v === 'autre') return 'Autre'
    return v ?? '—'
  }


  return (
    <div className="bg-slate-100 rounded-xl p-3 h-full overflow-y-auto">
      {/* Paper card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">

        {/* Header */}
        <div className="bg-slate-800 text-white px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold tracking-wide">
                {quote.reference ?? `Devis #${quote.id}`}
              </p>
              <p className="text-[10px] text-slate-300 mt-0.5">{quote.client ?? '—'}</p>
              {quote.study?.number && (
                <p className="text-[10px] text-slate-400 mt-0.5">Étude #{quote.study.number}</p>
              )}
              <p className="text-[10px] text-slate-300 mt-0.5">{quote.quantity} pcs</p>
              <p className="text-[10px] text-slate-400">
                {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="shrink-0 rounded overflow-hidden" title={`QR code — Étude ${quote.study?.number ?? quote.reference ?? quote.id}`}>
              <ProductionQRCode value={String(quote.study?.number ?? quote.reference ?? quote.id)} size={56} />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="p-3">

          {/* 1. Produits & Matière */}
          <SectionCard title="Produits & Matière" colorClass="bg-slate-800 text-white">
            {prodLines.length > 0 ? (
              prodLines.map((line, i) => {
                const linePlate = line.plate ?? findQuotePlate(quote, line.name)
                return (
                  <div key={i}>
                    {line.elements.length === 0 && (
                      <Row label={line.name} value={linePlate?.name ?? '—'} />
                    )}
                    {line.elements.length > 0 && (
                      <>
                        <p className="text-[10px] font-semibold text-slate-500 pt-1 pb-0.5">{line.name}</p>
                        {line.elements.map((el, j) => {
                          const elPlate = el.plate ?? linePlate
                          return (
                            <div key={j} className="pl-2">
                              <Row
                                label={`↳ ${el.name}${el.flatWidth ? ` (${el.flatWidth}×${el.flatHeight})` : ''}`}
                                value={elPlate?.name ?? '—'}
                              />
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                )
              })
            ) : quote.isMultiProduct && products.length > 0 ? (
              products.map((p, i) => (
                <Row
                  key={i}
                  label={`${p.productTypeName ?? `Produit ${i + 1}`}${p.flatWidth ? ` (${p.flatWidth}×${p.flatHeight})` : ''}`}
                  value={p.plate?.name ?? '—'}
                />
              ))
            ) : quote.productType ? (
              <>
                <Row
                  label={`${quote.productType.name}${quote.flatWidth ? ` (${quote.flatWidth}×${quote.flatHeight})` : ''}`}
                  value={quote.plate?.name ?? '—'}
                />
              </>
            ) : (
              <Row label="Produit" value="—" />
            )}
          </SectionCard>

          {/* 2. Bureau d'études */}
          {(effectiveBe || effectiveBat || ps?.beNotes) && (
            <SectionCard title="Bureau d'études" colorClass="bg-slate-100 text-slate-700">
              {effectiveBe != null && <Row label="Temps BE" value={fmtMin(effectiveBe)} />}
              {effectiveBat != null && <Row label="Temps BAT" value={fmtMin(effectiveBat)} />}
              {ps?.beNotes && <Row label="Notes" value={ps.beNotes} />}
            </SectionCard>
          )}

          {/* 3. Amalgame */}
          {hasAmalgame && runs.length > 0 && (
            <SectionCard title="Amalgame" colorClass="bg-violet-600 text-white">
              {runs.map((run, i) => (
                <div key={i} className="mb-1.5 last:mb-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-slate-800">{run.name}</span>
                    {run.platesCount != null && (
                      <span className="text-[10px] text-slate-500">{run.platesCount} pl.</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {run.items.map((it, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded border border-violet-100">
                        {it.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </SectionCard>
          )}

          {/* 4. Impression */}
          {(quote.hasImpression || isAmalgameImpression) && (
            <SectionCard title="Impression" colorClass="bg-purple-600 text-white">
              <Row label="Mode" value={rvLabel(effectiveIsRV, effectiveRVType)} />
              {effectiveHasVarnish && <Row label="Vernis" value="Oui" />}
              {effectiveHasFlatColor && <Row label="Blanc" value="Oui" />}
              {quote.plate && <Row label="Plaque" value={quote.plate.name} />}
              {effectivePlatesCount != null && <Row label="Nb plaques" value={effectivePlatesCount} />}
              {effectiveInk != null && <Row label="Encre" value={`${effectiveInk} ml`} />}
              {ps?.prodMachineTimeMinOverride != null && (
                <Row label="Tps machine" value={`${ps.prodMachineTimeMinOverride} min`} />
              )}
              {isAmalgameImpression && runs.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {runs.map((run, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-600">{run.name}</span>
                      {run.platesCount != null && (
                        <span className="text-[10px] text-slate-400">{run.platesCount} pl.</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {/* 5. Découpe — always show */}
          <SectionCard title="Découpe" colorClass="bg-orange-500 text-white">
            {hasAmalgame && runs.length > 0 ? (
              runs.map((run, i) => (
                <div key={i} className="mb-1.5 last:mb-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-slate-800">{run.name}</span>
                    {run.cuttingTimeSec != null && (
                      <span className="text-[10px] text-slate-500">{fmtSec(run.cuttingTimeSec)}/pose</span>
                    )}
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {run.items.map((it, j) => (
                      <div key={j} className="flex justify-between text-[10px]">
                        <span className="text-slate-600">{it.name}</span>
                        <span className="text-slate-400">{it.countPerPlate} poses</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <>
                {effectiveCutting != null && <Row label="Temps/pose" value={fmtSec(effectiveCutting)} />}
                {effectiveItemsPerPlate != null && <Row label="Pièces/plaque" value={effectiveItemsPerPlate} />}
              </>
            )}
          </SectionCard>

          {/* 6. Façonnage */}
          {(quote.hasFaconnage || effectiveAssembly || ps?.nbCollages) && (
            <SectionCard title="Façonnage" colorClass="bg-slate-100 text-slate-700">
              {effectiveAssembly != null && <Row label="Tps assemblage" value={fmtSec(effectiveAssembly)} />}
              {ps?.nbCollages != null && <Row label="Nb collages" value={ps.nbCollages} />}
              {ps?.collagePerPLV != null && <Row label="Collages/PLV" value={ps.collagePerPLV} />}
              {ps?.faconnageNotes && <Row label="Notes" value={ps.faconnageNotes} />}
            </SectionCard>
          )}

          {/* 7. Conditionnement */}
          {(quote.hasConditionnement || ps?.conditionnementType) && (
            <SectionCard title="Conditionnement" colorClass="bg-blue-600 text-white">
              {effectivePack != null && <Row label="Temps/pièce" value={fmtSec(effectivePack)} />}
              {ps?.conditionnementType && <Row label="Type" value={typeLabel(ps.conditionnementType)} />}
              {quote.hasAssemblyNotice && <Row label="Notice de montage" value="Oui" />}
              {quote.hasPoseEtiquette && <Row label="Pose étiquette" value="Oui" />}
              {ps?.conditionnementNotes && <Row label="Notes" value={ps.conditionnementNotes} />}
            </SectionCard>
          )}

          {/* 8. Emballage */}
          {(quote.hasPackaging || ps?.prodPackagingMaterial) && (
            <SectionCard title="Emballage" colorClass="bg-amber-500 text-white">
              {quote.packagingBoxType && <Row label="Type" value={quote.packagingBoxType} />}
              {ps?.prodPackagingMaterial && <Row label="Matière" value={ps.prodPackagingMaterial} />}
              {(ps?.prodPackagingQuantity ?? quote.packagingQuantity) != null && (
                <Row label="Quantité" value={`${ps?.prodPackagingQuantity ?? quote.packagingQuantity} pcs`} />
              )}
              {(ps?.prodPackagingUnitPrice ?? quote.packagingUnitPriceOverride) != null && (
                <Row label="Prix unitaire" value={`${((ps?.prodPackagingUnitPrice ?? quote.packagingUnitPriceOverride) as number).toFixed(2)} €`} />
              )}
            </SectionCard>
          )}

          {/* 10. Achats */}
          {(() => {
            const achatItems = ps?.productionAchatItems ?? []
            const showItems = achatItems.length > 0 ? achatItems : accessories.map(a => ({
              id: -1, name: a.accessory.name, quantity: a.quantity, unitPrice: null, position: 0,
            }))
            if (showItems.length === 0 && !ps?.achatsNotes) return null
            return (
              <SectionCard title="Achats" colorClass="bg-green-600 text-white">
                {showItems.map((it, i) => (
                  <Row key={i} label={it.name} value={`× ${it.quantity}`} />
                ))}
                {ps?.achatsNotes && <Row label="Notes" value={ps.achatsNotes} />}
              </SectionCard>
            )
          })()}

          {/* 11. Remarques */}
          {ps?.remarques && (
            <SectionCard title="Remarques" colorClass="bg-slate-100 text-slate-700">
              <p className="text-[11px] text-slate-700 leading-relaxed">{ps.remarques}</p>
            </SectionCard>
          )}

        </div>
      </div>
    </div>
  )
}
