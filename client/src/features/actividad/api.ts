import { api } from "@/lib/api";

export const TAMANO_PAGINA = 20;

export type RolUsuario = "ADMINISTRADOR" | "RECEPCIONISTA" | "JUGADOR";
export type ValorCambio = string | number | boolean | null;
export type MotivoAcceso = "OK" | "CREDENCIALES" | "INACTIVO";

export type UsuarioActividad = { id: number; nombre: string; rol: RolUsuario };

export type Cambio = { campo: string; anterior: ValorCambio; nuevo: ValorCambio };

export type ItemCambio = {
  id: number;
  fecha: string;
  usuario: UsuarioActividad | null;
  accion: string;
  entidad: string;
  entidadId: number | null;
  referencia: string | null;
  motivo: string | null;
  cambios: Cambio[];
};

export type ItemAcceso = {
  id: number;
  fecha: string;
  correo: string;
  usuario: UsuarioActividad | null;
  exito: boolean;
  motivo: MotivoAcceso;
  ip: string | null;
};

export type Pagina<T> = { items: T[]; total: number; pagina: number; tamano: number };

type Rango = { desde?: string; hasta?: string };

export type FiltrosCambios = Rango & { entidad?: string; accion?: string; pagina: number };
export type FiltrosAccesos = Rango & { exito?: boolean; correo?: string; pagina: number };

type Parametros = Record<string, string | number | boolean | undefined>;

function query(filtros: Parametros) {
  const parametros = new URLSearchParams();
  const todos: Parametros = { ...filtros, tamano: TAMANO_PAGINA };
  for (const [clave, valor] of Object.entries(todos)) {
    if (valor !== undefined && valor !== "") parametros.set(clave, String(valor));
  }
  return parametros.toString();
}

export function listarCambios(filtros: FiltrosCambios): Promise<Pagina<ItemCambio>> {
  return api<Pagina<ItemCambio>>(`/auditoria?${query(filtros)}`);
}

export function listarAccesos(filtros: FiltrosAccesos): Promise<Pagina<ItemAcceso>> {
  return api<Pagina<ItemAcceso>>(`/accesos?${query(filtros)}`);
}
