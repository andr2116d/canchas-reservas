import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  AdicionalesService,
  MENSAJE_CON_CONSUMOS,
  MENSAJE_NOMBRE_DUPLICADO,
} from './adicionales.service';

const ADMIN_ID = 7;

const conPrecio = (precio: number) => ({
  id: 2,
  nombre: 'Agua',
  precio: new Prisma.Decimal(precio),
  activo: true,
});

const ADICIONAL = conPrecio(5);

const RESPUESTA = { id: 2, nombre: 'Agua', precio: 5, activo: true };

describe('AdicionalesService', () => {
  const prisma = {
    adicional: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const servicio = new AdicionalesService(
    prisma as unknown as PrismaService,
    auditoria as unknown as AuditoriaService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma),
    );
  });

  const errorDe = (promesa: Promise<unknown>) =>
    promesa.catch((e: unknown) => e);

  describe('listar', () => {
    it('sin filtro trae todos ordenados por nombre', async () => {
      prisma.adicional.findMany.mockResolvedValue([ADICIONAL]);

      const lista = await servicio.listar();

      expect(prisma.adicional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: undefined,
          orderBy: { nombre: 'asc' },
        }),
      );
      expect(lista).toEqual([RESPUESTA]);
    });

    it('con activo=true solo trae los activos', async () => {
      prisma.adicional.findMany.mockResolvedValue([ADICIONAL]);

      await servicio.listar(true);

      expect(prisma.adicional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { activo: true } }),
      );
    });

    it('con activo=false solo trae los inactivos', async () => {
      prisma.adicional.findMany.mockResolvedValue([]);

      await servicio.listar(false);

      expect(prisma.adicional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { activo: false } }),
      );
    });
  });

  describe('crear', () => {
    it('crea con el precio redondeado a 2 decimales y registra CREAR', async () => {
      prisma.adicional.create.mockResolvedValue(ADICIONAL);

      const adicional = await servicio.crear(
        { nombre: 'Agua', precio: 5 },
        ADMIN_ID,
      );

      expect(prisma.adicional.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { nombre: 'Agua', precio: expect.anything() },
        }),
      );
      expect(adicional).toEqual(RESPUESTA);
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: ADMIN_ID,
          accion: 'CREAR',
          entidad: 'ADICIONAL',
          entidadId: 2,
        }),
        prisma,
      );
    });

    it('registrar " agua " cuando ya existe "Agua" devuelve 409 en nombre', async () => {
      prisma.adicional.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      const error = await errorDe(
        servicio.crear({ nombre: ' agua ', precio: 5 }, ADMIN_ID),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        statusCode: 409,
        message: MENSAJE_NOMBRE_DUPLICADO,
        errores: { nombre: MENSAJE_NOMBRE_DUPLICADO },
      });
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('deja pasar cualquier otro error', async () => {
      prisma.adicional.create.mockRejectedValue(new Error('se cayó la base'));
      await expect(
        servicio.crear({ nombre: 'Agua', precio: 5 }, ADMIN_ID),
      ).rejects.toThrow('se cayó la base');
    });
  });

  describe('editar', () => {
    it('un cambio de precio no toca los cobros ya registrados', async () => {
      prisma.adicional.findUnique.mockResolvedValue(ADICIONAL);
      prisma.adicional.update.mockResolvedValue(conPrecio(7.5));

      const adicional = await servicio.editar(2, { precio: 7.5 }, ADMIN_ID);

      expect(adicional).toEqual({ ...RESPUESTA, precio: 7.5 });
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'EDITAR',
          detalle: { anterior: { precio: 5 }, nuevo: { precio: 7.5 } },
        }),
        prisma,
      );
    });

    it('guarda solo los campos que cambiaron en la auditoría', async () => {
      prisma.adicional.findUnique.mockResolvedValue(ADICIONAL);
      prisma.adicional.update.mockResolvedValue({
        ...ADICIONAL,
        nombre: 'Agua mineral',
      });

      const adicional = await servicio.editar(
        2,
        { nombre: 'Agua mineral' },
        ADMIN_ID,
      );

      expect(adicional).toEqual({ ...RESPUESTA, nombre: 'Agua mineral' });
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'EDITAR',
          entidadId: 2,
          detalle: {
            anterior: { nombre: 'Agua' },
            nuevo: { nombre: 'Agua mineral' },
          },
        }),
        prisma,
      );
    });

    it('sin cambios devuelve el adicional sin actualizar ni auditar', async () => {
      prisma.adicional.findUnique.mockResolvedValue(ADICIONAL);

      const adicional = await servicio.editar(2, { nombre: 'Agua' }, ADMIN_ID);

      expect(adicional).toEqual(RESPUESTA);
      expect(prisma.adicional.update).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('si no existe responde 404', async () => {
      prisma.adicional.findUnique.mockResolvedValue(null);
      await expect(
        servicio.editar(99, { nombre: 'Otro' }, ADMIN_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        servicio.editar(0, { nombre: 'Otro' }, ADMIN_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('con nombre repetido responde 409 en nombre', async () => {
      prisma.adicional.findUnique.mockResolvedValue(ADICIONAL);
      prisma.adicional.update.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      const error = await errorDe(
        servicio.editar(2, { nombre: 'balon' }, ADMIN_ID),
      );

      expect((error as ConflictException).getResponse()).toMatchObject({
        statusCode: 409,
        errores: { nombre: MENSAJE_NOMBRE_DUPLICADO },
      });
    });
  });

  describe('cambiarEstado', () => {
    it('desactivar deja su registro en auditoría', async () => {
      prisma.adicional.findUnique.mockResolvedValue(ADICIONAL);
      prisma.adicional.update.mockResolvedValue({
        ...ADICIONAL,
        activo: false,
      });

      const adicional = await servicio.cambiarEstado(2, false, ADMIN_ID);

      expect(adicional).toEqual({ ...RESPUESTA, activo: false });
      expect(prisma.adicional.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 2 }, data: { activo: false } }),
      );
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: ADMIN_ID,
          accion: 'DESACTIVAR',
          entidad: 'ADICIONAL',
          entidadId: 2,
          detalle: { anterior: { activo: true }, nuevo: { activo: false } },
        }),
        prisma,
      );
    });

    it('activar uno desactivado audita ACTIVAR', async () => {
      prisma.adicional.findUnique.mockResolvedValue({
        ...ADICIONAL,
        activo: false,
      });
      prisma.adicional.update.mockResolvedValue(ADICIONAL);

      await servicio.cambiarEstado(2, true, ADMIN_ID);

      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'ACTIVAR' }),
        prisma,
      );
    });

    it('pedir el valor que ya tiene no cambia nada', async () => {
      prisma.adicional.findUnique.mockResolvedValue(ADICIONAL);

      await servicio.cambiarEstado(2, true, ADMIN_ID);

      expect(prisma.adicional.update).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('si no existe responde 404', async () => {
      prisma.adicional.findUnique.mockResolvedValue(null);
      await expect(
        servicio.cambiarEstado(99, false, ADMIN_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('eliminar', () => {
    it('borra el adicional y deja su registro en auditoría', async () => {
      prisma.adicional.findUnique.mockResolvedValue(ADICIONAL);

      await servicio.eliminar(2, ADMIN_ID);

      expect(prisma.adicional.delete).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(auditoria.registrar).toHaveBeenCalledWith(
        {
          usuarioId: ADMIN_ID,
          accion: 'ELIMINAR',
          entidad: 'ADICIONAL',
          entidadId: 2,
          detalle: {
            anterior: { id: 2, nombre: 'Agua', precio: 5, activo: true },
          },
        },
        prisma,
      );
    });

    it('si el adicional ya tiene consumos responde 409', async () => {
      prisma.adicional.findUnique.mockResolvedValue(ADICIONAL);
      prisma.adicional.delete.mockRejectedValue(
        Object.assign(new Error('Foreign key'), { code: 'P2003' }),
      );

      const error = await errorDe(servicio.eliminar(2, ADMIN_ID));

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        statusCode: 409,
        message: MENSAJE_CON_CONSUMOS,
        errores: {},
      });
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('si no existe responde 404', async () => {
      prisma.adicional.findUnique.mockResolvedValue(null);
      await expect(servicio.eliminar(99, ADMIN_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
