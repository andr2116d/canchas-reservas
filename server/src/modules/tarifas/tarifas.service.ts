import { Injectable, NotFoundException } from '@nestjs/common';
import { cuerpoError } from '../../common/errores';
import { Prisma } from '../../generated/prisma/client';
import type { Franja } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { detalleCambios } from '../auditoria/detalle-cambios';
import { aNumero } from './calculo-tarifa';
import { DefinirTarifaDto } from './dto/definir-tarifa.dto';

export const MENSAJE_CANCHA_NO_ENCONTRADA = 'No se encontró la cancha';

const ENTIDAD = 'TARIFA';
const ID_MAXIMO = 2147483647;

const CAMPOS_TARIFA = {
  id: true,
  franja: true,
  valor: true,
  vigenteDesde: true,
  vigenteHasta: true,
} satisfies Prisma.TarifaSelect;

type TarifaGuardada = Prisma.TarifaGetPayload<{
  select: typeof CAMPOS_TARIFA;
}>;

function aVigente(tarifa: TarifaGuardada | undefined) {
  if (!tarifa) return null;
  return { valor: aNumero(tarifa.valor), vigenteDesde: tarifa.vigenteDesde };
}

function aRespuesta(tarifa: TarifaGuardada) {
  return { franja: tarifa.franja, ...aVigente(tarifa) };
}

function aHistorial(tarifa: TarifaGuardada) {
  return { ...tarifa, valor: aNumero(tarifa.valor) };
}

function canchaNoEncontrada() {
  return new NotFoundException(cuerpoError(404, MENSAJE_CANCHA_NO_ENCONTRADA));
}

@Injectable()
export class TarifasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async obtener(canchaId: number) {
    await this.verificarCancha(canchaId);
    const tarifas = await this.prisma.tarifa.findMany({
      where: { canchaId },
      select: CAMPOS_TARIFA,
      orderBy: [{ vigenteDesde: 'desc' }, { id: 'desc' }],
    });
    const vigente = (franja: Franja) =>
      tarifas.find((t) => t.franja === franja && t.vigenteHasta === null);
    return {
      dia: aVigente(vigente('DIA')),
      noche: aVigente(vigente('NOCHE')),
      historial: tarifas.map(aHistorial),
    };
  }

  async definir(
    canchaId: number,
    { franja, valor }: DefinirTarifaDto,
    usuarioId: number,
  ) {
    await this.verificarCancha(canchaId);
    const nuevoValor = new Prisma.Decimal(valor).toDecimalPlaces(2);

    return this.prisma.$transaction(async (tx) => {
      const vigente = await tx.tarifa.findFirst({
        where: { canchaId, franja, vigenteHasta: null },
        select: CAMPOS_TARIFA,
      });
      if (vigente?.valor.equals(nuevoValor)) return aRespuesta(vigente);

      const ahora = new Date();
      if (vigente) {
        await tx.tarifa.update({
          where: { id: vigente.id },
          data: { vigenteHasta: ahora },
        });
      }
      const nueva = await tx.tarifa.create({
        data: {
          canchaId,
          franja,
          valor: nuevoValor,
          vigenteDesde: ahora,
          creadoPorId: usuarioId,
        },
        select: CAMPOS_TARIFA,
      });
      await this.auditoria.registrar(
        {
          usuarioId,
          accion: vigente ? 'EDITAR' : 'CREAR',
          entidad: ENTIDAD,
          entidadId: nueva.id,
          detalle: {
            canchaId,
            franja,
            ...detalleCambios(
              { valor: vigente ? aNumero(vigente.valor) : null },
              { valor: aNumero(nueva.valor) },
            ),
          },
        },
        tx,
      );
      return aRespuesta(nueva);
    });
  }

  private async verificarCancha(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > ID_MAXIMO) {
      throw canchaNoEncontrada();
    }
    const cancha = await this.prisma.cancha.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!cancha) throw canchaNoEncontrada();
  }
}
