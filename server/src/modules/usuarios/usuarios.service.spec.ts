import { ConflictException, NotFoundException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

import {
  MENSAJE_CORREO_DUPLICADO,
  MENSAJE_DOCUMENTO_DUPLICADO,
  UsuariosService,
} from './usuarios.service';

const RECEPCIONISTA = {
  id: 5,
  nombres: 'Ana',
  apellidos: 'Pérez',
  tipoDocumento: 'DNI' as const,
  numeroDocumento: '71234567',
  correo: 'ana@laprevia.pe',
  telefono: '911111111',
  estado: 'ACTIVO' as const,
  creadoEn: new Date('2026-10-01T10:00:00Z'),
};

const NUEVO = {
  nombres: 'Ana',
  apellidos: 'Pérez',
  tipoDocumento: 'DNI' as const,
  numeroDocumento: '71234567',
  correo: 'ana@laprevia.pe',
  telefono: '911111111',
  contrasena: 'Recepcion123',
};

type Llamada = { data: Record<string, unknown> };

describe('UsuariosService', () => {
  const prisma = {
    usuario: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const servicio = new UsuariosService(
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
    it('filtra por rol RECEPCIONISTA y por estado, sin passwordHash', async () => {
      prisma.usuario.findMany.mockResolvedValue([]);

      await servicio.listar('ACTIVO');

      const args = prisma.usuario.findMany.mock.calls[0][0] as {
        where: unknown;
        select: Record<string, boolean>;
      };
      expect(args.where).toEqual({ rol: 'RECEPCIONISTA', estado: 'ACTIVO' });
      expect(args.select.passwordHash).toBeUndefined();
      expect(args.select.rol).toBeUndefined();
    });
  });

  describe('crear', () => {
    it('con correo repetido responde 409 en correo y no abre transacción', async () => {
      prisma.usuario.findFirst.mockResolvedValueOnce({ id: 1 });
      prisma.usuario.findFirst.mockResolvedValueOnce(null);

      const error = await errorDe(servicio.crear(NUEVO, 1));

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        statusCode: 409,
        message: MENSAJE_CORREO_DUPLICADO,
        errores: { correo: MENSAJE_CORREO_DUPLICADO },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('con correo y documento repetidos devuelve los dos errores', async () => {
      prisma.usuario.findFirst.mockResolvedValue({ id: 1 });

      const error = (await errorDe(
        servicio.crear(NUEVO, 1),
      )) as ConflictException;

      expect(error.getResponse()).toMatchObject({
        errores: {
          correo: MENSAJE_CORREO_DUPLICADO,
          numeroDocumento: MENSAJE_DOCUMENTO_DUPLICADO,
        },
      });
    });

    it('crea un RECEPCIONISTA con la contraseña cifrada y registra CREAR sin ella', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue(RECEPCIONISTA);

      const creado = await servicio.crear(NUEVO, 1);

      const { data } = prisma.usuario.create.mock.calls[0][0] as Llamada;
      expect(data).toMatchObject({ rol: 'RECEPCIONISTA', creadoPorId: 1 });
      expect(data.contrasena).toBeUndefined();
      expect(data.passwordHash).not.toBe(NUEVO.contrasena);
      expect(await compare(NUEVO.contrasena, data.passwordHash as string)).toBe(
        true,
      );
      expect(creado).toBe(RECEPCIONISTA);

      const [registro, tx] = auditoria.registrar.mock.calls[0] as [
        Record<string, unknown>,
        unknown,
      ];
      expect(registro).toMatchObject({
        usuarioId: 1,
        accion: 'CREAR',
        entidad: 'RECEPCIONISTA',
        entidadId: 5,
      });
      expect(tx).toBe(prisma);
      expect(JSON.stringify(registro)).not.toMatch(
        /contrasena|passwordHash|Recepcion123/,
      );
    });

    it('si la base rechaza el duplicado, responde 409 en el campo', async () => {
      prisma.usuario.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 9 })
        .mockResolvedValueOnce(null);
      prisma.usuario.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      const error = (await errorDe(
        servicio.crear(NUEVO, 1),
      )) as ConflictException;

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getResponse()).toMatchObject({
        errores: { correo: MENSAJE_CORREO_DUPLICADO },
      });
    });
  });

  describe('registrarJugador', () => {
    const JUGADOR = {
      nombres: 'Lucía',
      apellidos: 'Ramírez Torres',
      tipoDocumento: 'DNI' as const,
      numeroDocumento: '71234567',
      correo: 'lucia@correo.com',
      telefono: '987654321',
      contrasena: 'Cancha2026',
    };
    const JUGADOR_CREADO = {
      id: 7,
      nombres: 'Lucía',
      apellidos: 'Ramírez Torres',
      correo: 'lucia@correo.com',
      rol: 'JUGADOR' as const,
    };

    it('crea un JUGADOR activo con la contraseña cifrada y sin auditoría', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue(JUGADOR_CREADO);

      const creado = await servicio.registrarJugador(JUGADOR);

      const { data } = prisma.usuario.create.mock.calls[0][0] as Llamada;
      expect(data).toMatchObject({ rol: 'JUGADOR', estado: 'ACTIVO' });
      expect(data.contrasena).toBeUndefined();
      expect(data.passwordHash).not.toBe(JUGADOR.contrasena);
      expect(
        await compare(JUGADOR.contrasena, data.passwordHash as string),
      ).toBe(true);
      expect(creado).toBe(JUGADOR_CREADO);
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('solo selecciona id, nombres, apellidos, correo y rol, nunca passwordHash', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue(JUGADOR_CREADO);

      await servicio.registrarJugador(JUGADOR);

      const { select } = prisma.usuario.create.mock.calls[0][0] as {
        select: Record<string, boolean>;
      };
      expect(select).toEqual({
        id: true,
        nombres: true,
        apellidos: true,
        correo: true,
        rol: true,
      });
      expect(select.passwordHash).toBeUndefined();
    });

    it('con correo repetido responde 409 en correo y no crea al usuario', async () => {
      prisma.usuario.findFirst.mockResolvedValueOnce({ id: 1 });
      prisma.usuario.findFirst.mockResolvedValueOnce(null);

      const error = await errorDe(servicio.registrarJugador(JUGADOR));

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        statusCode: 409,
        message: MENSAJE_CORREO_DUPLICADO,
        errores: { correo: MENSAJE_CORREO_DUPLICADO },
      });
      expect(prisma.usuario.create).not.toHaveBeenCalled();
    });

    it('con documento repetido responde 409 en numeroDocumento', async () => {
      prisma.usuario.findFirst.mockResolvedValueOnce(null);
      prisma.usuario.findFirst.mockResolvedValueOnce({ id: 2 });

      const error = await errorDe(servicio.registrarJugador(JUGADOR));

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        statusCode: 409,
        message: MENSAJE_DOCUMENTO_DUPLICADO,
        errores: { numeroDocumento: MENSAJE_DOCUMENTO_DUPLICADO },
      });
      expect(prisma.usuario.create).not.toHaveBeenCalled();
    });

    it('con correo y documento repetidos devuelve los dos errores', async () => {
      prisma.usuario.findFirst.mockResolvedValue({ id: 1 });

      const error = (await errorDe(
        servicio.registrarJugador(JUGADOR),
      )) as ConflictException;

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getResponse()).toMatchObject({
        statusCode: 409,
        errores: {
          correo: MENSAJE_CORREO_DUPLICADO,
          numeroDocumento: MENSAJE_DOCUMENTO_DUPLICADO,
        },
      });
      expect(prisma.usuario.create).not.toHaveBeenCalled();
    });

    it('si la base rechaza el duplicado, responde 409 en el campo', async () => {
      prisma.usuario.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 9 })
        .mockResolvedValueOnce(null);
      prisma.usuario.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      const error = (await errorDe(
        servicio.registrarJugador(JUGADOR),
      )) as ConflictException;

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getResponse()).toMatchObject({
        errores: { correo: MENSAJE_CORREO_DUPLICADO },
      });
    });
  });

  describe('editar', () => {
    it('guarda en el detalle solo los campos que cambiaron', async () => {
      prisma.usuario.findFirst.mockResolvedValue(RECEPCIONISTA);
      prisma.usuario.update.mockResolvedValue({
        ...RECEPCIONISTA,
        telefono: '922222222',
      });

      await servicio.editar(
        5,
        { nombres: 'Ana', telefono: '922222222', correo: 'ana@laprevia.pe' },
        1,
      );

      expect(auditoria.registrar).toHaveBeenCalledWith(
        {
          usuarioId: 1,
          accion: 'EDITAR',
          entidad: 'RECEPCIONISTA',
          entidadId: 5,
          detalle: {
            anterior: { telefono: '911111111' },
            nuevo: { telefono: '922222222' },
          },
        },
        prisma,
      );
    });

    it('sin cambios responde el recepcionista sin actualizar ni auditar', async () => {
      prisma.usuario.findFirst.mockResolvedValue(RECEPCIONISTA);

      const resultado = await servicio.editar(5, { nombres: 'Ana' }, 1);

      expect(resultado).toBe(RECEPCIONISTA);
      expect(prisma.usuario.update).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('con un correo de otra cuenta responde 409 en correo', async () => {
      prisma.usuario.findFirst
        .mockResolvedValueOnce(RECEPCIONISTA)
        .mockResolvedValueOnce({ id: 8 });

      const error = (await errorDe(
        servicio.editar(5, { correo: 'otro@laprevia.pe' }, 1),
      )) as ConflictException;

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getResponse()).toMatchObject({
        errores: { correo: MENSAJE_CORREO_DUPLICADO },
      });
      expect(prisma.usuario.findFirst).toHaveBeenLastCalledWith({
        where: { correo: 'otro@laprevia.pe', id: { not: 5 } },
        select: { id: true },
      });
    });
  });

  describe('cambiarEstado', () => {
    it('desactivar deja INACTIVO y registra DESACTIVAR', async () => {
      prisma.usuario.findFirst.mockResolvedValue(RECEPCIONISTA);
      prisma.usuario.update.mockResolvedValue({
        ...RECEPCIONISTA,
        estado: 'INACTIVO',
      });

      await servicio.cambiarEstado(5, 'INACTIVO', 1);

      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5 },
          data: { estado: 'INACTIVO' },
        }),
      );
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'DESACTIVAR',
          detalle: {
            anterior: { estado: 'ACTIVO' },
            nuevo: { estado: 'INACTIVO' },
          },
        }),
        prisma,
      );
    });

    it('activar registra ACTIVAR', async () => {
      prisma.usuario.findFirst.mockResolvedValue({
        ...RECEPCIONISTA,
        estado: 'INACTIVO',
      });
      prisma.usuario.update.mockResolvedValue(RECEPCIONISTA);

      await servicio.cambiarEstado(5, 'ACTIVO', 1);

      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'ACTIVAR' }),
        prisma,
      );
    });

    it('si ya tiene ese estado no cambia nada ni audita', async () => {
      prisma.usuario.findFirst.mockResolvedValue(RECEPCIONISTA);

      const resultado = await servicio.cambiarEstado(5, 'ACTIVO', 1);

      expect(resultado).toBe(RECEPCIONISTA);
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });
  });

  describe('restablecerContrasena', () => {
    it('guarda el nuevo hash y registra RESTABLECER_CONTRASENA sin detalle', async () => {
      prisma.usuario.findFirst.mockResolvedValue(RECEPCIONISTA);

      await servicio.restablecerContrasena(5, 'NuevaClave1', 1);

      const { data } = prisma.usuario.update.mock.calls[0][0] as Llamada;
      expect(await compare('NuevaClave1', data.passwordHash as string)).toBe(
        true,
      );
      expect(auditoria.registrar).toHaveBeenCalledWith(
        {
          usuarioId: 1,
          accion: 'RESTABLECER_CONTRASENA',
          entidad: 'RECEPCIONISTA',
          entidadId: 5,
        },
        prisma,
      );
    });
  });

  describe('usuario no encontrado', () => {
    it('busca solo entre recepcionistas', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);

      await expect(
        servicio.cambiarEstado(1, 'INACTIVO', 1),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.usuario.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1, rol: 'RECEPCIONISTA' } }),
      );
    });

    it('responde 404 en editar, estado y restablecer', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);

      await expect(
        servicio.editar(99, { nombres: 'Luis' }, 1),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        servicio.cambiarEstado(99, 'INACTIVO', 1),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        servicio.restablecerContrasena(99, 'NuevaClave1', 1),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });

    it('un id fuera de rango responde 404 sin consultar la base', async () => {
      await expect(
        servicio.editar(9999999999, { nombres: 'Luis' }, 1),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.usuario.findFirst).not.toHaveBeenCalled();
    });
  });
});
