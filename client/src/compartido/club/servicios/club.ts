import type { Caracteristica } from "@/compartido/canchas/caracteristicas";
import type { TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";

export interface CanchaDelClub {
  id: number;
  nombre: string;
  tipo: TipoDeCancha;
  tieneIluminacion: boolean;
  caracteristicas: Caracteristica[];
  nota: string | null;
}

export interface TarifaDelClub {
  tipo: TipoDeCancha;
  precioDia: string;
  precioNoche: string;
  duracionDelTurnoHoras: number;
}

export type DiaDeLaSemana = "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO" | "DOMINGO";

export interface DiaDelClub {
  dia: DiaDeLaSemana;
  abre: string;
  cierra: string;
  inicioDeLaNoche: string;
}

export interface RangoDeCancelacion {
  desdeHoras: number;
  porcentaje: number;
  ofreceCredito: boolean;
}

/** Lo que cualquiera puede saber del club. Lo que administración no guardó viene vacío. */
export interface ClubPublico {
  canchas: CanchaDelClub[];
  tarifas: TarifaDelClub[];
  horario: { dias: DiaDelClub[] } | null;
  adelanto: number | null;
  cancelacion: RangoDeCancelacion[] | null;
  adicionales: { nombre: string; descripcion: string | null; precio: string }[];
}
