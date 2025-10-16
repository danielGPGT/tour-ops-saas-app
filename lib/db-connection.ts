import { PrismaClient } from '@prisma/client'

// Connection pool configuration for Supabase
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Enhanced connection configuration for Supabase
    __internal: {
      engine: {
        connectTimeout: 60000, // 60 seconds
        queryTimeout: 60000,   // 60 seconds
      },
    },
  })
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Use global instance in development to prevent connection pool exhaustion
export const prisma = global.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

// Enhanced error handling
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    return { connected: true, error: null }
  } catch (error) {
    console.error('Database connection test failed:', error)
    return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Safe database query wrapper
export async function safeDbQuery<T>(
  query: () => Promise<T>,
  fallback: T,
  context: string = 'database query'
): Promise<T> {
  try {
    return await query()
  } catch (error) {
    console.error(`${context} failed:`, error)
    return fallback
  }
}
