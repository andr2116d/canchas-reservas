import type { ReactNode } from "react";
import { type Constancia, fechaYHora, NOMBRE_DEL_MEDIO, NOMBRE_DEL_SERVICIO, NOMBRE_DEL_TIPO } from "../servicios/libro";

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-grava">{termino}</dt>
      <dd className="font-semibold break-words text-tinta">{children}</dd>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border-t border-linea px-5 py-4 first-of-type:border-t-0">
      <h3 className="mb-2 text-xs font-extrabold tracking-[0.12em] text-botella uppercase">{titulo}</h3>
      {children}
    </section>
  );
}

const PENDIENTE = <span className="rounded bg-[#fbf1dc] px-1.5 py-0.5 text-xs font-bold text-[#7a4d00]">Por publicar</span>;

/** La hoja tal como quedó registrada, con las partes del formato oficial (DS 011-2011-PCM, art. 5). */
export function HojaCompleta({ constancia }: { constancia: Constancia }) {
  const { numero, registradaEn, proveedor, hoja } = constancia;
  const { consumidor: c, representante: r, servicio: s } = hoja;
  const documento = c.documento.tipo === "DNI" ? "DNI" : "Carné de extranjería";
  return (
    <article aria-label={`Hoja de reclamación N.º ${numero}`} className="overflow-hidden rounded-lg border border-linea bg-white">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-cancha px-5 py-4">
        <h2 className="font-titular text-2xl leading-none font-black text-cancha">Hoja de reclamación</h2>
        <p className="text-right text-sm text-grava">
          <span className="block font-titular text-2xl font-black text-botella tabular-nums">N.º {numero}</span>
          {fechaYHora(registradaEn)}
        </p>
      </header>
      <Seccion titulo="Proveedor">
        <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-3">
          <Dato termino="Razón social">{proveedor.razonSocial ?? PENDIENTE}</Dato>
          <Dato termino="RUC">{proveedor.ruc ?? PENDIENTE}</Dato>
          <Dato termino="Dirección">{proveedor.direccion ?? PENDIENTE}</Dato>
        </dl>
      </Seccion>
      <Seccion titulo="1 · Consumidor">
        <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
          <Dato termino="Nombre">{`${c.nombres} ${c.apellidos}`}</Dato>
          <Dato termino={documento}>{c.documento.numero}</Dato>
          <Dato termino="Domicilio">{c.domicilio}</Dato>
          <Dato termino="Teléfono y correo">{`${c.telefono} · ${c.correo}`}</Dato>
          {r && <Dato termino="Representante (menor de edad)">{`${r.nombre} · ${r.telefono} · ${r.correo} · ${r.domicilio}`}</Dato>}
        </dl>
      </Seccion>
      <Seccion titulo="2 · Servicio contratado">
        <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-3">
          <Dato termino="Servicio">{NOMBRE_DEL_SERVICIO[s.servicio]}</Dato>
          <Dato termino="Monto reclamado">{s.montoReclamado ? `S/ ${s.montoReclamado}` : "—"}</Dato>
          {s.descripcion && <Dato termino="Descripción">{s.descripcion}</Dato>}
        </dl>
      </Seccion>
      <Seccion titulo={`3 · ${NOMBRE_DEL_TIPO[hoja.tipo]}`}>
        <p className="text-sm whitespace-pre-line"><b>Detalle:</b> {hoja.detalle}</p>
        <p className="mt-1 text-sm whitespace-pre-line"><b>Pedido:</b> {hoja.pedido}</p>
        <p className="mt-1 text-sm"><b>Respuesta:</b> {NOMBRE_DEL_MEDIO[hoja.medioDeRespuesta]}</p>
      </Seccion>
      <Seccion titulo="4 · Acciones adoptadas por La Previa">
        <p className="text-sm text-grava">Se completan con la respuesta.</p>
      </Seccion>
    </article>
  );
}
