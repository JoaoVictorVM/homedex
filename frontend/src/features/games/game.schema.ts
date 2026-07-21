import { z } from 'zod'

export const gameSchema = z.object({
  id: z.int().positive(),
  name: z.string().min(1),
  isOfficial: z.boolean(),
  visible: z.boolean(),
})

export const gameListSchema = z.array(gameSchema)

export type Game = z.infer<typeof gameSchema>
