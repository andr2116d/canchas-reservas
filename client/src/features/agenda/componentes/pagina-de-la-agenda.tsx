import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { AgendaDelDia } from "./agenda-del-dia";

/** La sección Agenda de recepción y de administración; `ruta` es donde vive en cada panel. */
export function PaginaDeLaAgenda({ ruta }: { ruta: string }) {
  return (
    <>
      <EncabezadoDeSeccion titulo="Agenda" descripcion="Los turnos reservados de cada día, con lo que falta cobrar." />
      <Suspense fallback={<CargaDeContenido texto="Cargando la agenda…" />}>
        <AgendaDelDia ruta={ruta} />
      </Suspense>
    </>
  );
}
