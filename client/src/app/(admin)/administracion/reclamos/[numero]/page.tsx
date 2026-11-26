import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { AtencionDeLaHoja } from "@/features/reclamos/componentes/atencion-de-la-hoja";
import { consultarHoja } from "@/features/reclamos/servicios/reclamos.servidor";

export const metadata: Metadata = { title: "Hoja de reclamación · La Previa" };

type Parametros = Promise<{ numero: string }>;

async function HojaCargada({ parametros }: { parametros: Parametros }) {
  const { numero } = await parametros;
  const hoja = await consultarHoja(numero);
  return (
    <>
      <EncabezadoDeSeccion
        titulo={`Hoja ${hoja.numero}`}
        accion={<Link href="/administracion/reclamos" className="font-bold text-capitan underline underline-offset-2">Volver a reclamos</Link>}
      />
      <AtencionDeLaHoja key={hoja.numero} inicial={hoja} />
    </>
  );
}

export default function PaginaDeLaHoja({ params }: { params: Parametros }) {
  return (
    <Suspense fallback={<CargaDeContenido texto="Cargando la hoja…" />}>
      <HojaCargada parametros={params} />
    </Suspense>
  );
}
