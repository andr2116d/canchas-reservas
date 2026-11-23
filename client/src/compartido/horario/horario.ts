export const DIAS_DE_LA_SEMANA = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;

export type DiaDeLaSemana = (typeof DIAS_DE_LA_SEMANA)[number];

export const NOMBRE_DEL_DIA: Record<DiaDeLaSemana, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

export interface VistaDelDia {
  dia: DiaDeLaSemana;
  abierto: boolean;
  abre?: string;
  cierra?: string;
  /** Solo si el día tiene una hora de noche propia. */
  inicioDeLaNoche?: string;
}

export interface VistaDeHorario {
  inicioDeLaNoche: string;
  dias: VistaDelDia[];
  guardadoEn: string;
  guardadoPor: string;
}

/** Horario tal como lo devuelve la API: el vigente, sus versiones y la noche que se propone. */
export interface HorarioConsultado {
  vigente?: VistaDeHorario;
  historial: VistaDeHorario[];
  inicioDeLaNochePorDefecto: string;
}

/** Minutos desde la medianoche de una hora «HH:MM» (24:00 son 1440). */
export function minutosDe(hora: string): number {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

export function horaDe(minutos: number): string {
  const dosCifras = (numero: number) => String(numero).padStart(2, "0");
  return `${dosCifras(Math.floor(minutos / 60))}:${dosCifras(minutos % 60)}`;
}
