import type {
  MedioDeRespuesta,
  Servicio,
  TipoDeHoja,
} from '../dominio/opciones-de-la-hoja';

export const NOMBRE_DEL_TIPO: Record<TipoDeHoja, string> = {
  RECLAMO: 'Reclamo',
  QUEJA: 'Queja',
};

export const NOMBRE_DEL_SERVICIO: Record<Servicio, string> = {
  RESERVA_DE_CANCHA: 'Reserva de cancha',
  MATERIAL_ADICIONAL: 'Material adicional',
  OTRO: 'Otro',
};

export const NOMBRE_DEL_MEDIO: Record<MedioDeRespuesta, string> = {
  CORREO: 'por correo',
  CARTA: 'por carta a tu domicilio',
};

const FECHA_Y_HORA_DE_LIMA = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** «25/11/2026» y «10:00», en hora de Lima. */
export function fechaYHoraDeLima(momento: Date): {
  fecha: string;
  hora: string;
} {
  const partes = Object.fromEntries(
    FECHA_Y_HORA_DE_LIMA.formatToParts(momento).map((p) => [p.type, p.value]),
  );
  return {
    fecha: `${partes.day}/${partes.month}/${partes.year}`,
    hora: `${partes.hour}:${partes.minute}`,
  };
}

/** «2026-12-16» como «16/12/2026». */
export function fechaParaMostrar(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}
