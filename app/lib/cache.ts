import { revalidateTag } from 'next/cache'

export function revalidateCache(tag: string) {
  // @ts-expect-error - Next.js type mismatch sur revalidateTag
  revalidateTag(tag)
}