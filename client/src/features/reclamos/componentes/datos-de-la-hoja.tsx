import type { ReactNode } from "react";
import type { HojaParaAtender } from "../servicios/reclamos";

const SERVICIO = { RESERVA_DE_CANCHA: "Reserva de cancha", MATERIAL_ADICIONAL: "Material adicional", OTRO: "Otro" } as const;

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-grava">{termino}</dt>
      <dd className="font-semibold break-words whitespace-pre-line text-tinta">{children}</dd>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-linea pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-extrabold tracking-[0.12em] text-botella uppercase">{titulo}</h3>
      {children}
    </section>
  );
}

/** Lo que escribió quien reclamó, con sus datos de contacto para responder. */
export function DatosDeLaHoja({ hoja }: { hoja: HojaParaAtender }) {
  const { consumidor: c, representante: r, servicio: s } = hoja;
  return (
    <div className="flex flex-col gap-4">
      <Bloque titulo={hoja.tipo === "QUEJA" ? "Queja" : "Reclamo"}>
        <dl className="flex flex-col gap-3">
          <Dato termino="Qué pasó">{hoja.detalle}</Dato>
          <Dato termino="Qué pide">{hoja.pedido}</Dato>
        </dl>
      </Bloque>
      <Bloque titulo="Servicio">
        <dl className="grid gap-3 sm:grid-cols-3">
          <Dato termino="Servicio">{SERVICIO[s.servicio]}</Dato>
          <Dato termino="Monto reclamado">{s.montoReclamado ? `S/ ${s.montoReclamado}` : "—"}</Dato>
          {s.descripcion && <Dato termino="Descripción">{s.descripcion}</Dato>}
        </dl>
      </Bloque>
      <Bloque titulo="Quién reclama">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Dato termino="Nombre">{`${c.nombres} ${c.apellidos}`}</Dato>
          <Dato termino={c.documento.tipo === "DNI" ? "DNI" : "Carné de extranjería"}>{c.documento.numero}</Dato>
          <Dato termino="Teléfono">{c.telefono}</Dato>
          <Dato termino="Correo">{c.correo}</Dato>
          <Dato termino="Domicilio">{c.domicilio}</Dato>
          {r && <Dato termino="Menor de edad: representante">{`${r.nombre}\n${r.telefono} · ${r.correo}\n${r.domicilio}`}</Dato>}
        </dl>
      </Bloque>
    </div>
  );
}
