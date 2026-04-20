import { revalidateTag, revalidatePath } from 'next/cache'

export type CacheTag =
  | 'studies'
  | 'plates'
  | 'quotes'
  | 'settings'
  | 'dashboard-stats'
  | 'product-types'
  | 'consumables'
  | 'accessories'
  | 'packaging-rules'

export function revalidateCache(tag: CacheTag) {
  // @ts-expect-error - Next.js type mismatch sur revalidateTag
  revalidateTag(tag)
}

export function revalidateEntity(tag: CacheTag, ...paths: string[]) {
  revalidateCache(tag)
  paths.forEach(p => revalidatePath(p))
}
