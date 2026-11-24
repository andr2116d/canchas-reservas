import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ahoraDeLaPeticion } from "@/compartido/sesion/ahora-de-la-peticion";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { TARJETA } from "@/compartido/ui/estilos";
import { ProveedorDeAvisos } from "@/features/canchas/componentes/avisos-de-canchas";
import { FormularioDeBloqueo } from "@/features/canchas/componentes/formulario-de-bloqueo";
import { ListaDeBloqueos } from "@/features/canchas/componentes/lista-de-bloqueos";
import { consultarBloqueos } from "@/features/canchas/servicios/bloqueos.servidor";
import { consultarCanchas } from "@/features/canchas/servicios/canchas.servidor";
import { partesEnLima } from "@/features/canchas/utilidades/rango-en-lima";

export const metadata: Metadata = { title: "Mantenimiento de canchas · La Previa" };

/** El formulario para bloquear las canchas operativas y, al costado, los bloqueos. */
async function MantenimientoCargado() {
  const [canchas, bloqueos, ahora] = await Promise.all([consultarCanchas(), consultarBloqueos(), ahoraDeLaPeticion()]);
  const operativas = canchas.filter((c) => c.estado === "OPERATIVA").map(({ id, nombre }) => ({ id, nombre }));
  if (operativas.length === 0) {
    return (
      <p className={`${TARJETA} text-grava`}>
        No hay canchas operativas para bloquear. <Link href="/administracion/canchas" className="font-bold text-botella underline underline-offset-4">Agrégalas en Canchas</Link>.
      </p>
    );
  }
  return (
    <ProveedorDeAvisos>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <FormularioDeBloqueo canchas={operativas} ahora={ahora.toISOString()} />
        <div className="lg:sticky lg:top-24">
          <ListaDeBloqueos bloqueos={bloqueos} hoy={partesEnLima(ahora).fecha} />
        </div>
      </div>
    </ProveedorDeAvisos>
  );
}

export default function PaginaDeMantenimiento() {
  return (
    <Suspense fallback={<CargaDeContenido texto="Cargando mantenimiento…" />}>
      <MantenimientoCargado />
    </Suspense>
  );
}
