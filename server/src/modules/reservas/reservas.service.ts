import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { cuerpoError } from '../../common/errores';
import {
  fechaEnLima,
  instanteEnLima,
  sumarDias,
} from '../../common/fechas-lima';
import { Reloj } from '../../common/reloj/reloj';
import { Prisma } from '../../generated/prisma/client';
import type { Franja } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ESTADOS_RESERVA_FUTURA } from '../canchas/canchas.service';
import { ReglaCancelacionService } from '../regla-cancelacion/regla-cancelacion.service';
import { aNumero } from '../tarifas/calculo-tarifa';
import { TarifasService } from '../tarifas/tarifas.service';
import { TurnosService } from '../turnos/turnos.service';
import { generarCodigo } from './codigo-reserva';
import { CrearReservaDto } from './dto/crear-reserva.dto';
import { TurnoReservaDto } from './dto/turno-reserva.dto';
import { calcularVenceEn, minutosParaPagar } from './vencimiento-reserva';

export const DIAS_MAXIMOS_ANTICIPACION = 30;
export const LIMITE_PENDIENTES = 2;
const ID_CONFIGURACION = 1;
const ENTIDAD = 'RESERVA';
const OPCIONES_TRANSACCION = { maxWait: 15000, timeout: 15000 };

export const MENSAJES_RESERVA = {
  jugadorInactivo: 'Solo un jugador activo puede reservar',
  turnoPasado: 'El turno ya pasó',
  fueraDeRango: `Solo puedes reservar desde hoy hasta dentro de ${DIAS_MAXIMOS_ANTICIPACION} días`,
  canchaNoEncontrada: 'No se encontró la cancha',
  canchaDesactivada: 'La cancha está desactivada',
  canchaEnMantenimiento: 'La cancha está en mantenimiento',
  fueraDeHorario: 'El turno está fuera del horario operativo',
  sinTarifa: 'La cancha no tiene tarifa para esa franja',
  limitePendientes: `Ya tienes ${LIMITE_PENDIENTES} reservas pendientes de pago`,
  turnoNoDisponible: 'El turno ya no está disponible',
} as const;

type Cliente = Prisma.TransactionClient | PrismaService;

const INDICE_TURNO = 'reserva_turno_unico';
const INDICE_CODIGO = 'reserva_codigo_key';
export const INTENTOS_CODIGO = 5;

export function indiceUnicoViolado(error: unknown) {
  if (typeof error !== 'object' || error === null) return undefined;
  const { code, meta } = error as {
    code?: string;
    meta?: {
      driverAdapterError?: { cause?: { constraint?: { index?: string } } };
    };
  };
  if (code !== 'P2002') return undefined;
  return meta?.driverAdapterError?.cause?.constraint?.index;
}

export function turnoNoDisponible() {
  return new ConflictException(
    cuerpoError(409, MENSAJES_RESERVA.turnoNoDisponible, {
      horaInicio: MENSAJES_RESERVA.turnoNoDisponible,
    }),
  );
}

