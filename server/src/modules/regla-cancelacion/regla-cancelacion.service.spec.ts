import { PrismaService } from '../../prisma/prisma.service';
import { ReglaCancelacionService } from './regla-cancelacion.service';

describe('ReglaCancelacionService', () => {
  const prisma = { reglaCancelacion: { findUniqueOrThrow: jest.fn() } };
  const servicio = new ReglaCancelacionService(
    prisma as unknown as PrismaService,
  );

  it('obtiene la regla de la fila 1', async () => {
    const regla = { id: 1, horasAnticipacion: 24, tipoCompensacion: 'CREDITO' };
    prisma.reglaCancelacion.findUniqueOrThrow.mockResolvedValue(regla);
    await expect(servicio.obtenerVigente()).resolves.toBe(regla);
    expect(prisma.reglaCancelacion.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  describe('plazoLimite', () => {
    it('resta las horas de anticipación al inicio del turno en Lima', () => {
      expect(servicio.plazoLimite('2026-10-18', '19:00', 24)).toEqual(
        new Date('2026-10-18T00:00:00.000Z'),
      );
    });

    it('con 0 horas el plazo es el inicio del turno', () => {
      expect(servicio.plazoLimite('2026-10-18', '19:00', 0)).toEqual(
        new Date('2026-10-19T00:00:00.000Z'),
      );
    });
  });
});
