const ZONA = "America/Lima";

export function moneda(monto: number | string) {
  return `S/ ${Number(monto).toFixed(2)}`;
}

export function fecha(iso: string) {
  const [anio, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

export function hoyEnLima() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
}

export function horaEnLima(instante: Date | string) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(instante));
}
