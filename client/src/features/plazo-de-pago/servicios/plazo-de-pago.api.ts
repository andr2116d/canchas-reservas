import { guardarVersion, type ResultadoDeVersion } from "@/compartido/api/guardar-version";
import type { DatosDelPlazo } from "../esquemas/plazo-de-pago.schema";

/** Guarda el plazo para pagar; `cambio` es falso si ya tenía esos mismos minutos. */
export const guardarPlazo = (datos: DatosDelPlazo): Promise<ResultadoDeVersion> => guardarVersion("/api/plazo-de-pago", datos);
