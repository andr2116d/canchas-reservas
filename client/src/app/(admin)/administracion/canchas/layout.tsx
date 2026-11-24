import type { ReactNode } from "react";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { PestanasDeCanchas } from "@/features/canchas/componentes/pestanas-de-canchas";
import { consultarBloqueos } from "@/features/canchas/servicios/bloqueos.servidor";

/** Las pestañas con la cuenta de bloqueos en curso, que llega aparte para no demorar la página. */
async function PestanasConBloqueosEnCurso() {
  const { sinTerminar } = await consultarBloqueos();
  return <PestanasDeCanchas enCurso={sinTerminar.filter((b) => b.etapa === "EN_CURSO").length} />;
}

export default function LayoutDeCanchas({ children }: { children: ReactNode }) {
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Canchas"
        descripcion="Las canchas del local, cómo son y cuándo no se pueden reservar por mantenimiento. El jugador ve estos datos antes de reservar."
        accion={
          <Suspense fallback={<PestanasDeCanchas />}>
            <PestanasConBloqueosEnCurso />
          </Suspense>
        }
      />
      {children}
    </>
  );
}
