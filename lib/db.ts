import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool optimization for Supabase
  __internal: {
    engine: {
      connectTimeout: 60000, // 60 seconds
      queryTimeout: 60000,   // 60 seconds
    },
  },
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma


