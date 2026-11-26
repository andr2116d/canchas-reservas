import type { PaginaDelHistorial } from "../servicios/historial";
import { agruparPorDia } from "../utilidades/agrupar-por-dia";
import { HistorialVacio } from "./historial-vacio";
import { RegistroDelHistorial } from "./registro-del-historial";

interface LineaDeTiempoProps {
  pagina: PaginaDelHistorial;
  /** Fecha de hoy en Lima, para titular «Hoy» y «Ayer». */
  hoy: string;
}

/** Los registros de la página agrupados por día, cada día con su línea de tiempo. */
export function LineaDeTiempo({ pagina, hoy }: LineaDeTiempoProps) {
  if (pagina.registros.length === 0) return <HistorialVacio fueraDeRango={pagina.total > 0} />;
  return (
    <div key={`${pagina.pagina}-${pagina.registros[0].id}`} className="linea-de-tiempo flex flex-col gap-5">
      {agruparPorDia(pagina.registros, hoy).map((grupo) => (
        <section key={grupo.fecha} aria-labelledby={`dia-${grupo.fecha}`}>
          <h3 id={`dia-${grupo.fecha}`} className="dia-del-historial">{grupo.titulo}</h3>
          <ol className="flex flex-col">
            {grupo.registros.map((registro) => (
              <RegistroDelHistorial key={registro.id} registro={registro} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
