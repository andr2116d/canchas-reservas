"use client";

import { BOTON_SECUNDARIO, TARJETA } from "@/compartido/ui/estilos";
import { useSimulador } from "../hooks/use-simulador";
import { NOMBRE_DEL_TIPO, TIPOS_DE_CANCHA, type TipoDeCancha } from "../servicios/tarifas";
import { DesgloseDelValor } from "./desglose-del-valor";

const ENTRADA =
  "w-full rounded-lg border border-linea bg-papel px-3.5 py-2.5 text-base text-tinta tabular-nums outline-none " +
  "focus-visible:border-botella focus-visible:ring-3 focus-visible:ring-botella/25";

const OPCION =
  "cursor-pointer rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-grava transition-colors " +
  "has-checked:bg-papel has-checked:text-botella has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-botella";

function SelectorDeTipo({ tipo, elegir }: { tipo: TipoDeCancha; elegir: (tipo: TipoDeCancha) => void }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-tinta">Tipo de cancha</legend>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-linea/60 p-1">
        {TIPOS_DE_CANCHA.map((valor) => (
          <label key={valor} className={OPCION}>
            <input type="radio" name="tipo-simulado" value={valor} checked={tipo === valor} onChange={() => elegir(valor)} className="sr-only" />
            {NOMBRE_DEL_TIPO[valor]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Calcula, con las tarifas guardadas, lo que pagaría un turno que empieza a cierta hora. */
export function SimuladorDeValor({ inicioDeLaNoche }: { inicioDeLaNoche: string }) {
  const { tipo, setTipo, inicio, setInicio, resultado, calculando, calcular } = useSimulador();

  return (
    <section aria-labelledby="simulador-titulo" className={`${TARJETA} flex flex-col gap-5`}>
      <header className="flex flex-col gap-1">
        <h2 id="simulador-titulo" className="font-titular text-3xl font-black text-tinta">Simular el valor de un turno</h2>
        <p className="text-sm text-grava">
          Usa las tarifas guardadas. Si el turno empieza de día y sigue después de las {inicioDeLaNoche}, cada parte se
          cobra con la tarifa de su franja.
        </p>
      </header>
      <form onSubmit={calcular} className="grid items-end gap-4 sm:grid-cols-[1fr_10rem_auto]">
        <SelectorDeTipo tipo={tipo} elegir={setTipo} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="inicio-simulado" className="text-sm font-semibold text-tinta">Hora de inicio</label>
          <input id="inicio-simulado" type="time" required value={inicio} onChange={(evento) => setInicio(evento.target.value)} className={ENTRADA} />
        </div>
        <button type="submit" disabled={calculando} aria-busy={calculando} className={`${BOTON_SECUNDARIO} min-h-12`}>Calcular</button>
      </form>
      <div aria-live="polite">
        {resultado?.tipo === "error" && <p role="alert" className="rounded-lg bg-error-fondo px-4 py-3 text-sm text-error">{resultado.mensaje}</p>}
        {resultado?.tipo === "calculado" && <DesgloseDelValor valor={resultado.valor} />}
      </div>
    </section>
  );
}
