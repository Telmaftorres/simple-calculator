'use server'

export type ExtractedAccessory = {
  name: string | null
  supplier: string | null
  supplierRef: string | null
  lotSize: number | null
  lotPriceHT: number | null
  unitPriceHT: number | null
  imageUrl: string | null
  supplierUrl: string
}

export async function extractAccessoryFromUrl(rawUrl: string): Promise<ExtractedAccessory> {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    throw new Error('URL invalide')
  }

  const res = await fetch(rawUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`)
  const html = await res.text()
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`
  const hostname = parsedUrl.hostname.replace(/^www\./, '')

  let name: string | null = null
  let imageUrl: string | null = null
  let rawPrice: number | null = null
  let supplierRef: string | null = null
  let lotSize: number | null = null

  // ── 1. JSON-LD structured data ──
  const jsonLdBlocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1])
      const items = Array.isArray(data) ? data : (data['@graph'] ? data['@graph'] : [data])
      const product = items.find((item: Record<string, unknown>) => item['@type'] === 'Product')
      if (product) {
        name = name ?? (typeof product.name === 'string' ? product.name : null)
        const img = product.image
        if (!imageUrl && img) {
          imageUrl = typeof img === 'string' ? img : (Array.isArray(img) ? img[0] : null)
        }
        const offers = product.offers as Record<string, unknown> | undefined
        if (!rawPrice && offers) {
          const p = offers.price ?? offers.lowPrice
          if (p != null) rawPrice = parseFloat(String(p).replace(',', '.'))
        }
        const sku = product.sku ?? product.mpn
        if (!supplierRef && sku) supplierRef = String(sku)
      }
    } catch {
      // ignore invalid JSON-LD
    }
  }

  // ── 2. og: meta fallbacks ──
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/)
    ?? html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/)
  if (!name && ogTitle) name = ogTitle[1]

  const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/)
    ?? html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/)
  if (!imageUrl && ogImage) imageUrl = ogImage[1]

  // ── 3. h1 fallback for name ──
  if (!name) {
    const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
    if (h1) name = h1[1].trim()
  }

  // ── 4. Title tag fallback ──
  if (!name) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    if (titleMatch) name = titleMatch[1].split('|')[0].split('-')[0].trim()
  }

  // ── 5. Price patterns (French format) ──
  if (!rawPrice) {
    // Look for patterns like "29,00 € HT" or "29.00€" or data-price="29.00"
    const pricePatterns = [
      /data-price="([\d.]+)"/,
      /itemprop="price"[^>]*content="([\d.]+)"/,
      /(\d+[.,]\d{2})\s*€\s*(?:HT|ht|H\.T\.)/,
      /Prix\s*:?\s*(\d+[.,]\d{2})\s*€/i,
    ]
    for (const pattern of pricePatterns) {
      const m = html.match(pattern)
      if (m) { rawPrice = parseFloat(m[1].replace(',', '.')); break }
    }
  }

  // ── 6. Lot size detection ──
  const lotPatterns = [
    /[Ll]ot\s+de\s+(\d+)/,
    /[Pp]ar\s+(\d+)\s+unit/,
    /[Cc]arton\s+de\s+(\d+)/,
    /(\d+)\s+pi[eè]ces?\/lot/i,
    /[Qq]uantit[eé]\s*:\s*(\d+)/i,
  ]
  for (const pattern of lotPatterns) {
    const m = html.match(pattern)
    if (m) { lotSize = parseInt(m[1]); break }
  }

  // ── 7. Supplier ref fallback ──
  if (!supplierRef) {
    const refPatterns = [
      /[Rr][eé]f\.?\s*:?\s*([A-Z0-9][A-Z0-9\-]{2,})/,
      /[Ss][Kk][Uu]\s*:?\s*([A-Z0-9\-]+)/i,
      /[Aa]rt\.?\s*:?\s*([A-Z0-9\-]+)/i,
    ]
    for (const pattern of refPatterns) {
      const m = html.match(pattern)
      if (m) { supplierRef = m[1]; break }
    }
  }

  // ── 8. Extract ref from URL slug (last segment before extension) ──
  if (!supplierRef) {
    const slug = parsedUrl.pathname.split('/').filter(Boolean).pop() ?? ''
    const codeMatch = slug.match(/([A-Z0-9]{4,}(?:-[A-Z0-9]+)*)/i)
    if (codeMatch) supplierRef = codeMatch[1].toUpperCase()
  }

  // ── 9. Supplier name from hostname ──
  const supplier = hostname.split('.')[0]
    .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // ── 10. Make image URL absolute ──
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`
  }

  // ── 11. Clean up name (remove excess whitespace, HTML entities) ──
  if (name) {
    name = name
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#039;/g, "'").replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ').trim()
  }

  const unitPriceHT = rawPrice != null && lotSize != null && lotSize > 1
    ? Math.round((rawPrice / lotSize) * 10000) / 10000
    : rawPrice

  return {
    name,
    supplier,
    supplierRef,
    lotSize,
    lotPriceHT: rawPrice,
    unitPriceHT,
    imageUrl,
    supplierUrl: rawUrl,
  }
}
