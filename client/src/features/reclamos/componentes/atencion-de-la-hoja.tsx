"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { resultadoDeAccion } from "@/compartido/api/resultado-de-accion";
import type { RespuestaDeLaApi } from "@/compartido/api/enviar-json";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { type HojaParaAtender, type Motivo, NOMBRE_DEL_MOTIVO } from "../servicios/reclamos";
import { abrirHoja, clasificarHoja, tramitarComoReclamo } from "../servicios/reclamos.api";
import { DatosDeLaHoja } from "./datos-de-la-hoja";
import { EtiquetaDeEstado, TipoYMotivo } from "./etiquetas-de-la-hoja";
import { PlazoDeLaHoja } from "./plazo-de-la-hoja";
import { RegistroDeLaHoja } from "./registro-de-la-hoja";
import { RespuestaDeLaHoja } from "./respuesta-de-la-hoja";

const FECHA = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

function Caja({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section aria-label={titulo} className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-papel p-5 shadow-sm">
      <h2 className="font-titular text-2xl leading-none font-black text-cancha">{titulo}</h2>
      {children}
    </section>
  );
}

/** Aplica una acción a la hoja y la reemplaza por cómo quedó; si falla, deja el mensaje. */
function useHojaEnAtencion(inicial: HojaParaAtender) {
  const router = useRouter();
  const [hoja, setHoja] = useState(inicial);
  const [error, setError] = useState<string>();
  async function aplicar(accion: () => Promise<RespuestaDeLaApi<HojaParaAtender>>) {
    setError(undefined);
    const respuesta = await accion();
    if (respuesta.tipo === "aceptado") {
      setHoja(respuesta.cuerpo);
      router.refresh();
      return;
    }
    const rechazo = resultadoDeAccion(respuesta);
    setError(rechazo.tipo === "datos-rechazados" ? Object.values(rechazo.errores)[0] : rechazo.tipo === "error" ? rechazo.mensaje : undefined);
  }
  return { hoja, setHoja, error, aplicar };
}

function Clasificacion({ hoja, aplicar }: { hoja: HojaParaAtender; aplicar: ReturnType<typeof useHojaEnAtencion>["aplicar"] }) {
  const puedeSerReclamo = hoja.tipo === "QUEJA" && hoja.estado !== "RESPONDIDA";
  return (
    <Caja titulo="Clasificación">
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-tinta">
        Motivo
        <select value={hoja.motivo ?? ""} onChange={(e) => aplicar(() => clasificarHoja(hoja.numero, e.target.value as Motivo))} className="rounded-xl border border-linea bg-papel px-3 py-2.5 font-normal focus-visible:outline-2 focus-visible:outline-botella">
          {!hoja.motivo && <option value="" disabled>Elige un motivo</option>}
          {Object.entries(NOMBRE_DEL_MOTIVO).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
      </label>
      {puedeSerReclamo && (
        <div className="flex flex-col gap-2 text-sm text-grava">
          <p>Si la queja describe un problema con el servicio, se tramita como reclamo.</p>
          <button type="button" onClick={() => aplicar(() => tramitarComoReclamo(hoja.numero))} className={`${BOTON_SECUNDARIO} self-start`}>Tramitar como reclamo</button>
        </div>
      )}
      {hoja.tipo !== hoja.tipoMarcado && <p className="text-sm text-grava">La persona la marcó como queja; se tramita como reclamo.</p>}
    </Caja>
  );
}

/** La hoja abierta por administración: al abrirla pasa a «en atención»; se clasifica y se responde. */
export function AtencionDeLaHoja({ inicial }: { inicial: HojaParaAtender }) {
  const { hoja, setHoja, error, aplicar } = useHojaEnAtencion(inicial);
  const numero = inicial.numero;
  const esNueva = inicial.estado === "NUEVA";
  useEffect(() => {
    if (esNueva) void aplicar(() => abrirHoja(numero));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir la pantalla
  }, [numero, esNueva]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-papel p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <EtiquetaDeEstado estado={hoja.estado} vencida={hoja.vencida} />
          <TipoYMotivo tipo={hoja.tipo} motivo={hoja.motivo} />
        </div>
        <PlazoDeLaHoja plazo={hoja} />
        <p className="text-sm text-grava">
          Registrada el {FECHA.format(new Date(hoja.registradaEn))} · la persona eligió la respuesta {hoja.medioDeRespuesta === "CARTA" ? "por carta a su domicilio" : "por correo"}.
        </p>
      </div>
      <ErrorGeneral mensaje={error} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-5">
          <Caja titulo="La hoja"><DatosDeLaHoja hoja={hoja} /></Caja>
          <Caja titulo={hoja.respuesta ? "Respuesta" : "Responder"}>
            {hoja.respuesta ? (
              <>
                <p className="rounded-xl bg-tiza px-4 py-3 whitespace-pre-line text-tinta">{hoja.respuesta.texto}</p>
                <p className="text-sm text-grava">La respuesta no se edita. Se conserva con la hoja al menos 2 años.</p>
              </>
            ) : (
              <RespuestaDeLaHoja hoja={hoja} alResponder={setHoja} />
            )}
          </Caja>
        </div>
        <div className="flex flex-col gap-5 lg:sticky lg:top-24">
          <Clasificacion hoja={hoja} aplicar={aplicar} />
          <Caja titulo="Registro"><RegistroDeLaHoja cambios={hoja.cambios} registradaEn={hoja.registradaEn} /></Caja>
        </div>
      </div>
    </div>
  );
}
