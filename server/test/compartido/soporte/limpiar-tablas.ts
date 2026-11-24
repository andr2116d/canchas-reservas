import type { PrismaService } from '../../../src/compartido/infraestructura/prisma/prisma.service';

/** Vacía todas las tablas (menos el historial de migraciones) para aislar cada prueba. */
export async function limpiarTablas(prisma: PrismaService): Promise<void> {
  const tablas = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tablas.length === 0) return;
  const lista = tablas.map(({ tablename }) => `"${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE`,
  );
}
