import type { TipoDocumento } from "@/compartido/formulario/reglas-de-datos-personales";

export type TipoDeHoja = "RECLAMO" | "QUEJA";
export type Servicio = "RESERVA_DE_CANCHA" | "MATERIAL_ADICIONAL" | "OTRO";
export type MedioDeRespuesta = "CORREO" | "CARTA";
export type EstadoDeHoja = "NUEVA" | "EN_ATENCION" | "RESPONDIDA";

/** Lo que se envía a la API: solo los campos del formato oficial. */
export interface DatosDeLaHoja {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  domicilio: string;
  telefono: string;
  correo: string;
  esMenorDeEdad: boolean;
  representanteNombre?: string;
  representanteDomicilio?: string;
  representanteTelefono?: string;
  representanteCorreo?: string;
  servicio: Servicio;
  montoReclamado?: string;
  descripcionDelServicio?: string;
  tipo: TipoDeHoja;
  detalle: string;
  pedido: string;
  medioDeRespuesta: MedioDeRespuesta;
}

export interface Proveedor {
  razonSocial: string | null;
  ruc: string | null;
  direccion: string | null;
}

export interface ServicioContratado {
  servicio: Servicio;
  montoReclamado: string | null;
  descripcion: string | null;
}

/** La constancia que devuelve la API al registrar la hoja. */
export interface Constancia {
  numero: string;
  codigo: string;
  registradaEn: string;
  fechaLimite: string;
  proveedor: Proveedor;
  hoja: {
    consumidor: {
      documento: { tipo: TipoDocumento; numero: string };
      nombres: string;
      apellidos: string;
      domicilio: string;
      telefono: string;
      correo: string;
    };
    representante: { nombre: string; domicilio: string; telefono: string; correo: string } | null;
    servicio: ServicioContratado;
    tipo: TipoDeHoja;
    detalle: string;
    pedido: string;
    medioDeRespuesta: MedioDeRespuesta;
  };
}

export interface Respuesta {
  texto: string;
  respondidaEn: string;
  cartaEnviadaEl: string | null;
}

/** Lo que ve quien sigue su hoja: estado, plazo y lo reclamado, sin sus datos personales. */
export interface Seguimiento {
  numero: string;
  tipo: TipoDeHoja;
  estado: EstadoDeHoja;
  registradaEn: string;
  fechaLimite: string;
  diasHabilesRestantes: number | null;
  medioDeRespuesta: MedioDeRespuesta;
  servicio: ServicioContratado;
  detalle: string;
  pedido: string;
  abiertaEn: string | null;
  respuesta: Respuesta | null;
}

export const NOMBRE_DEL_TIPO: Record<TipoDeHoja, string> = { RECLAMO: "Reclamo", QUEJA: "Queja" };

export const NOMBRE_DEL_SERVICIO: Record<Servicio, string> = {
  RESERVA_DE_CANCHA: "Reserva de cancha",
  MATERIAL_ADICIONAL: "Material adicional",
  OTRO: "Otro",
};

export const NOMBRE_DEL_MEDIO: Record<MedioDeRespuesta, string> = {
  CORREO: "por correo",
  CARTA: "por carta a tu domicilio",
};

export const NOMBRE_DEL_ESTADO: Record<EstadoDeHoja, string> = {
  NUEVA: "Recibida",
  EN_ATENCION: "En atención",
  RESPONDIDA: "Respondida",
};

const FECHA_DE_LIMA = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric" });
const HORA_DE_LIMA = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const DIA_DE_LA_SEMANA = new Intl.DateTimeFormat("es-PE", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });

/** «25/11/2026, 10:00», en hora de Lima. */
export function fechaYHora(momento: string): string {
  const fecha = new Date(momento);
  return `${FECHA_DE_LIMA.format(fecha)}, ${HORA_DE_LIMA.format(fecha)}`;
}

/** «2026-12-16» como «miércoles 16 de diciembre». */
export function diaLegible(fecha: string): string {
  return DIA_DE_LA_SEMANA.format(new Date(`${fecha}T12:00:00.000Z`));
}

/** «2026-12-16» como «16/12/2026». */
export function fechaCorta(fecha: string): string {
  return fecha.split("-").reverse().join("/");
}
