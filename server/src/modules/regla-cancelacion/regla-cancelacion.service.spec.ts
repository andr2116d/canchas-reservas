import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ReglaCancelacionService } from './regla-cancelacion.service';

describe('ReglaCancelacionService', () => {
  const prisma = {
    reglaCancelacion: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const servicio = new ReglaCancelacionService(
    prisma as unknown as PrismaService,
    auditoria as unknown as AuditoriaService,
  );

  it('obtiene la regla de la fila 1', async () => {
    const regla = { id: 1, horasAnticipacion: 24, tipoCompensacion: 'CREDITO' };
    prisma.reglaCancelacion.findUniqueOrThrow.mockResolvedValue(regla);
    await expect(servicio.obtenerVigente()).resolves.toBe(regla);
    expect(prisma.reglaCancelacion.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  describe('actualizar', () => {
    const anterior = { horasAnticipacion: 24, tipoCompensacion: 'CREDITO' };
    const nuevo = {
      horasAnticipacion: 0,
      tipoCompensacion: 'DEVOLUCION' as const,
    };
    const tx = {
      $queryRaw: jest.fn(),
      reglaCancelacion: {
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
      tx.$queryRaw.mockResolvedValue([{ id: 1 }]);
      tx.reglaCancelacion.findUniqueOrThrow.mockResolvedValue(anterior);
      tx.reglaCancelacion.update.mockResolvedValue({ id: 1, ...nuevo });
      auditoria.registrar.mockResolvedValue({});
      prisma.$transaction.mockImplementation(
        (fn: (cliente: unknown) => unknown) => fn(tx),
      );
    });

    it('lee, actualiza y audita usando el mismo cliente transaccional', async () => {
      await expect(servicio.actualizar(nuevo, 7)).resolves.toEqual(nuevo);
      expect(tx.reglaCancelacion.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(tx.reglaCancelacion.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: nuevo,
      });
      expect(auditoria.registrar).toHaveBeenCalledWith(
        {
          accion: 'EDITAR',
          entidad: 'REGLA_CANCELACION',
          entidadId: 1,
          usuarioId: 7,
          detalle: { anterior, nuevo },
        },
        tx,
      );
      expect(prisma.reglaCancelacion.update).not.toHaveBeenCalled();
    });

    it('bloquea la regla antes de leer los valores anteriores', async () => {
      await servicio.actualizar(nuevo, 7);
      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
      const [partes, id] = tx.$queryRaw.mock.calls[0] as [
        TemplateStringsArray,
        number,
      ];
      expect(partes.join('?')).toContain('WHERE id = ? FOR UPDATE');
      expect(id).toBe(1);
      expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
        tx.reglaCancelacion.findUniqueOrThrow.mock.invocationCallOrder[0],
      );
    });

    it('no actualiza ni audita si falla el bloqueo', async () => {
      const error = new Error('fallo de bloqueo');
      tx.$queryRaw.mockRejectedValueOnce(error);
      await expect(servicio.actualizar(nuevo, 7)).rejects.toBe(error);
      expect(tx.reglaCancelacion.update).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('propaga el fallo de auditoría para abortar la transacción', async () => {
      const error = new Error('fallo de auditoría');
      auditoria.registrar.mockRejectedValueOnce(error);
      await expect(servicio.actualizar(nuevo, 7)).rejects.toBe(error);
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