function rechazo(mensaje: string, campo?: string) {
  return new BadRequestException(
    cuerpoError(400, mensaje, campo ? { [campo]: mensaje } : {}),
  );
}

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reloj: Reloj,
    private readonly turnos: TurnosService,
    private readonly tarifas: TarifasService,
    private readonly regla: ReglaCancelacionService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async crear(jugadorId: number, datos: CrearReservaDto) {
    for (let intento = 1; ; intento++) {
      try {
        return await this.prisma.$transaction(
          (tx) => this.crearEn(tx, jugadorId, datos),
          OPCIONES_TRANSACCION,
        );
      } catch (error) {
        const indice = indiceUnicoViolado(error);
        if (indice === INDICE_TURNO) throw turnoNoDisponible();
        if (indice === INDICE_CODIGO && intento < INTENTOS_CODIGO) continue;
        throw error;
      }
    }
  }

  private async crearEn(
    tx: Prisma.TransactionClient,
    jugadorId: number,
    datos: CrearReservaDto,
  ) {
    await tx.$queryRaw`SELECT id FROM usuario WHERE id = ${jugadorId} FOR UPDATE`;
    const ahora = this.reloj.ahora();
    const turno = await this.validar(jugadorId, datos, ahora, tx);
    const { tiempoLimitePagoMin } = await this.configuracion(tx);
    const regla = await this.regla.obtenerVigente(tx);
    const reserva = await tx.reserva.create({
      data: {
        codigo: generarCodigo(),
        jugadorId,
        creadoPorId: jugadorId,
        origen: 'PLATAFORMA',
        canchaId: turno.cancha.id,
        fecha: new Date(`${turno.fecha}T00:00:00.000Z`),
        horaInicio: turno.horaInicio,
        horaFin: turno.horaFin,
        franja: turno.franja,
        inicioEn: turno.inicioEn,
        finEn: turno.finEn,
        valorTurno: turno.valor.valor,
        adelantoMinimo: turno.valor.adelanto,
        estado: 'PENDIENTE_PAGO',
        venceEn: calcularVenceEn(ahora, tiempoLimitePagoMin, turno.inicioEn),
        reglaHorasAnticipacion: regla.horasAnticipacion,
        reglaTipoCompensacion: regla.tipoCompensacion,
        creadoEn: ahora,
      },
      select: { id: true, codigo: true, estado: true, venceEn: true },
    });
    await this.auditoria.registrar(
      {
        usuarioId: jugadorId,
        accion: 'CREAR',
        entidad: ENTIDAD,
        entidadId: reserva.id,
        detalle: {
          codigo: reserva.codigo,
          canchaId: turno.cancha.id,
          fecha: turno.fecha,
          horaInicio: turno.horaInicio,
          valorTurno: aNumero(turno.valor.valor),
          adelantoMinimo: aNumero(turno.valor.adelanto),
        },
      },
      tx,
    );
    return reserva;
  }

  async resumen(jugadorId: number, datos: TurnoReservaDto) {
    const ahora = this.reloj.ahora();
    const turno = await this.validar(jugadorId, datos, ahora);
    const { tiempoLimitePagoMin } = await this.configuracion(this.prisma);
    const regla = await this.regla.obtenerVigente();
    const credito = await this.creditoDisponible(jugadorId, this.prisma);
    return {
      cancha: turno.cancha,
      fecha: turno.fecha,
      horaInicio: turno.horaInicio,
      horaFin: turno.horaFin,
      franja: turno.franja,
      valorTurno: aNumero(turno.valor.valor),
      adelanto: aNumero(turno.valor.adelanto),
      saldo: aNumero(turno.valor.valor.minus(turno.valor.adelanto)),
      creditoDisponible: aNumero(credito),
      minutosParaPagar: minutosParaPagar(
        ahora,
        tiempoLimitePagoMin,
        turno.inicioEn,
      ),
      regla: {
        horasAnticipacion: regla.horasAnticipacion,
        tipoCompensacion: regla.tipoCompensacion,
        plazoLimite: this.regla
          .plazoLimite(turno.fecha, turno.horaInicio, regla.horasAnticipacion)
          .toISOString(),
      },
    };
  }

  async mias(jugadorId: number) {
    const ahora = this.reloj.ahora();
    const reservas = await this.prisma.reserva.findMany({
      where: { jugadorId },
      select: {
        id: true,
        codigo: true,
        fecha: true,
        horaInicio: true,
        horaFin: true,
        franja: true,
        estado: true,
        venceEn: true,
        inicioEn: true,
        finEn: true,
        cancha: { select: { id: true, nombre: true, tamano: true } },
      },
      orderBy: [{ inicioEn: 'asc' }, { id: 'asc' }],
    });
    const proximas = reservas.filter((r) => r.finEn > ahora);
    const pasadas = reservas.filter((r) => r.finEn <= ahora).reverse();
    return [...proximas, ...pasadas].map(
      ({ fecha, inicioEn: _inicioEn, finEn: _finEn, ...reserva }) => ({
        ...reserva,
        fecha: fecha.toISOString().slice(0, 10),
      }),
    );
  }

  async creditoDisponible(jugadorId: number, cliente: Cliente) {
    const { _sum } = await cliente.credito.aggregate({
      where: { jugadorId, saldo: { gt: 0 } },
      _sum: { saldo: true },
    });
    return _sum.saldo ?? new Prisma.Decimal(0);
  }

  private configuracion(cliente: Cliente) {
    return cliente.configuracion.findUniqueOrThrow({
      where: { id: ID_CONFIGURACION },
      select: { tiempoLimitePagoMin: true },
    });
  }

  async validar(
    jugadorId: number,
    datos: TurnoReservaDto,
    ahora: Date,
    cliente: Cliente = this.prisma,
  ) {
    await this.validarJugador(jugadorId, cliente);
    const inicioEn = this.validarFecha(datos, ahora);
    const cancha = await this.validarCancha(datos.canchaId, cliente);
    const turno = await this.validarTurno(datos, cliente);
    const valor = await this.validarTarifa(cancha.id, turno.franja, cliente);
    await this.validarPendientes(jugadorId, cliente);
    await this.validarTurnoLibre(datos, cliente);
    return {
      cancha,
      ...turno,
      fecha: datos.fecha,
      inicioEn,
      finEn: instanteEnLima(datos.fecha, turno.horaFin),
      valor,
    };
  }

  private async validarJugador(jugadorId: number, cliente: Cliente) {
    const jugador = await cliente.usuario.findUnique({
      where: { id: jugadorId },
      select: { rol: true, estado: true },
    });
    if (jugador?.rol !== 'JUGADOR' || jugador.estado !== 'ACTIVO') {
      throw rechazo(MENSAJES_RESERVA.jugadorInactivo);
    }
  }

  private validarFecha({ fecha, horaInicio }: TurnoReservaDto, ahora: Date) {
    const inicioEn = instanteEnLima(fecha, horaInicio);
    if (inicioEn <= ahora) {
      throw rechazo(MENSAJES_RESERVA.turnoPasado, 'horaInicio');
    }
    const limite = sumarDias(fechaEnLima(ahora), DIAS_MAXIMOS_ANTICIPACION);
    if (fecha > limite) {
      throw rechazo(MENSAJES_RESERVA.fueraDeRango, 'fecha');
    }
    return inicioEn;
  }

  private async validarCancha(canchaId: number, cliente: Cliente) {
    const cancha = await cliente.cancha.findUnique({
      where: { id: canchaId },
      select: {
        id: true,
        nombre: true,
        tamano: true,
        activa: true,
        estado: true,
      },
    });
    if (!cancha) {
      throw rechazo(MENSAJES_RESERVA.canchaNoEncontrada, 'canchaId');
    }
    if (!cancha.activa) {
      throw rechazo(MENSAJES_RESERVA.canchaDesactivada, 'canchaId');
    }
    if (cancha.estado !== 'OPERATIVA') {
      throw rechazo(MENSAJES_RESERVA.canchaEnMantenimiento, 'canchaId');
    }
    return { id: cancha.id, nombre: cancha.nombre, tamano: cancha.tamano };
  }

  private async validarTurno(
    { fecha, horaInicio }: TurnoReservaDto,
    cliente: Cliente,
  ) {
    const turnos = await this.turnos.generar(fecha, cliente);
    const turno = turnos.find((t) => t.horaInicio === horaInicio);
    if (!turno) throw rechazo(MENSAJES_RESERVA.fueraDeHorario, 'horaInicio');
    return turno;
  }

  private async validarTarifa(
    canchaId: number,
    franja: Franja,
    cliente: Cliente,
  ) {
    const valor = await this.tarifas.calcularTurno(canchaId, franja, cliente);
    if (!valor) throw rechazo(MENSAJES_RESERVA.sinTarifa, 'canchaId');
    return valor;
  }

  private async validarPendientes(jugadorId: number, cliente: Cliente) {
    const pendientes = await cliente.reserva.count({
      where: { jugadorId, estado: 'PENDIENTE_PAGO' },
    });
    if (pendientes >= LIMITE_PENDIENTES) {
      throw new ConflictException(
        cuerpoError(409, MENSAJES_RESERVA.limitePendientes),
      );
    }
  }

  private async validarTurnoLibre(
    { canchaId, fecha, horaInicio }: TurnoReservaDto,
    cliente: Cliente,
  ) {
    const tomada = await cliente.reserva.findFirst({
      where: {
        canchaId,
        fecha: new Date(`${fecha}T00:00:00.000Z`),
        horaInicio,
        estado: { in: ESTADOS_RESERVA_FUTURA },
      },
      select: { id: true },
    });
    if (tomada) throw turnoNoDisponible();
  }
}
