import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { cuerpoError } from '../../common/errores';
import type { Prisma } from '../../generated/prisma/client';
import type {
  EstadoUsuario,
  TipoDocumento,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { detalleCambios } from '../auditoria/detalle-cambios';
import { CrearRecepcionistaDto } from './dto/crear-recepcionista.dto';
import { EditarRecepcionistaDto } from './dto/editar-recepcionista.dto';
import { RegistrarJugadorDto } from './dto/registrar-jugador.dto';

export const MENSAJE_NO_ENCONTRADO = 'No se encontró el recepcionista';
export const MENSAJE_CORREO_DUPLICADO = 'Este correo ya está registrado';
export const MENSAJE_DOCUMENTO_DUPLICADO = 'Este documento ya está registrado';
const MENSAJE_DUPLICADO = 'Ya existe un usuario con esos datos';

const ENTIDAD = 'RECEPCIONISTA';
const ID_MAXIMO = 2147483647;
const COSTO_HASH = 10;

const CAMPOS_RECEPCIONISTA = {
  id: true,
  nombres: true,
  apellidos: true,
  tipoDocumento: true,
  numeroDocumento: true,
  correo: true,
  telefono: true,
  estado: true,
  creadoEn: true,
} satisfies Prisma.UsuarioSelect;

const CAMPOS_JUGADOR = {
  id: true,
  nombres: true,
  apellidos: true,
  correo: true,
  rol: true,
} satisfies Prisma.UsuarioSelect;

interface Duplicables {
  correo?: string;
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
}

function esDuplicado(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

function noEncontrado() {
  return new NotFoundException(cuerpoError(404, MENSAJE_NO_ENCONTRADO));
}

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(estado?: EstadoUsuario) {
    return this.prisma.usuario.findMany({
      where: { rol: 'RECEPCIONISTA', estado },
      select: CAMPOS_RECEPCIONISTA,
      orderBy: [{ nombres: 'asc' }, { apellidos: 'asc' }],
    });
  }

  async crear(datos: CrearRecepcionistaDto, adminId: number) {
    const { contrasena, ...campos } = datos;
    await this.verificarDuplicados(campos);
    const passwordHash = await hash(contrasena, COSTO_HASH);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const recepcionista = await tx.usuario.create({
          data: {
            ...campos,
            passwordHash,
            rol: 'RECEPCIONISTA',
            creadoPorId: adminId,
          },
          select: CAMPOS_RECEPCIONISTA,
        });
        await this.auditoria.registrar(
          {
            usuarioId: adminId,
            accion: 'CREAR',
            entidad: ENTIDAD,
            entidadId: recepcionista.id,
            detalle: { nuevo: { ...campos } },
          },
          tx,
        );
        return recepcionista;
      });
    } catch (error) {
      throw await this.traducirDuplicado(error, campos);
    }
  }

  async registrarJugador(datos: RegistrarJugadorDto) {
    const { contrasena, ...campos } = datos;
    await this.verificarDuplicados(campos);
    const passwordHash = await hash(contrasena, COSTO_HASH);

    try {
      return await this.prisma.usuario.create({
        data: { ...campos, passwordHash, rol: 'JUGADOR', estado: 'ACTIVO' },
        select: CAMPOS_JUGADOR,
      });
    } catch (error) {
      throw await this.traducirDuplicado(error, campos);
    }
  }

  async editar(id: number, datos: EditarRecepcionistaDto, adminId: number) {
    const actual = await this.buscar(id);
    if (datos.correo !== undefined && datos.correo !== actual.correo) {
      await this.verificarDuplicados({ correo: datos.correo }, id);
    }

    const cambios = {
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      telefono: datos.telefono,
      correo: datos.correo,
    };
    const detalle = detalleCambios(actual, cambios);
    if (!detalle) return actual;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const recepcionista = await tx.usuario.update({
          where: { id },
          data: cambios,
          select: CAMPOS_RECEPCIONISTA,
        });
        await this.auditoria.registrar(
          {
            usuarioId: adminId,
            accion: 'EDITAR',
            entidad: ENTIDAD,
            entidadId: id,
            detalle,
          },
          tx,
        );
        return recepcionista;
      });
    } catch (error) {
      throw await this.traducirDuplicado(error, { correo: datos.correo }, id);
    }
  }

  async cambiarEstado(id: number, estado: EstadoUsuario, adminId: number) {
    const actual = await this.buscar(id);
    if (actual.estado === estado) return actual;

    return this.prisma.$transaction(async (tx) => {
      const recepcionista = await tx.usuario.update({
        where: { id },
        data: { estado },
        select: CAMPOS_RECEPCIONISTA,
      });
      await this.auditoria.registrar(
        {
          usuarioId: adminId,
          accion: estado === 'INACTIVO' ? 'DESACTIVAR' : 'ACTIVAR',
          entidad: ENTIDAD,
          entidadId: id,
          detalle: detalleCambios(actual, { estado }),
        },
        tx,
      );
      return recepcionista;
    });
  }

  async restablecerContrasena(id: number, contrasena: string, adminId: number) {
    await this.buscar(id);
    const passwordHash = await hash(contrasena, COSTO_HASH);

    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id }, data: { passwordHash } });
      await this.auditoria.registrar(
        {
          usuarioId: adminId,
          accion: 'RESTABLECER_CONTRASENA',
          entidad: ENTIDAD,
          entidadId: id,
        },
        tx,
      );
    });
  }

  private async buscar(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > ID_MAXIMO) throw noEncontrado();
    const recepcionista = await this.prisma.usuario.findFirst({
      where: { id, rol: 'RECEPCIONISTA' },
      select: CAMPOS_RECEPCIONISTA,
    });
    if (!recepcionista) throw noEncontrado();
    return recepcionista;
  }

  private async verificarDuplicados(datos: Duplicables, excluirId?: number) {
    const errores: Record<string, string> = {};
    const otroUsuario = excluirId ? { id: { not: excluirId } } : {};

    if (datos.correo) {
      const existe = await this.prisma.usuario.findFirst({
        where: { correo: datos.correo, ...otroUsuario },
        select: { id: true },
      });
      if (existe) errores.correo = MENSAJE_CORREO_DUPLICADO;
    }
    if (datos.tipoDocumento && datos.numeroDocumento) {
      const existe = await this.prisma.usuario.findFirst({
        where: {
          tipoDocumento: datos.tipoDocumento,
          numeroDocumento: datos.numeroDocumento,
          ...otroUsuario,
        },
        select: { id: true },
      });
      if (existe) errores.numeroDocumento = MENSAJE_DOCUMENTO_DUPLICADO;
    }

    const mensajes = Object.values(errores);
    if (mensajes.length > 0) {
      throw new ConflictException(cuerpoError(409, mensajes[0], errores));
    }
  }

  private async traducirDuplicado(
    error: unknown,
    datos: Duplicables,
    excluirId?: number,
  ) {
    if (!esDuplicado(error)) return error;
    try {
      await this.verificarDuplicados(datos, excluirId);
    } catch (conflicto) {
      return conflicto;
    }
    return new ConflictException(cuerpoError(409, MENSAJE_DUPLICADO));
  }
}
