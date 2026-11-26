import { TARJETA } from "@/compartido/ui/estilos";
import type { PaginaDelHistorial } from "../servicios/historial";
import { LineaDeTiempo } from "./linea-de-tiempo";
import { PaginacionDelHistorial, ResumenDeResultados } from "./paginacion-del-historial";

/** La tarjeta de resultados: el resumen arriba, la línea de tiempo y las páginas al pie. */
export function RegistrosDelHistorial({ pagina, hoy }: { pagina: PaginaDelHistorial; hoy: string }) {
  return (
    <section id="registros-del-historial" aria-label="Registros" className={`${TARJETA} registros-del-historial flex flex-col gap-4 !px-4 !pt-4 sm:!px-6`}>
      <ResumenDeResultados pagina={pagina} />
      <LineaDeTiempo pagina={pagina} hoy={hoy} />
      <PaginacionDelHistorial pagina={pagina} />
    </section>
  );
}
