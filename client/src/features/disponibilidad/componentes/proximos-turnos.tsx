"use client";

import { useEffect, useState } from "react";
import { NOMBRE_DEL_TIPO, type TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";
import type { MapaDelDia } from "../servicios/disponibilidad";
import { consultarMapa } from "../servicios/disponibilidad.api";

interface Proximo {
  tipo: TipoDeCancha;
  desde: string;
  cancha: string;
  precio: string;
}

/** El primer turno libre de hoy de cada tipo de cancha. */
export function proximosLibres(mapa: MapaDelDia): Proximo[] {
  return mapa.tipos.flatMap((tipo) => {
    if (tipo.estado !== "CON_TURNOS") return [];
    for (const turno of tipo.turnos) {
      const libre = turno.canchas.find((c) => c.estado === "DISPONIBLE");
      const cancha = libre && tipo.canchas.find((c) => c.id === libre.canchaId);
      if (cancha) return [{ tipo: tipo.tipo, desde: turno.desde, cancha: cancha.nombre, precio: turno.precio }];
    }
    return [];
  });
}

/** Próximos turnos libres de hoy, para ir directo a reservar. Si no quedan, no se muestra. */
export function ProximosTurnos() {
  const [proximos, setProximos] = useState<Proximo[]>([]);
  useEffect(() => {
    const control = new AbortController();
    void consultarMapa(undefined, control.signal).then((resultado) => {
      if (resultado.tipo === "consultado") setProximos(proximosLibres(resultado.mapa));
    });
    return () => control.abort();
  }, []);
  if (proximos.length === 0) return null;

  return (
    <section aria-labelledby="proximos-titulo" className="proximos-turnos">
      <h2 id="proximos-titulo" className="proximos-turnos__titulo">Próximos turnos libres hoy</h2>
      <ul className="contents">
        {proximos.map((p) => (
          <li key={p.tipo}>
            <a href="#turnos" className="proximos-turnos__turno">
              <time className="font-titular text-4xl leading-none font-black text-capitan tabular-nums">{p.desde}</time>
              <span className="text-sm leading-snug text-tiza/80">
                <strong className="block text-papel">{NOMBRE_DEL_TIPO[p.tipo]}</strong>
                {p.cancha} · S/ {p.precio}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
