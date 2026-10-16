import type { UseFormRegisterReturn } from "react-hook-form";

export type Filtro = (valor: string) => string;

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

export function filtroDocumento(tipo: string): Filtro {
  return tipo === "DNI" ? (valor) => soloDigitos(valor, 8) : (valor) => alfanumerico(valor, 12);
}

export function filtrarCampo(campo: HTMLInputElement, filtro: Filtro) {
  const original = campo.value;
  const limpio = filtro(original);
  if (limpio === original) return;
  const cursor = campo.selectionStart ?? original.length;
  const nuevoCursor = Math.min(filtro(original.slice(0, cursor)).length, limpio.length);
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
      if (evento.target instanceof HTMLInputElement) filtrarCampo(evento.target, filtro);
      return registro.onChange(evento);
    },
  };
}
