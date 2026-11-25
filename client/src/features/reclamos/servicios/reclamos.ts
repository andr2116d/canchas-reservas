import type { TipoDocumento } from "@/compartido/formulario/reglas-de-datos-personales";

export type TipoDeHoja = "RECLAMO" | "QUEJA";
export type EstadoDeHoja = "NUEVA" | "EN_ATENCION" | "RESPONDIDA";
export type MedioDeRespuesta = "CORREO" | "CARTA";
export type Motivo =
  | "RESERVA_Y_PAGO"
  | "CANCELACION_Y_DEVOLUCION"
  | "ESTADO_DE_LA_CANCHA"
  | "ATENCION_DEL_PERSONAL"
  | "MATERIAL_ADICIONAL"
  | "WEB_Y_CUENTA"
  | "OTRO";

export const ESTADOS_DEL_FILTRO = ["POR_RESPONDER", "VENCIDAS", "NUEVA", "EN_ATENCION", "RESPONDIDA", "TODAS"] as const;
export type EstadoDelFiltro = (typeof ESTADOS_DEL_FILTRO)[number];

export const NOMBRE_DEL_FILTRO: Record<EstadoDelFiltro, string> = {
  POR_RESPONDER: "Por responder",
  VENCIDAS: "Vencidas",
  NUEVA: "Nuevas",
  EN_ATENCION: "En atención",
  RESPONDIDA: "Respondidas",
  TODAS: "Todas",
};

export const NOMBRE_DEL_MOTIVO: Record<Motivo, string> = {
  RESERVA_Y_PAGO: "Reserva y pago",
  CANCELACION_Y_DEVOLUCION: "Cancelación y devolución",
  ESTADO_DE_LA_CANCHA: "Estado de la cancha",
  ATENCION_DEL_PERSONAL: "Atención del personal",
  MATERIAL_ADICIONAL: "Material adicional",
  WEB_Y_CUENTA: "Web y cuenta",
  OTRO: "Otro",
};

/** Lo común a una fila de la lista y a la hoja completa: estado y plazo. */
interface EstadoYPlazo {
  numero: string;
  tipo: TipoDeHoja;
  tipoMarcado: TipoDeHoja;
  motivo: Motivo | null;
  estado: EstadoDeHoja;
  medioDeRespuesta: MedioDeRespuesta;
  registradaEn: string;
  fechaLimite: string;
  diasHabilesRestantes: number | null;
  vencida: boolean;
  respondidaEn: string | null;
  fueraDePlazo: boolean;
}

export interface FilaDeHoja extends EstadoYPlazo {
  nombre: string;
  resumen: string;
}

export interface PaginaDeHojas {
  hojas: FilaDeHoja[];
  total: number;
  conteos: Record<EstadoDelFiltro, number>;
  pagina: number;
  porPagina: number;
}

export interface CambioDeLaHoja {
  accion: "APERTURA" | "CLASIFICACION" | "CAMBIO_DE_TIPO" | "RESPUESTA";
  ejecutadoPor: string;
  ocurridoEn: string;
  detalle: Record<string, unknown> | null;
}

/** La hoja completa para atenderla, con los datos de quien reclamó. */
export interface HojaParaAtender extends EstadoYPlazo {
  consumidor: {
    documento: { tipo: TipoDocumento; numero: string };
    nombres: string;
    apellidos: string;
    domicilio: string;
    telefono: string;
    correo: string;
  };
  representante: { nombre: string; domicilio: string; telefono: string; correo: string } | null;
  servicio: { servicio: "RESERVA_DE_CANCHA" | "MATERIAL_ADICIONAL" | "OTRO"; montoReclamado: string | null; descripcion: string | null };
  detalle: string;
  pedido: string;
  abiertaEn: string | null;
  respuesta: { texto: string; respondidaEn: string; cartaEnviadaEl: string | null } | null;
  cambios: CambioDeLaHoja[];
}
