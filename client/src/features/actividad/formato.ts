import { fecha, moneda } from "@/lib/formato";
import type { Cambio, MotivoAcceso, RolUsuario, ValorCambio } from "./api";

type Tono = "exito" | "alerta" | "error" | "info" | "neutro";

export const ENTIDADES: Record<string, string> = {
  CANCHA: "Cancha",
  TARIFA: "Tarifa",
  HORARIO: "Horario",
  REGLA_CANCELACION: "Regla de cancelación",
  RESERVA: "Reserva",
  ADICIONAL: "Adicional",
  RECEPCIONISTA: "Recepcionista",
};

export const ACCIONES: Record<string, { etiqueta: string; tono: Tono }> = {
  CREAR: { etiqueta: "Creó", tono: "exito" },
  EDITAR: { etiqueta: "Editó", tono: "info" },
  ACTIVAR: { etiqueta: "Activó", tono: "exito" },
  DESACTIVAR: { etiqueta: "Desactivó", tono: "alerta" },
  ELIMINAR: { etiqueta: "Eliminó", tono: "error" },
  RESTABLECER_CONTRASENA: { etiqueta: "Restableció la contraseña", tono: "neutro" },
};

export const ROLES: Record<RolUsuario, string> = {
  ADMINISTRADOR: "Administrador",
  RECEPCIONISTA: "Recepcionista",
  JUGADOR: "Jugador",
};

export const MOTIVOS_ACCESO: Record<MotivoAcceso, string | null> = {
  OK: null,
  CREDENCIALES: "Credenciales incorrectas",
  INACTIVO: "Cuenta desactivada",
};

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const CAMPOS: Record<string, string> = {
  nombre: "Nombre",
  tamano: "Tamaño",
  iluminacion: "Iluminación",
  estado: "Estado",
  activa: "Activa",
  activo: "Activo",
  tarifasBorradas: "Tarifas borradas",
  bloqueosBorrados: "Bloqueos borrados",
  valor: "Valor",
  precio: "Precio",
  franja: "Franja",
  inicioNoche: "Inicio de noche",
  reservasFueraDeHorario: "Reservas fuera de horario",
  horasAnticipacion: "Horas de anticipación",
  tipoCompensacion: "Compensación",
  cancha: "Cancha",
  fecha: "Fecha",
  horaInicio: "Hora",
  valorTurno: "Valor del turno",
  adelantoMinimo: "Adelanto mínimo",
  creditoAplicado: "Crédito aplicado",
  nombres: "Nombres",
  apellidos: "Apellidos",
  tipoDocumento: "Tipo de documento",
  numeroDocumento: "Número de documento",
  correo: "Correo",
  telefono: "Teléfono",
};

const CAMPOS_DINERO = new Set(["valor", "precio", "valorTurno", "adelantoMinimo", "creditoAplicado", "monto", "importe"]);
const CAMPOS_ENUM = new Set(["estado", "tamano", "franja", "tipoCompensacion", "tipoDocumento"]);

const VALORES: Record<string, string> = {
  FUTBOL_5: "Fútbol 5",
  FUTBOL_7: "Fútbol 7",
  OPERATIVA: "Operativa",
  EN_MANTENIMIENTO: "En mantenimiento",
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  DIA: "Día",
  NOCHE: "Noche",
  DEVOLUCION: "Devolución",
  CREDITO: "Crédito",
  PENDIENTE_PAGO: "Pendiente de pago",
  PENDIENTE_VALIDACION: "Pendiente de validación",
  CONFIRMADA: "Confirmada",
  EN_JUEGO: "En juego",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada",
  AUSENTE: "Ausente",
};

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function legible(codigo: string) {
  if (/^[A-Z0-9_]+$/.test(codigo)) return capitalizar(codigo.toLowerCase().replaceAll("_", " "));
  return capitalizar(codigo.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase());
}

export function etiquetaEntidad(entidad: string) {
  return ENTIDADES[entidad] ?? legible(entidad);
}

export function accion(codigo: string) {
  return ACCIONES[codigo] ?? { etiqueta: legible(codigo), tono: "neutro" as const };
}

export function etiquetaCampo(campo: string) {
  const dia = /^dia\.([1-7])$/.exec(campo);
  if (dia) return DIAS[Number(dia[1]) - 1];
  return CAMPOS[campo] ?? legible(campo);
}

export function formatearValor(campo: string, valor: ValorCambio) {
  if (valor === null) return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (CAMPOS_DINERO.has(campo) && typeof valor === "number") return moneda(valor);
  if (campo === "horasAnticipacion") return `${valor} h`;
  if (campo.startsWith("dia.")) return valor === "CERRADO" ? "Cerrado" : String(valor).replace("-", " – ");
  if (campo === "fecha" && typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return fecha(valor);
  if (CAMPOS_ENUM.has(campo) && typeof valor === "string") return VALORES[valor] ?? legible(valor);
  return String(valor);
}

export function textoCambio({ campo, anterior, nuevo }: Cambio) {
  const etiqueta = etiquetaCampo(campo);
  if (anterior === null) return `${etiqueta}: ${formatearValor(campo, nuevo)}`;
  return `${etiqueta}: ${formatearValor(campo, anterior)} → ${formatearValor(campo, nuevo)}`;
}
