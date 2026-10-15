import { Injectable, NotFoundException } from '@nestjs/common';
import { cuerpoError } from '../../common/errores';
import { Prisma } from '../../generated/prisma/client';
import type { Franja } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { aNumero } from './calculo-tarifa';

export const MENSAJE_CANCHA_NO_ENCONTRADA = 'No se encontró la cancha';

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

function aHistorial(tarifa: TarifaGuardada) {
  return { ...tarifa, valor: aNumero(tarifa.valor) };
}

function canchaNoEncontrada() {
  return new NotFoundException(cuerpoError(404, MENSAJE_CANCHA_NO_ENCONTRADA));
}

@Injectable()
export class TarifasService {
  constructor(private readonly prisma: PrismaService) {}

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
