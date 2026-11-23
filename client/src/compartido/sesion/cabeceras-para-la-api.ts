/**
 * Cabeceras de una consulta del server de Next a la API: la cookie de la
 * sesión y, si llegó, la IP de quien visita la página. Sin ella, la API vería
 * siempre la IP de Next y todos compartirían el mismo límite de peticiones.
 */
export function cabecerasParaLaApi(cookie: string, ipReenviada?: string): Record<string, string> {
  return ipReenviada ? { cookie, "x-forwarded-for": ipReenviada } : { cookie };
}
