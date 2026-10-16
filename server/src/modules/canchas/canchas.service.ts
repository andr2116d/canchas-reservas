import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { cuerpoError } from '../../common/errores';
import { Reloj } from '../../common/reloj/reloj';
import type { Prisma } from '../../generated/prisma/client';
import {
  Franja,
  type EstadoReserva,
  type Rol,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { detalleCambios } from '../auditoria/detalle-cambios';
import { TurnosGateway } from '../tiempo-real/turnos.gateway';
import { CambiarActivaDto } from './dto/cambiar-activa.dto';
import { CrearCanchaDto } from './dto/crear-cancha.dto';
import { EditarCanchaDto } from './dto/editar-cancha.dto';

export const MENSAJE_NOMBRE_DUPLICADO = 'Ya existe una cancha con ese nombre';
export const MENSAJE_NO_ENCONTRADA = 'No se encontró la cancha';
export const MENSAJE_CONFIRMAR_DESACTIVAR =
  'La cancha tiene reservas futuras. Confirma para desactivarla igual';
export const MENSAJE_ELIMINAR_CON_FUTURAS =
  'La cancha tiene reservas futuras, solo se puede desactivar';
export const MENSAJE_CON_HISTORIAL =
  'Tiene historial, solo se puede desactivar';

const ENTIDAD = 'CANCHA';
const ID_MAXIMO = 2147483647;
export const ESTADOS_RESERVA_FUTURA: EstadoReserva[] = [
  'PENDIENTE_PAGO',
  'PENDIENTE_VALIDACION',
  'CONFIRMADA',
];

const CAMPOS_CANCHA = {
  id: true,
  nombre: true,
  tamano: true,
  iluminacion: true,
  estado: true,
  activa: true,
  tarifas: { where: { vigenteHasta: null }, select: { franja: true } },
} satisfies Prisma.CanchaSelect;

type CanchaConTarifas = Prisma.CanchaGetPayload<{
  select: typeof CAMPOS_CANCHA;
}>;

type Cliente = Prisma.TransactionClient | PrismaService;

function aRespuesta({ tarifas, ...cancha }: CanchaConTarifas) {
  const conTarifa = new Set(tarifas.map((tarifa) => tarifa.franja));
  return {
    ...cancha,
    tieneTarifas: conTarifa.size > 0,
    franjasSinTarifa: Object.values(Franja).filter(
      (franja) => !conTarifa.has(franja),
    ),
  };
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

function noEncontrada() {
  return new NotFoundException(cuerpoError(404, MENSAJE_NO_ENCONTRADA));
}

function conReservasFuturas(
  message: string,
  reservasFuturas: Awaited<ReturnType<CanchasService['reservasFuturas']>>,
) {
  return new ConflictException({
    ...cuerpoError(409, message),
    reservasFuturas,
  });
}

@Injectable()
export class CanchasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly gateway: TurnosGateway,
    private readonly reloj: Reloj,
  ) {}

  async listar(rol: Rol) {
    const canchas = await this.prisma.cancha.findMany({
      where: rol === 'ADMINISTRADOR' ? undefined : { activa: true },
      select: CAMPOS_CANCHA,
      orderBy: { nombre: 'asc' },
    });
    return canchas.map(aRespuesta);
  }

  async crear(datos: CrearCanchaDto, usuarioId: number) {
    const campos = {
      nombre: datos.nombre,
      tamano: datos.tamano,
      iluminacion: datos.iluminacion,
    };
    let creada: ReturnType<typeof aRespuesta>;
    try {
      creada = await this.prisma.$transaction(async (tx) => {
        const cancha = await tx.cancha.create({
          data: campos,
          select: CAMPOS_CANCHA,
        });
        await this.auditoria.registrar(
          {
            usuarioId,
            accion: 'CREAR',
            entidad: ENTIDAD,
            entidadId: cancha.id,
            detalle: {
              nuevo: {
                ...campos,
                estado: cancha.estado,
                activa: cancha.activa,
              },
            },
          },
          tx,
        );
        return aRespuesta(cancha);
      });
    } catch (error) {
      if (codigoError(error) === 'P2002') throw nombreDuplicado();
      throw error;
    }
    this.gateway.notificar(null, creada.id);
    return creada;
  }

  async editar(id: number, datos: EditarCanchaDto, usuarioId: number) {
    const actual = await this.buscar(id);
    const cambios = {
      nombre: datos.nombre,
      tamano: datos.tamano,
      iluminacion: datos.iluminacion,
      estado: datos.estado,
    };
    const detalle = detalleCambios(actual, cambios);
    if (!detalle) return aRespuesta(actual);

    let editada: ReturnType<typeof aRespuesta>;
    try {
      editada = await this.prisma.$transaction(async (tx) => {
        const cancha = await tx.cancha.update({
          where: { id },
          data: cambios,
          select: CAMPOS_CANCHA,
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
        return aRespuesta(cancha);
      });
    } catch (error) {
      if (codigoError(error) === 'P2002') throw nombreDuplicado();
      throw error;
    }
    this.gateway.notificar(null, id);
    return editada;
  }

  async cambiarActiva(
    id: number,
    { activa, confirmar }: CambiarActivaDto,
    usuarioId: number,
  ) {
    const actual = await this.buscar(id);
    if (actual.activa === activa) return aRespuesta(actual);

    const cambiada = await this.prisma.$transaction(async (tx) => {
      if (!activa && confirmar !== true) {
        const reservasFuturas = await this.reservasFuturas(id, tx);
        if (reservasFuturas.length > 0) {
          throw conReservasFuturas(
            MENSAJE_CONFIRMAR_DESACTIVAR,
            reservasFuturas,
          );
        }
      }
      const cancha = await tx.cancha.update({
        where: { id },
        data: { activa },
        select: CAMPOS_CANCHA,
      });
      await this.auditoria.registrar(
        {
          usuarioId,
          accion: activa ? 'ACTIVAR' : 'DESACTIVAR',
          entidad: ENTIDAD,
          entidadId: id,
          detalle: detalleCambios(actual, { activa }),
        },
        tx,
      );
      return aRespuesta(cancha);
    });
    this.gateway.notificar(null, id);
    return cambiada;
  }

  async eliminar(id: number, usuarioId: number) {
    const actual = await this.buscar(id);

    try {
      await this.prisma.$transaction(async (tx) => {
        const tieneReservas = await tx.reserva.findFirst({
          where: { canchaId: id },
          select: { id: true },
        });
        if (tieneReservas) {
          const reservasFuturas = await this.reservasFuturas(id, tx);
          if (reservasFuturas.length > 0) {
            throw conReservasFuturas(
              MENSAJE_ELIMINAR_CON_FUTURAS,
              reservasFuturas,
            );
          }
          throw new ConflictException(cuerpoError(409, MENSAJE_CON_HISTORIAL));
        }

        const tarifas = await tx.tarifa.deleteMany({ where: { canchaId: id } });
        const bloqueos = await tx.bloqueo.deleteMany({
          where: { canchaId: id },
        });
        await tx.cancha.delete({ where: { id } });
        const { tarifas: _tarifas, ...anterior } = actual;
        await this.auditoria.registrar(
          {
            usuarioId,
            accion: 'ELIMINAR',
            entidad: ENTIDAD,
            entidadId: id,
            detalle: {
              anterior,
              tarifasBorradas: tarifas.count,
              bloqueosBorrados: bloqueos.count,
            },
          },
          tx,
        );
      });
    } catch (error) {
      if (codigoError(error) === 'P2003') {
        throw new ConflictException(cuerpoError(409, MENSAJE_CON_HISTORIAL));
      }
      throw error;
    }
    this.gateway.notificar(null, id);
  }

  async reservasFuturas(canchaId: number, cliente: Cliente = this.prisma) {
    const reservas = await cliente.reserva.findMany({
      where: {
        canchaId,
        estado: { in: ESTADOS_RESERVA_FUTURA },
        inicioEn: { gt: this.reloj.ahora() },
      },
      select: {
        id: true,
        codigo: true,
        fecha: true,
        horaInicio: true,
        jugador: { select: { nombres: true, apellidos: true } },
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
    });
    return reservas.map(({ jugador, fecha, ...reserva }) => ({
      ...reserva,
      fecha: fecha.toISOString().slice(0, 10),
      cliente: [jugador.nombres, jugador.apellidos].filter(Boolean).join(' '),
    }));
  }

  async buscar(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > ID_MAXIMO) {
      throw noEncontrada();
    }
    const cancha = await this.prisma.cancha.findUnique({
      where: { id },
      select: CAMPOS_CANCHA,
    });
    if (!cancha) throw noEncontrada();
    return cancha;
  }
}
