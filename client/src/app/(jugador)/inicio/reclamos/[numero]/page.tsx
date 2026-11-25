import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { TARJETA } from "@/compartido/ui/estilos";
import { EstadoDeLaHoja } from "@/features/libro-de-reclamaciones/componentes/estado-de-la-hoja";
import { consultarMiHoja } from "@/features/libro-de-reclamaciones/servicios/libro.servidor";

export const metadata: Metadata = { title: "Mi reclamo · La Previa" };

type Parametros = Promise<{ numero: string }>;

async function HojaCargada({ parametros }: { parametros: Parametros }) {
  const { numero } = await parametros;
  return (
    <section className={TARJETA}>
      <EstadoDeLaHoja hoja={await consultarMiHoja(numero)} />
    </section>
  );
}

export default function PaginaDeMiReclamo({ params }: { params: Parametros }) {
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Mi reclamo"
        descripcion="Su avance y la respuesta de La Previa."
        accion={<Link href="/inicio/reclamos" className="font-bold text-capitan underline underline-offset-2">Volver a mis reclamos</Link>}
      />
      <Suspense fallback={<CargaDeContenido texto="Cargando tu reclamo…" />}>
        <HojaCargada parametros={params} />
      </Suspense>
    </>
  );
}
