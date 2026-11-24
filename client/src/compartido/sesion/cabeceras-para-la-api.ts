/**
 * Cabeceras de una consulta del server de Next a la API: la cookie y la IP de quien visita la
 * página, para que la API cuente sus límites por persona. De la cadena de proxies se toma solo la
 * última IP: las anteriores las puede escribir cualquiera.
 */
export function cabecerasParaLaApi(cookie: string, ipReenviada?: string): Record<string, string> {
  const ip = ipReenviada?.split(",").at(-1)?.trim();
  return ip ? { cookie, "x-forwarded-for": ip } : { cookie };
}
