"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, Select } from "@/components/ui";
import { useCanchas, useTarifas } from "../hooks";
import { TablaHistorial } from "./tabla-historial";
import { TarjetaFranja } from "./tarjeta-franja";

function Titulo() {
  return <h1 className="font-display text-[32px] font-bold leading-9 text-noche-900">Tarifas</h1>;
}

function ErrorCarga({ mensaje, reintentando, onReintentar }: { mensaje: string; reintentando: boolean; onReintentar: () => void }) {
  return (
    <div role="alert">
      <EmptyState
        mensaje={mensaje}
        accion={
          <Button variante="secundario" cargando={reintentando} onClick={onReintentar}>
            Reintentar
          </Button>
        }
      />
    </div>
  );
}

function EsqueletoTarifas() {
  return (
    <div aria-hidden data-testid="esqueleto-tarifas" className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-linea" />
        <div className="h-64 animate-pulse rounded-xl bg-linea" />
      </div>
      <div className="h-40 animate-pulse rounded-xl bg-linea" />
    </div>
  );
}

function ContenidoTarifas({ canchaId }: { canchaId: number }) {
  const tarifas = useTarifas(canchaId);

  if (tarifas.isPending) return <EsqueletoTarifas />;
  if (tarifas.isError) {
    return (
      <ErrorCarga
        mensaje={tarifas.error.message}
        reintentando={tarifas.isFetching}
        onReintentar={() => tarifas.refetch()}
      />
    );
  }

  const { dia, noche, historial } = tarifas.data;
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TarjetaFranja key={`${canchaId}-DIA`} canchaId={canchaId} franja="DIA" vigente={dia} />
        <TarjetaFranja key={`${canchaId}-NOCHE`} canchaId={canchaId} franja="NOCHE" vigente={noche} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold text-noche-900">Historial</h2>
        <TablaHistorial registros={historial} />
      </section>
    </>
  );
}

export function PantallaTarifas() {
  const router = useRouter();
  const canchas = useCanchas();
  const [canchaElegida, setCanchaElegida] = useState<number>();

  if (canchas.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Titulo />
          <div aria-hidden className="h-10 animate-pulse rounded-lg bg-linea sm:w-64" />
        </header>
        <EsqueletoTarifas />
      </div>
    );
  }

  if (canchas.isError) {
    return (
      <div className="flex flex-col gap-6">
        <Titulo />
        <ErrorCarga
          mensaje={canchas.error.message}
          reintentando={canchas.isFetching}
          onReintentar={() => canchas.refetch()}
        />
      </div>
    );
  }

  if (canchas.data.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Titulo />
        <EmptyState
          mensaje="Todavía no hay canchas. Crea una para definir sus tarifas."
          accion={<Button onClick={() => router.push("/admin/canchas")}>Ir a canchas</Button>}
        />
      </div>
    );
  }

  const canchaId = canchas.data.some((cancha) => cancha.id === canchaElegida)
    ? (canchaElegida as number)
    : (canchas.data.find((cancha) => cancha.activa) ?? canchas.data[0]).id;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Titulo />
        <div className="sm:w-64">
          <Select
            id="cancha-tarifas"
            etiqueta="Cancha"
            value={canchaId}
            onChange={(evento) => setCanchaElegida(Number(evento.target.value))}
          >
            {canchas.data.map((cancha) => (
              <option key={cancha.id} value={cancha.id}>
                {cancha.activa ? cancha.nombre : `${cancha.nombre} (desactivada)`}
              </option>
            ))}
          </Select>
        </div>
      </header>

      <ContenidoTarifas canchaId={canchaId} />
    </div>
  );
}
