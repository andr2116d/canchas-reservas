import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { ahoraDeLaPeticion } from "@/compartido/sesion/ahora-de-la-peticion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { FiltrosDeReclamos } from "@/features/reclamos/componentes/filtros-de-reclamos";
import { ListaDeReclamos } from "@/features/reclamos/componentes/lista-de-reclamos";
import { PaginacionDeReclamos } from "@/features/reclamos/componentes/paginacion-de-reclamos";
import { consultarHojas } from "@/features/reclamos/servicios/reclamos.servidor";
import { aConsulta, aDireccion, leerFiltros } from "@/features/reclamos/utilidades/filtros";

export const metadata: Metadata = { title: "Reclamos · La Previa" };

type Parametros = Promise<Record<string, string | string[] | undefined>>;
const HOY_EN_LIMA = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" });
const ENCABEZADO = <EncabezadoDeSeccion titulo="Reclamos" descripcion="Responde cada hoja en 15 días hábiles como máximo. La que vence primero va arriba." />;

async function ReclamosCargados({ parametros }: { parametros: Parametros }) {
  const filtros = leerFiltros(await parametros);
  const hoy = HOY_EN_LIMA.format(await ahoraDeLaPeticion());
  const pagina = await consultarHojas(aConsulta(filtros, hoy));
  return (
    <div className="flex flex-col gap-4">
      <FiltrosDeReclamos filtros={filtros} conteos={pagina.conteos} />
      <PaginacionDeReclamos pagina={pagina} filtros={filtros} />
      {pagina.hojas.length > 0 ? (
        <ListaDeReclamos hojas={pagina.hojas} />
      ) : (
        <div className="rounded-2xl border border-dashed border-linea bg-papel/70 px-5 py-10 text-center text-grava">
          <p>No hay hojas con estos filtros.</p>
          <Link href={aDireccion(leerFiltros({ estado: "TODAS" }))} className="mt-2 inline-block font-bold text-botella underline">Ver todas las hojas</Link>
        </div>
      )}
      <PaginacionDeReclamos pagina={pagina} filtros={filtros} />
    </div>
  );
}

export default function PaginaDeReclamos({ searchParams }: { searchParams: Parametros }) {
  return (
    <>
      {ENCABEZADO}
      <Suspense fallback={<CargaDeContenido texto="Cargando los reclamos…" />}>
        <ReclamosCargados parametros={searchParams} />
      </Suspense>
    </>
  );
}
