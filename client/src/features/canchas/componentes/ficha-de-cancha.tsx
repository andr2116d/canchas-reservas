"use client";

import { useId, useState } from "react";
import { NOMBRE_DEL_TIPO } from "@/compartido/canchas/tipo-de-cancha";
import { TarjetaFlotante } from "@/compartido/ui/tarjeta-flotante";
import { TEXTO_DE_CARACTERISTICA, type Cancha } from "../servicios/canchas";
import { describirHasta, describirRango } from "../utilidades/rango-en-lima";
import { AccionesDeCancha } from "./acciones-de-cancha";
import { FormularioDeCancha } from "./formulario-de-cancha";
import { PlantaDeCancha } from "./planta-de-cancha";

interface FichaDeCanchaProps {
  cancha: Cancha;
  /** Recién creada: entra con su animación. */
  nueva?: boolean;
  /** Posición entre las recién creadas, para que entren una tras otra. */
  orden?: number;
  /** Fecha de hoy en Lima, para decir hasta cuándo dura un mantenimiento. */
  hoy?: string;
}

function EstadoDeLaCancha({ cancha, hoy }: { cancha: Cancha; hoy: string }) {
  if (cancha.estado === "DESACTIVADA") return <span className="estado-de-cancha estado-de-cancha--apagada">Desactivada</span>;
  if (cancha.mantenimiento) return <span className="estado-de-cancha estado-de-cancha--en-obra">Mantenimiento</span>;
  return <span className="estado-de-cancha">Operativa</span>;
}

function DatosDeLaCancha({ cancha, hoy }: { cancha: Cancha; hoy: string }) {
  return (
    <>
      {cancha.mantenimiento && (
        <p className="text-sm font-semibold text-[#6d4600]">
          No se puede reservar hasta {describirHasta(cancha.mantenimiento.hasta, hoy)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="rounded-full bg-tinta px-2.5 py-0.5 text-xs font-bold text-papel">{NOMBRE_DEL_TIPO[cancha.tipo]}</span>
        <span className={`luz-de-cancha ${cancha.tieneIluminacion ? "" : "luz-de-cancha--sin"}`}>
          {cancha.tieneIluminacion ? "Con iluminación" : "Solo con luz natural"}
        </span>
      </div>
      {cancha.caracteristicas.length > 0 && (
        <ul aria-label="Cómo es" className="flex flex-wrap gap-1.5">
          {cancha.caracteristicas.map((valor) => (
            <li key={valor} className="rounded-full bg-tiza px-2.5 py-0.5 text-xs font-semibold text-tinta">{TEXTO_DE_CARACTERISTICA[valor]}</li>
          ))}
        </ul>
      )}
      {cancha.nota && <p className="text-sm text-grava">{cancha.nota}</p>}
      {cancha.proximoMantenimiento && (
        <p className="text-xs text-grava">
          Próximo mantenimiento: <b className="text-tinta">{describirRango(cancha.proximoMantenimiento.inicio, cancha.proximoMantenimiento.fin)}</b>
        </p>
      )}
    </>
  );
}

/** Una cancha dibujada desde arriba con sus datos y sus acciones; se edita en una tarjeta flotante para no mover la cuadrícula. */
export function FichaDeCancha({ cancha, nueva = false, orden = 0, hoy = "" }: FichaDeCanchaProps) {
  const [editando, setEditando] = useState(false);
  const idDelNombre = useId();
  const operativa = cancha.estado === "OPERATIVA";
  return (
    <article
      aria-labelledby={idDelNombre}
      className={`ficha-de-cancha ${operativa ? "" : "ficha-de-cancha--apagada"} ${cancha.mantenimiento ? "ficha-de-cancha--en-obra" : ""} ${nueva ? "ficha-de-cancha--nueva" : ""}`}
      style={{ animationDelay: `${orden * 90}ms` }}
    >
      <div className="ficha-de-cancha__planta">
        <PlantaDeCancha tipo={cancha.tipo} tieneIluminacion={cancha.tieneIluminacion} juntoALaPared={cancha.caracteristicas.includes("JUNTO_A_LA_PARED")} trazar={nueva} />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 id={idDelNombre} className="font-titular text-2xl leading-none font-black break-words text-tinta">{cancha.nombre}</h3>
          <EstadoDeLaCancha cancha={cancha} hoy={hoy} />
        </div>
        <DatosDeLaCancha cancha={cancha} hoy={hoy} />
        <AccionesDeCancha cancha={cancha} alEditar={() => setEditando(true)} />
      </div>
      <TarjetaFlotante titulo={`Editar ${cancha.nombre}`} abierta={editando} alCerrar={() => setEditando(false)}>
        <FormularioDeCancha cancha={cancha} alTerminar={() => setEditando(false)} />
      </TarjetaFlotante>
    </article>
  );
}
