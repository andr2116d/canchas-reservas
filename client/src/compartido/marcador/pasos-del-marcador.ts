export interface HoraYMinutos {
  horas: number;
  minutos: number;
}

const dosCifras = (numero: number) => String(numero).padStart(2, "0");

/** Separa «HH:MM» en horas y minutos; lo que falte cuenta como cero. */
export function leerHora(texto: string): HoraYMinutos {
  const [horas = "0", minutos = "0"] = texto.split(":");
  return { horas: Number(horas) || 0, minutos: Number(minutos) || 0 };
}

export function escribirHora(horas: number, minutos: number): string {
  return `${dosCifras(horas)}:${dosCifras(minutos)}`;
}

/** Siguiente múltiplo del paso; después del máximo vuelve a cero. */
export function subir(valor: number, paso: number, maximo: number): number {
  const siguiente = Math.floor(valor / paso) * paso + paso;
  return siguiente > maximo ? 0 : siguiente;
}

/** Múltiplo anterior del paso; antes del cero vuelve al último múltiplo posible. */
export function bajar(valor: number, paso: number, maximo: number): number {
  const anterior = Math.ceil(valor / paso) * paso - paso;
  return anterior < 0 ? Math.floor(maximo / paso) * paso : anterior;
}

export { dosCifras };
