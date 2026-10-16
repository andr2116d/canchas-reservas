import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { cuerpoError } from '../../common/errores';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { detalleCambios } from '../auditoria/detalle-cambios';
import { aPrecio, precioANumero } from './precio-a-numero';
import { CrearAdicionalDto } from './dto/crear-adicional.dto';
import { EditarAdicionalDto } from './dto/editar-adicional.dto';

export const MENSAJE_NOMBRE_DUPLICADO = 'Ya existe un adicional con ese nombre';
export const MENSAJE_NO_ENCONTRADO = 'No se encontró el adicional';
export const MENSAJE_CON_CONSUMOS =
  'El adicional tiene consumos registrados, solo se puede desactivar';

const ENTIDAD = 'ADICIONAL';
const ID_MAXIMO = 2147483647;

const CAMPOS_ADICIONAL = {
  id: true,
  nombre: true,
  precio: true,
  activo: true,
} satisfies Prisma.AdicionalSelect;

type AdicionalGuardado = Prisma.AdicionalGetPayload<{
  select: typeof CAMPOS_ADICIONAL;
}>;

function aRespuesta({ precio, ...adicional }: AdicionalGuardado) {
  return { ...adicional, precio: precioANumero(precio) };
}

function codigoError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? error.code
    : undefined;
}

function nombreDuplicado() {
  return new ConflictException(
    cuerpoError(409, MENSAJE_NOMBRE_DUPLICADO, {
      nombre: MENSAJE_NOMBRE_DUPLICADO,
    }),
  );
}

function noEncontrado() {
  return new NotFoundException(cuerpoError(404, MENSAJE_NO_ENCONTRADO));
}

@Injectable()
export class AdicionalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async listar(activo?: boolean) {
    const adicionales = await this.prisma.adicional.findMany({
      where: activo === undefined ? undefined : { activo },
      select: CAMPOS_ADICIONAL,
      orderBy: { nombre: 'asc' },
    });
    return adicionales.map(aRespuesta);
  }

  async crear(datos: CrearAdicionalDto, usuarioId: number) {
    const campos = {
      nombre: datos.nombre,
      precio: aPrecio(datos.precio),
    };
    try {
      return await this.prisma.$transaction(async (tx) => {
        const adicional = await tx.adicional.create({
          data: campos,
          select: CAMPOS_ADICIONAL,
        });
        await this.auditoria.registrar(
          {
            usuarioId,
            accion: 'CREAR',
            entidad: ENTIDAD,
            entidadId: adicional.id,
            detalle: {
              nuevo: {
                ...campos,
                precio: precioANumero(campos.precio),
                activo: true,
              },
            },
          },
          tx,
        );
        return aRespuesta(adicional);
      });
    } catch (error) {
      if (codigoError(error) === 'P2002') throw nombreDuplicado();
      throw error;
    }
  }

  async editar(id: number, datos: EditarAdicionalDto, usuarioId: number) {
    const actual = await this.buscar(id);
    const cambios = {
      ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
      ...(datos.precio !== undefined ? { precio: aPrecio(datos.precio) } : {}),
    };
    const detalle = detalleCambios(
      { ...actual, precio: precioANumero(actual.precio) },
      {
        ...cambios,
        precio: cambios.precio ? precioANumero(cambios.precio) : undefined,
      },
    );
    if (!detalle) return aRespuesta(actual);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const adicional = await tx.adicional.update({
          where: { id },
          data: cambios,
          select: CAMPOS_ADICIONAL,
        });
        await this.auditoria.registrar(
          {
            usuarioId,
            accion: 'EDITAR',
            entidad: ENTIDAD,
            entidadId: id,
            detalle,
          },
          tx,
        );
        return aRespuesta(adicional);
      });
    } catch (error) {
      if (codigoError(error) === 'P2002') throw nombreDuplicado();
      throw error;
    }
  }

  async cambiarEstado(id: number, activo: boolean, usuarioId: number) {
    const actual = await this.buscar(id);
    if (actual.activo === activo) return aRespuesta(actual);

    return this.prisma.$transaction(async (tx) => {
      const adicional = await tx.adicional.update({
        where: { id },
        data: { activo },
        select: CAMPOS_ADICIONAL,
      });
      await this.auditoria.registrar(
        {
          usuarioId,
          accion: activo ? 'ACTIVAR' : 'DESACTIVAR',
          entidad: ENTIDAD,
          entidadId: id,
          detalle: detalleCambios(actual, { activo }),
        },
        tx,
      );
      return aRespuesta(adicional);
    });
  }

  async eliminar(id: number, usuarioId: number) {
    const actual = await this.buscar(id);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.adicional.delete({ where: { id } });
        const { precio, ...anterior } = actual;
        await this.auditoria.registrar(
          {
            usuarioId,
            accion: 'ELIMINAR',
            entidad: ENTIDAD,
            entidadId: id,
            detalle: {
              anterior: { ...anterior, precio: precioANumero(precio) },
            },
          },
          tx,
        );
      });
    } catch (error) {
      if (codigoError(error) === 'P2003') {
        throw new ConflictException(cuerpoError(409, MENSAJE_CON_CONSUMOS));
      }
      throw error;
    }
  }

  private async buscar(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > ID_MAXIMO) {
      throw noEncontrado();
    }
    const adicional = await this.prisma.adicional.findUnique({
      where: { id },
      select: CAMPOS_ADICIONAL,
    });
    if (!adicional) throw noEncontrado();
    return adicional;
  }
}
