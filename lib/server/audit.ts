import { prisma } from '@/lib/server/prisma'

export type AuditAction =
  | 'CREATE_QUOTE'
  | 'DELETE_QUOTE'
  | 'UPSERT_ACTUALS'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'UPDATE_SETTING'

export async function logAction(params: {
  userId?: string | null
  userName?: string | null
  action: AuditAction
  entityType: string
  entityRef?: string | null
  details?: Record<string, unknown>
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        userName: params.userName ?? null,
        action: params.action,
        entityType: params.entityType,
        entityRef: params.entityRef ?? null,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    })
  } catch {
    // L'échec du log ne doit jamais bloquer l'opération principale
  }
}
