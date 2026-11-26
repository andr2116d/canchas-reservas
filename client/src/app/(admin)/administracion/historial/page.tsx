import type { Metadata } from "next";
import { Suspense } from "react";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { ahoraDeLaPeticion } from "@/compartido/sesion/ahora-de-la-peticion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { ConsultaDelHistorial } from "@/features/historial/componentes/consulta-del-historial";
import { FiltrosDelHistorial } from "@/features/historial/componentes/filtros-del-historial";
import { PeriodoDelHistorial } from "@/features/historial/componentes/periodo-del-historial";
import { RegistrosDelHistorial } from "@/features/historial/componentes/registros-del-historial";
import { consultarAutores, consultarHistorial } from "@/features/historial/servicios/historial.servidor";
import { aConsulta, leerFiltros } from "@/features/historial/utilidades/filtros";

export const metadata: Metadata = { title: "Historial de cambios · La Previa" };

type Parametros = Promise<Record<string, string | string[] | undefined>>;

const HOY_EN_LIMA = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" });
const TITULO = "Historial de cambios";
const DESCRIPCION = "Quién cambió qué y cuándo en el local. Es solo de consulta: nada se edita ni se borra.";

/** Lee los filtros de la dirección, consulta la página y a quienes tienen registros. */
async function HistorialCargado({ parametros }: { parametros: Parametros }) {
  const { filtros, aviso } = leerFiltros(await parametros);
  const [pagina, autores, ahora] = await Promise.all([consultarHistorial(aConsulta(filtros)), consultarAutores(), ahoraDeLaPeticion()]);
  const hoy = HOY_EN_LIMA.format(ahora);
  return (
    <ConsultaDelHistorial filtros={filtros} hoy={hoy} encabezado={<EncabezadoDeSeccion titulo={TITULO} descripcion={DESCRIPCION} accion={<PeriodoDelHistorial />} />}>
      <FiltrosDelHistorial autores={autores} aviso={aviso} />
      <RegistrosDelHistorial pagina={pagina} hoy={hoy} />
    </ConsultaDelHistorial>
  );
}

export default function PaginaDelHistorial({ searchParams }: { searchParams: Parametros }) {
  return (
    <Suspense
      fallback={
        <>
          <EncabezadoDeSeccion titulo={TITULO} descripcion={DESCRIPCION} />
          <CargaDeContenido texto="Cargando el historial…" />
        </>
      }
    >
      <HistorialCargado parametros={searchParams} />
    </Suspense>
  );
}
