"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { estadoDelAviso, guardarPreferencia, leerPreferencia, suscribirAlAviso } from "./preferencia-de-cookies";

/**
 * Aviso de cookies: rechazar las opcionales pesa lo mismo que aceptarlas y se puede
 * elegir por tipo. Se muestra hasta que se elige y se vuelve a abrir desde el pie.
 */
export function AvisoDeCookies() {
  const estado = useSyncExternalStore(suscribirAlAviso, estadoDelAviso, () => "oculto" as const);
  const [eligiendo, setEligiendo] = useState(false);
  const [medicion, setMedicion] = useState(() => (typeof document === "undefined" ? false : leerPreferencia() === "todas"));
  if (estado === "oculto") return null;

  return (
    <section aria-labelledby="aviso-de-cookies-titulo" className="aviso-de-cookies">
      <h2 id="aviso-de-cookies-titulo" className="font-titular text-3xl leading-none font-black text-cancha">Tus cookies, tu decisión.</h2>
      <p className="text-sm text-grava">
        Usamos cookies necesarias para que inicies sesión y la web sea segura. Con tu permiso usaríamos cookies de medición para mejorarla; hoy no usamos ninguna.{" "}
        <Link href="/legal/cookies" className="font-semibold text-botella underline">Política de cookies</Link>
      </p>
      {eligiendo && (
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="sr-only">Tipos de cookies</legend>
          <label className="flex gap-2.5"><input type="checkbox" checked disabled className="mt-0.5 size-4 accent-botella" /><span><strong>Necesarias.</strong> Sesión y seguridad. Siempre activas.</span></label>
          <label className="flex gap-2.5"><input type="checkbox" checked={medicion} onChange={(e) => setMedicion(e.target.checked)} className="mt-0.5 size-4 accent-botella" /><span><strong>Medición.</strong> Cómo se usa la web, sin identificarte. Hoy no se usan.</span></label>
        </fieldset>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => guardarPreferencia("necesarias")} className="aviso-de-cookies__boton">Solo necesarias</button>
        {eligiendo ? (
          <button type="button" onClick={() => guardarPreferencia(medicion ? "todas" : "necesarias")} className="aviso-de-cookies__boton aviso-de-cookies__boton--lleno">Guardar mi elección</button>
        ) : (
          <button type="button" onClick={() => guardarPreferencia("todas")} className="aviso-de-cookies__boton aviso-de-cookies__boton--lleno">Aceptar todas</button>
        )}
      </div>
      {!eligiendo && <button type="button" onClick={() => setEligiendo(true)} className="w-fit text-sm font-bold text-botella underline">Elegir cuáles</button>}
    </section>
  );
}
