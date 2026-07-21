import { z } from 'zod'

export const maxBoxes = 32

export const collectionSchema = z.object({
  code: z.string().min(1),
  boxCount: z.int().min(1).max(maxBoxes),
  createdAt: z.string().min(1),
})

export type Collection = z.infer<typeof collectionSchema>
