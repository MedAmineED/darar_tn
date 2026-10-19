import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Retry only errors for which Prisma has rolled back the entire transaction. */
export async function stockTransaction<T>(
  prisma: PrismaService,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(operation, {
        maxWait: 10000,
        timeout: 15000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2034'
      )
        throw error;
      if (attempt === 2)
        throw new ConflictException({
          message: 'Stock changed concurrently. Please retry.',
          code: 'STOCK_CONFLICT',
        });
    }
  }
  throw new Error('Unreachable transaction retry');
}
