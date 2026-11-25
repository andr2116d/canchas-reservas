"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BotonDeCopiar } from "@/compartido/ui/boton-de-copiar";
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { type Constancia, diaLegible, NOMBRE_DEL_MEDIO } from "../servicios/libro";
import { AvisoLegalDelLibro } from "./aviso-legal-del-libro";
import { HojaCompleta } from "./hoja-completa";

/** «valeria.leon@gmail.com» → «v•••@gmail.com», para no mostrar el correo completo en pantalla. */
function correoOculto(correo: string): string {
  const [usuario, dominio] = correo.split("@");
  return `${usuario.charAt(0)}•••@${dominio}`;
}

function DatoGrande({ titulo, valor, pequeno = false }: { titulo: string; valor: string; pequeno?: boolean }) {
  return (
    <div className="rounded-2xl border border-linea bg-papel p-4">
      <p className="text-sm text-grava">{titulo}</p>
      <p className={`font-titular leading-tight font-black text-cancha ${pequeno ? "text-2xl" : "text-3xl tracking-wide tabular-nums"}`}>{valor}</p>
    </div>
  );
}

/** Lo que ve quien acaba de registrar su hoja: número, código, plazo y la hoja completa plegada. */
export function ConstanciaDeLaHoja({ constancia }: { constancia: Constancia }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const { numero, codigo, fechaLimite, hoja } = constancia;
  useEffect(() => titulo.current?.focus(), []);

  return (
    <div className="flex flex-col gap-5">
      <div role="status" className="flex flex-col gap-1 rounded-2xl bg-[#e3f2e8] px-5 py-4 text-[#1f5c3d]">
        <h2 ref={titulo} tabIndex={-1} className="font-titular text-3xl leading-none font-black outline-none">Registramos tu hoja</h2>
        <p className="text-sm">Te enviamos una copia a {correoOculto(hoja.consumidor.correo)}.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <DatoGrande titulo="Número de hoja" valor={numero} />
        <DatoGrande titulo="Código de seguimiento" valor={codigo} />
        <DatoGrande titulo="Te respondemos a más tardar el" valor={diaLegible(fechaLimite)} pequeno />
      </div>
      <p className="text-sm text-grava">
        La respuesta llegará {NOMBRE_DEL_MEDIO[hoja.medioDeRespuesta]}. Guarda el número y el código: con ellos sigues tu hoja cuando quieras.
      </p>
      <div className="flex flex-wrap items-start gap-3 print:hidden">
        <Link href="/libro-de-reclamaciones/seguimiento" className={BOTON_PRINCIPAL}>Seguir mi hoja</Link>
        <button type="button" onClick={() => window.print()} className={BOTON_SECUNDARIO}>Imprimir o guardar en PDF</button>
        <BotonDeCopiar texto={() => `Hoja ${numero} · Código ${codigo}`} etiqueta="Copiar número y código" avisoCopiado="Número y código copiados." />
      </div>
      <details className="rounded-2xl border border-linea bg-papel print:hidden">
        <summary className="cursor-pointer px-5 py-3.5 font-bold text-botella">Ver la hoja completa</summary>
        <div className="px-3 pb-3">
          <HojaCompleta constancia={constancia} />
        </div>
      </details>
      {/* Al imprimir, la hoja completa sale aunque esté plegada en pantalla. */}
      <div className="hidden print:block">
        <HojaCompleta constancia={constancia} />
      </div>
      <AvisoLegalDelLibro />
    </div>
  );
}
