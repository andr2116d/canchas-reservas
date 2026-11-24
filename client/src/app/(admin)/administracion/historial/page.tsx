import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { ahoraDeLaPeticion } from "@/compartido/sesion/ahora-de-la-peticion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { ConsultaDelHistorial } from "@/features/historial/componentes/consulta-del-historial";
import { FiltrosDelHistorial } from "@/features/historial/componentes/filtros-del-historial";
import { LineaDeTiempo } from "@/features/historial/componentes/linea-de-tiempo";
import { PaginacionDelHistorial } from "@/features/historial/componentes/paginacion-del-historial";
import { consultarAutores, consultarHistorial } from "@/features/historial/servicios/historial.servidor";
import { aConsulta, leerFiltros } from "@/features/historial/utilidades/filtros";

export const metadata: Metadata = { title: "Historial de cambios · La Previa" };

type Parametros = Promise<Record<string, string | string[] | undefined>>;

const HOY_EN_LIMA = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" });

/** Lee los filtros de la dirección, consulta la página y a quienes tienen registros. */
async function HistorialCargado({ parametros }: { parametros: Parametros }) {
  const { filtros, aviso } = leerFiltros(await parametros);
  const [pagina, autores, ahora] = await Promise.all([consultarHistorial(aConsulta(filtros)), consultarAutores(), ahoraDeLaPeticion()]);
  return (
    <ConsultaDelHistorial>
      <FiltrosDelHistorial key={`${filtros.desde}-${filtros.hasta}`} filtros={filtros} autores={autores} aviso={aviso} />
      <LineaDeTiempo pagina={pagina} hoy={HOY_EN_LIMA.format(ahora)} />
      <PaginacionDelHistorial pagina={pagina} filtros={filtros} />
    </ConsultaDelHistorial>
  );
}

export default function PaginaDelHistorial({ searchParams }: { searchParams: Parametros }) {
  return (
    <>
      <EncabezadoDeSeccion
        titulo="Historial de cambios"
        descripcion="Quién cambió qué y cuándo en el local. Solo se consulta: nada se edita ni se borra."
      />
      <Suspense fallback={<CargaDeContenido texto="Cargando el historial…" />}>
        <HistorialCargado parametros={searchParams} />
      </Suspense>
    </>
  );
}
