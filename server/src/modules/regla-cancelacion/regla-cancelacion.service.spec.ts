import { Prisma } from '../../generated/prisma/client';
import type { TipoCompensacion } from '../../generated/prisma/enums';
import { instanteEnLima } from '../../common/fechas-lima';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ReglaCancelacionService } from './regla-cancelacion.service';

describe('ReglaCancelacionService', () => {
  const prisma = {
    reglaCancelacion: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
    pago: { findMany: jest.fn() },
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

  describe('calcularCompensacion', () => {
    const inicioEn = instanteEnLima('2026-10-18', '19:00');
    const reserva = {
      id: 15,
      inicioEn,
      valorTurno: new Prisma.Decimal('80.00'),
      reglaHorasAnticipacion: 24,
      reglaTipoCompensacion: 'CREDITO' as TipoCompensacion,
    };
    const horasAntes = (horas: number) =>
      new Date(inicioEn.getTime() - horas * 3_600_000);

    interface PagoFila {
      reservaId: number;
      concepto: 'ADELANTO' | 'SALDO' | 'ADICIONALES';
      metodo: string;
      estado: string;
      monto: Prisma.Decimal;
    }

    function clienteCon(pagos: PagoFila[]) {
      return {
        pago: {
          findMany: jest.fn(
            ({ where }: { where: { reservaId: number; estado: string } }) =>
              Promise.resolve(
                pagos
                  .filter(
                    (pago) =>
                      pago.reservaId === where.reservaId &&
                      pago.estado === where.estado,
                  )
                  .map(({ concepto, monto }) => ({ concepto, monto })),
              ),
          ),
        },
      };
    }

    function pago(
      concepto: PagoFila['concepto'],
      monto: string,
      estado = 'APROBADO',
      metodo = 'EFECTIVO',
    ): PagoFila {
      return {
        reservaId: 15,
        concepto,
        metodo,
        estado,
        monto: new Prisma.Decimal(monto),
      };
    }

    function calcular(
      pagos: PagoFila[],
      momento: Date,
      motivo: 'CLIENTE' | 'INCIDENCIA' = 'CLIENTE',
      datosReserva = reserva,
    ) {
      return servicio.calcularCompensacion(
        datosReserva,
        momento,
        motivo,
        clienteCon(pagos) as unknown as PrismaService,
      );
    }

    beforeEach(() => jest.clearAllMocks());

    it('usa la copia de la regla de la reserva aunque la vigente sea distinta', async () => {
      prisma.reglaCancelacion.findUniqueOrThrow.mockResolvedValue({
        id: 1,
        horasAnticipacion: 2,
        tipoCompensacion: 'DEVOLUCION',
      });
      await expect(
        calcular([pago('ADELANTO', '40.00')], horasAntes(23)),
      ).resolves.toEqual({ resultado: 'RETENCION', importe: 0, retenido: 40 });
      await expect(
        calcular([pago('ADELANTO', '40.00')], horasAntes(30)),
      ).resolves.toEqual({ resultado: 'CREDITO', importe: 40, retenido: 0 });
      expect(prisma.reglaCancelacion.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('con la copia en devolución devuelve el adelanto', async () => {
      await expect(
        calcular([pago('ADELANTO', '40.00')], horasAntes(30), 'CLIENTE', {
          ...reserva,
          reglaTipoCompensacion: 'DEVOLUCION',
        }),
      ).resolves.toEqual({ resultado: 'DEVOLUCION', importe: 40, retenido: 0 });
    });

    it('lee solo los pagos aprobados de esa reserva con el cliente que recibe', async () => {
      const tx = clienteCon([pago('ADELANTO', '40.00')]);
      await servicio.calcularCompensacion(
        reserva,
        horasAntes(30),
        'CLIENTE',
        tx as unknown as PrismaService,
      );
      expect(tx.pago.findMany).toHaveBeenCalledWith({
        where: { reservaId: 15, estado: 'APROBADO' },
        select: { concepto: true, monto: true },
      });
      expect(prisma.pago.findMany).not.toHaveBeenCalled();
    });

    it('sin cliente usa prisma', async () => {
      prisma.pago.findMany.mockResolvedValue([]);
      await expect(
        servicio.calcularCompensacion(reserva, horasAntes(30), 'CLIENTE'),
      ).resolves.toEqual({
        resultado: 'SIN_COMPENSACION',
        importe: 0,
        retenido: 0,
      });
      expect(prisma.pago.findMany).toHaveBeenCalledTimes(1);
    });

    it('suma solo los adelantos aprobados, no los pendientes ni rechazados', async () => {
      const pagos = [
        pago('ADELANTO', '20.00'),
        pago('ADELANTO', '15.00', 'PENDIENTE_VALIDACION'),
        pago('ADELANTO', '10.00', 'EN_PROCESO'),
        pago('ADELANTO', '40.00', 'RECHAZADO'),
        { ...pago('ADELANTO', '30.00'), reservaId: 99 },
      ];
      await expect(calcular(pagos, horasAntes(30))).resolves.toEqual({
        resultado: 'CREDITO',
        importe: 20,
        retenido: 0,
      });
      await expect(calcular(pagos, horasAntes(1))).resolves.toEqual({
        resultado: 'RETENCION',
        importe: 0,
        retenido: 20,
      });
    });

    it('solo con pagos pendientes o rechazados no hay compensación', async () => {
      await expect(
        calcular(
          [
            pago('ADELANTO', '40.00', 'PENDIENTE_VALIDACION'),
            pago('ADELANTO', '40.00', 'RECHAZADO'),
          ],
          horasAntes(30),
        ),
      ).resolves.toEqual({
        resultado: 'SIN_COMPENSACION',
        importe: 0,
        retenido: 0,
      });
    });

    it('un adelanto pagado en parte con crédito cuenta igual que uno en efectivo', async () => {
      await expect(
        calcular(
          [
            pago('ADELANTO', '15.00', 'APROBADO', 'CREDITO'),
            pago('ADELANTO', '25.00', 'APROBADO', 'EFECTIVO'),
          ],
          horasAntes(30),
        ),
      ).resolves.toEqual({ resultado: 'CREDITO', importe: 40, retenido: 0 });
    });

    it('el pago de saldo no cuenta como adelanto para un cliente', async () => {
      await expect(
        calcular(
          [pago('ADELANTO', '40.00'), pago('SALDO', '40.00')],
          horasAntes(1),
        ),
      ).resolves.toEqual({ resultado: 'RETENCION', importe: 0, retenido: 40 });
    });

    it('por incidencia 1 h antes devuelve adelanto y saldo', async () => {
      await expect(
        calcular(
          [pago('ADELANTO', '40.00'), pago('SALDO', '40.00')],
          horasAntes(1),
          'INCIDENCIA',
        ),
      ).resolves.toEqual({ resultado: 'DEVOLUCION', importe: 80, retenido: 0 });
    });

    it('por incidencia un adicional aprobado no entra en lo devuelto', async () => {
      await expect(
        calcular(
          [
            pago('ADELANTO', '40.00'),
            pago('SALDO', '40.00'),
            pago('ADICIONALES', '12.50'),
          ],
          horasAntes(1),
          'INCIDENCIA',
        ),
      ).resolves.toEqual({ resultado: 'DEVOLUCION', importe: 80, retenido: 0 });
    });

    it('por incidencia los pagos pendientes o rechazados no cuentan', async () => {
      await expect(
        calcular(
          [
            pago('ADELANTO', '40.00'),
            pago('SALDO', '40.00', 'PENDIENTE_VALIDACION'),
            pago('SALDO', '40.00', 'RECHAZADO'),
          ],
          horasAntes(1),
          'INCIDENCIA',
        ),
      ).resolves.toEqual({ resultado: 'DEVOLUCION', importe: 40, retenido: 0 });
    });

    it('por incidencia solo con pagos pendientes no hay compensación', async () => {
      await expect(
        calcular(
          [pago('ADELANTO', '40.00', 'PENDIENTE_VALIDACION')],
          horasAntes(1),
          'INCIDENCIA',
        ),
      ).resolves.toEqual({
        resultado: 'SIN_COMPENSACION',
        importe: 0,
        retenido: 0,
      });
    });

    it('conserva los céntimos de varios pagos', async () => {
      await expect(
        calcular(
          [pago('ADELANTO', '10.01'), pago('ADELANTO', '17.52')],
          horasAntes(1),
        ),
      ).resolves.toEqual({
        resultado: 'RETENCION',
        importe: 0,
        retenido: 27.53,
      });
    });
  });
});
