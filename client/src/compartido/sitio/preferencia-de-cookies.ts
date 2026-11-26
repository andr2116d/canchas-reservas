/** Necesarias: solo sesión y seguridad. Todas: también medición, si algún día se usa. */
export type PreferenciaDeCookies = "necesarias" | "todas";

const NOMBRE = "preferencia_de_cookies";
const SEGUNDOS_EN_180_DIAS = 180 * 24 * 60 * 60;
const VALORES: PreferenciaDeCookies[] = ["necesarias", "todas"];

const oyentes = new Set<() => void>();
let abiertoAMano = false;
const avisar = () => oyentes.forEach((oyente) => oyente());

/** La elección guardada en esta computadora, si la hay. */
export function leerPreferencia(): PreferenciaDeCookies | undefined {
  const valor = document.cookie
    .split("; ")
    .find((par) => par.startsWith(`${NOMBRE}=`))
    ?.slice(NOMBRE.length + 1);
  return VALORES.find((permitido) => permitido === valor);
}

/** Guarda la elección: es una cookie necesaria, para no volver a preguntar. */
export function guardarPreferencia(preferencia: PreferenciaDeCookies): void {
  const segura = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${NOMBRE}=${preferencia}; max-age=${SEGUNDOS_EN_180_DIAS}; path=/; samesite=lax${segura}`;
  abiertoAMano = false;
  avisar();
}

/** Vuelve a mostrar el aviso para cambiar la elección. */
export function abrirPreferencias(): void {
  abiertoAMano = true;
  avisar();
}

export function estadoDelAviso(): "visible" | "oculto" {
  return abiertoAMano || !leerPreferencia() ? "visible" : "oculto";
}

export function suscribirAlAviso(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}
