import { describe, it, expect, vi } from 'vitest'
import { getPlates, getProductTypes } from '../app/actions/get-data'
import { prisma } from '../lib/prisma'

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  prisma: {
    plate: {
      findMany: vi.fn(),
    },
    productType: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

describe('Server Actions: get-data', () => {
  it('should return plates', async () => {
    const mockPlates = [
        { id: 1, name: 'Plaque 1', width: 1000, height: 2000, cost: 10, material: 'Test' }
    ];
    (prisma.plate.findMany as any).mockResolvedValue(mockPlates)

    const plates = await getPlates()
    expect(plates).toHaveLength(1)
    expect(plates[0].name).toBe('Plaque 1')
  })

  it('should return product types with elements', async () => {
      const mockProductTypes = [
          { id: 1, name: 'Stand', elements: [] }
      ];
      (prisma.productType.findMany as any).mockResolvedValue(mockProductTypes)

      const productTypes = await getProductTypes()
      expect(productTypes).toHaveLength(1)
      expect(productTypes[0].name).toBe('Stand')
  })
})
