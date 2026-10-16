import type { UseFormRegisterReturn } from "react-hook-form";

export type Filtro = (valor: string, borrando?: boolean) => string;

export function soloDigitos(valor: string, maximo?: number): string {
  return valor.replace(/\D/g, "").slice(0, maximo);
}

export function alfanumerico(valor: string, maximo?: number): string {
  return valor.replace(/[^A-Za-z0-9]/g, "").slice(0, maximo);
}

export function decimal(valor: string): string {
  const limpio = valor.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const [entero, ...resto] = limpio.split(".");
  if (resto.length === 0) return entero;
  return `${entero}.${resto.join("").slice(0, 2)}`;
}

export function hora(valor: string, borrando = false): string {
  const [horas, ...resto] = valor.replace(/[^\d:]/g, "").split(":");
  if (resto.length > 0) return `${horas.slice(0, 2)}:${resto.join("").slice(0, 2)}`;
  const digitos = horas.slice(0, 4);
  if (borrando || digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}

export function filtroDocumento(tipo: string): Filtro {
  return tipo === "DNI" ? (valor) => soloDigitos(valor, 8) : (valor) => alfanumerico(valor, 12);
}

function estaBorrando(evento: object) {
  const nativo = (evento as { nativeEvent?: { inputType?: unknown } }).nativeEvent;
  return typeof nativo?.inputType === "string" && nativo.inputType.startsWith("delete");
}

export function filtrarCampo(campo: HTMLInputElement, filtro: Filtro, borrando = false) {
  const original = campo.value;
  const limpio = filtro(original, borrando);
  if (limpio === original) return;
  const cursor = campo.selectionStart ?? original.length;
  const nuevoCursor = Math.min(filtro(original.slice(0, cursor), borrando).length, limpio.length);
  campo.value = limpio;
  campo.setSelectionRange(nuevoCursor, nuevoCursor);
}

export function conFiltro<T extends string>(
  registro: UseFormRegisterReturn<T>,
  filtro: Filtro,
): UseFormRegisterReturn<T> {
  return {
    ...registro,
    onChange: (evento) => {
      if (evento.target instanceof HTMLInputElement) filtrarCampo(evento.target, filtro, estaBorrando(evento));
      return registro.onChange(evento);
    },
  };
}
