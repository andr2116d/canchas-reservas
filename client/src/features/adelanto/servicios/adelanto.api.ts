import { guardarVersion, type ResultadoDeVersion } from "@/compartido/api/guardar-version";
import type { DatosDelAdelanto } from "../esquemas/adelanto.schema";

/** Guarda el adelanto mínimo; `cambio` es falso si ya tenía ese mismo porcentaje. */
export const guardarAdelanto = (datos: DatosDelAdelanto): Promise<ResultadoDeVersion> => guardarVersion("/api/adelanto", datos);
