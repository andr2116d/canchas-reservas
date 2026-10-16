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

function partesEnLima(instante: Date | string) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(instante))
      .map((parte) => [parte.type, parte.value]),
  );
}

export function fechaEnLima(instante: Date | string) {
  const { day, month, year } = partesEnLima(instante);
  return `${day}/${month}/${year}`;
}

export function fechaHoraEnLima(instante: Date | string) {
  const { day, month, year, hour, minute } = partesEnLima(instante);
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

export function diaYHoraEnLima(instante: Date | string) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("es-PE", {
      timeZone: ZONA,
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(instante))
      .map((parte) => [parte.type, parte.value]),
  );
  return `${partes.weekday} ${partes.day}/${partes.month} a las ${partes.hour}:${partes.minute}`;
}
