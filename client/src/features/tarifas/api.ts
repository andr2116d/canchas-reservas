import { api } from "@/lib/api";

export type Franja = "DIA" | "NOCHE";

export type CanchaOpcion = {
  id: number;
  nombre: string;
};

export type TarifaVigente = {
  valor: number;
  vigenteDesde: string;
};

export type RegistroHistorial = {
  id: number;
  franja: Franja;
  valor: number;
  vigenteDesde: string;
  vigenteHasta: string | null;
};

export type Tarifas = {
  dia: TarifaVigente | null;
  noche: TarifaVigente | null;
  historial: RegistroHistorial[];
};

export type DatosTarifa = {
  franja: Franja;
  valor: number;
};

export type TarifaGuardada = TarifaVigente & { franja: Franja };

export const ETIQUETA_FRANJA: Record<Franja, string> = {
  DIA: "Día",
  NOCHE: "Noche",
};

export function calcularAdelanto(valor: number): number {
  const centimos = Math.round(valor * 100);
  return Math.floor((centimos + 1) / 2) / 100;
}

export function listarCanchas(): Promise<CanchaOpcion[]> {
  return api<CanchaOpcion[]>("/canchas");
}

export function obtenerTarifas(canchaId: number): Promise<Tarifas> {
  return api<Tarifas>(`/canchas/${canchaId}/tarifas`);
}

export function definirTarifa(canchaId: number, datos: DatosTarifa): Promise<TarifaGuardada> {
  return api<TarifaGuardada>(`/canchas/${canchaId}/tarifas`, { method: "PUT", body: datos });
}
