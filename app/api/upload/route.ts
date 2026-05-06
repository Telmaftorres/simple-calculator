import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { writeFile, mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'
import path from 'path'
import sharp from 'sharp'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 5

// Folders where images are converted to WebP for storage efficiency
const WEBP_FOLDERS = new Set(['product-types'])

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const ALLOWED_FOLDERS = ['production-sheets', 'product-types', 'misc']
  const rawFolder = (formData.get('folder') as string) || 'misc'
  const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : 'misc'

  if (!file) {
    return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Type de fichier non autorisé (JPEG, PNG, WEBP, GIF uniquement)' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)` }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
  await mkdir(uploadDir, { recursive: true })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  let filename: string
  let outputBuffer: Buffer

  if (WEBP_FOLDERS.has(folder)) {
    filename = `${Date.now()}-${randomUUID()}.webp`
    outputBuffer = await sharp(buffer)
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } else {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    filename = `${Date.now()}-${randomUUID()}.${ext}`
    outputBuffer = buffer
  }

  await writeFile(path.join(uploadDir, filename), outputBuffer)

  return NextResponse.json({ url: `/uploads/${folder}/${filename}` })
}
