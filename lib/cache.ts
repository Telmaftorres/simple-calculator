'use server'

import { revalidateTag as nextRevalidateTag } from 'next/cache'

/**
 * Wrapper typé pour revalidateTag afin d'éviter les @ts-expect-error répétés.
 */
export async function revalidateCache(tag: string) {
  ;(nextRevalidateTag as (tag: string) => void)(tag)
}
