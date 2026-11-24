"use client";

import type { FormEvent } from "react";
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { useEdicionDeCancha } from "../hooks/use-edicion-de-cancha";
import type { Cancha } from "../servicios/canchas";
import { CampoDelNombre, SelectorDeDetalles, SelectorDeLuz, SelectorDeTamano } from "./controles-de-cancha";
import { ReservasAfectadas } from "./reservas-afectadas";

const LARGO_DE_LA_NOTA = 200;

/** Edición de los datos de una cancha dentro de su ficha. */
export function FormularioDeCancha({ cancha, alTerminar }: { cancha: Cancha; alTerminar: () => void }) {
  const { borrador, cambiar, errores, problema, enviando, guardar } = useEdicionDeCancha(cancha, alTerminar);
  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    void guardar();
  };
  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-4 p-4 sm:p-5">
      <CampoDelNombre id={`nombre-${cancha.id}`} valor={borrador.nombre} alEscribir={(nombre) => cambiar({ nombre })} error={errores.nombre} />
      <SelectorDeTamano
        valor={borrador.tipo}
        alElegir={(tipo) => cambiar({ tipo })}
        error={errores.tipo}
        ayuda={cancha.tipo === borrador.tipo ? undefined : "Las reservas ya hechas conservan su tamaño y su precio."}
      />
      <SelectorDeLuz valor={borrador.tieneIluminacion} alElegir={(tieneIluminacion) => cambiar({ tieneIluminacion })} error={errores.tieneIluminacion} />
      <SelectorDeDetalles elegidos={borrador.caracteristicas} alCambiar={(caracteristicas) => cambiar({ caracteristicas })} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`nota-${cancha.id}`} className="text-sm font-semibold text-tinta">
          Nota para el jugador <span className="font-normal text-grava">(opcional)</span>
        </label>
        <textarea
          id={`nota-${cancha.id}`}
          value={borrador.nota}
          maxLength={LARGO_DE_LA_NOTA}
          rows={2}
          aria-invalid={Boolean(errores.nota)}
          onChange={(evento) => cambiar({ nota: evento.target.value })}
          className="campo-de-cancha w-full resize-y"
        />
        <p className="text-xs text-grava tabular-nums">{borrador.nota.length} de {LARGO_DE_LA_NOTA}</p>
        <p aria-live="polite" className="text-sm font-medium text-error empty:hidden">{errores.nota}</p>
      </div>
      {problema && (problema.reservas ? <ReservasAfectadas mensaje={problema.mensaje} reservas={problema.reservas} /> : <p role="alert" className="text-sm font-medium text-error">{problema.mensaje}</p>)}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={enviando} className={BOTON_PRINCIPAL}>
          <TextoDeEnvio enviando={enviando} texto="Guardar cambios" textoAlEnviar="Guardando…" />
        </button>
        <button type="button" onClick={alTerminar} className={BOTON_SECUNDARIO}>Cancelar</button>
      </div>
    </form>
  );
}
