import type { RangoDeCancelacion } from "../servicios/club";

export interface FilaDeLaRegla {
  cuando: string;
  devolucion: string;
}

const horas = (n: number) => (n === 1 ? "1 hora" : `${n} horas`);

function cuando(rango: RangoDeCancelacion, anterior: RangoDeCancelacion | undefined): string {
  if (!anterior) return rango.desdeHoras === 0 ? "En cualquier momento antes de empezar" : `${horas(rango.desdeHoras)} antes o más`;
  if (rango.desdeHoras === 0) return `Menos de ${horas(anterior.desdeHoras)} antes`;
  return `Entre ${horas(rango.desdeHoras)} y ${horas(anterior.desdeHoras)} antes`;
}

function devolucion({ porcentaje, ofreceCredito }: RangoDeCancelacion): string {
  if (porcentaje === 0) return "No se devuelve el adelanto";
  const credito = ofreceCredito ? ", en dinero o como crédito" : ", en dinero";
  return `${porcentaje} % del adelanto${credito}`;
}

/** La regla de cancelación como tabla de leer: de más a menos anticipación. */
export function reglaEnPalabras(rangos: RangoDeCancelacion[]): FilaDeLaRegla[] {
  const ordenados = [...rangos].sort((a, b) => b.desdeHoras - a.desdeHoras);
  return ordenados.map((rango, i) => ({ cuando: cuando(rango, ordenados[i - 1]), devolucion: devolucion(rango) }));
}
