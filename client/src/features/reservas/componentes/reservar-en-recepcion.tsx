"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import type { TurnoElegido } from "@/compartido/sesion/turno-elegido";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO, TARJETA } from "@/compartido/ui/estilos";
import { horaEnLima } from "@/compartido/ui/fecha-en-lima";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { diaLargo, enSoles } from "@/compartido/ui/textos-del-local";
import { cobroParaEnviar, esquemaDeCobro, type DatosDeCobro } from "../esquemas/recepcion.schema";
import { useCuentaRegresiva } from "../hooks/use-cuenta-regresiva";
import { useResumenDeRecepcion } from "../hooks/use-reserva-en-recepcion";
import { mensajeDeRecepcion, reservarDesdeRecepcion, type ClienteDeRecepcion, type ReservaDeRecepcion, type ResumenDeRecepcion } from "../servicios/recepcion.api";
import { tiempoRestante } from "../utilidades/textos-de-la-reserva";
import { CamposDelCobro } from "./campos-del-cobro";
import { ElegirCliente, identidad } from "./elegir-cliente";
import { PlazosDeCancelacion } from "./plazos-de-cancelacion";

function ConfirmarEnRecepcion({ turno, cliente, resumen, alReservar, actualizar }: { turno: TurnoElegido; cliente: ClienteDeRecepcion; resumen: ResumenDeRecepcion; alReservar: (reserva: ReservaDeRecepcion) => void; actualizar: () => void }) {
  const [error, setError] = useState<string>();
  const formulario = useForm<DatosDeCobro>({ resolver: zodResolver(esquemaDeCobro(resumen.adelanto, resumen.precio)), defaultValues: { cobrar: false, monto: resumen.adelanto, metodo: "", numeroOperacion: "" } });
  const cobrar = useWatch({ control: formulario.control, name: "cobrar" });
  const { isSubmitting } = formulario.formState;
  const enviar = formulario.handleSubmit(async (datos) => {
    setError(undefined);
    const respuesta = await reservarDesdeRecepcion(turno, cliente.id, resumen, cobroParaEnviar(datos));
    if (respuesta.tipo === "aceptado") return alReservar(respuesta.cuerpo);
    if (respuesta.tipo === "rechazado" && respuesta.datos?.precio) {
      setError("Cambió el precio o el adelanto. Revisa los nuevos montos antes de confirmar.");
      actualizar();
      return;
    }
    if (respuesta.tipo === "rechazado") {
      const camposDelCobro = new Set(["monto", "metodo", "numeroOperacion"]);
      const campos = Object.fromEntries(Object.entries(respuesta.errores).map(([campo, texto]) => [campo.replace(/^cobro\./, ""), texto]).filter(([campo]) => camposDelCobro.has(campo)));
      if (Object.keys(campos).length) return marcarErroresDelServer(formulario, campos);
    }
    setError(mensajeDeRecepcion(respuesta));
  });

  return (
    <>
      <section className={TARJETA} aria-labelledby="cobro">
        <h2 id="cobro" className="font-titular text-3xl font-black text-cancha">Confirmar reserva</h2>
        <p className="mt-1 font-semibold text-tinta">{resumen.cancha.nombre} · {resumen.desde}–{resumen.hasta}</p>
        <p className="text-sm text-grava first-letter:uppercase">{diaLargo(resumen.fecha)}</p>
        <dl className="my-4 grid gap-2 tabular-nums sm:grid-cols-2">
          <div><dt className="text-sm text-grava">Precio total con IGV</dt><dd className="font-bold">{enSoles(resumen.precio)}</dd></div>
          <div><dt className="text-sm text-grava">Adelanto mínimo ({resumen.porcentajeDeAdelanto} %)</dt><dd className="font-bold">{enSoles(resumen.adelanto)}</dd></div>
        </dl>
        <FormProvider {...formulario}>
          <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
            <label className="flex items-center gap-2 font-semibold"><input type="checkbox" className="accent-botella" {...formulario.register("cobrar")} /> Registrar adelanto</label>
            {cobrar && <CamposDelCobro />}
            {!cobrar && <p className="text-sm text-grava">El turno queda pendiente de pago por hasta {resumen.minutosDeRetencion} minutos.</p>}
            <ErrorGeneral mensaje={error} />
            <button type="submit" className={`${BOTON_PRINCIPAL} self-start`} disabled={isSubmitting}><TextoDeEnvio enviando={isSubmitting} texto="Confirmar reserva" textoAlEnviar="Guardando…" /></button>
          </form>
        </FormProvider>
      </section>
      <PlazosDeCancelacion plazos={resumen.plazos} nota="Informa esta regla al cliente antes de confirmar." />
    </>
  );
}

function TurnoDelCliente({ turno, cliente, alReservar }: { turno: TurnoElegido; cliente: ClienteDeRecepcion; alReservar: (reserva: ReservaDeRecepcion) => void }) {
  const { resultado, volverAConsultar } = useResumenDeRecepcion(turno, cliente.id);
  if (!resultado) return <CargaDeContenido texto="Revisando el turno…" />;
  if (resultado.tipo !== "aceptado") return <ErrorGeneral mensaje={mensajeDeRecepcion(resultado)} />;
  return <ConfirmarEnRecepcion turno={turno} cliente={cliente} resumen={resultado.cuerpo} alReservar={alReservar} actualizar={volverAConsultar} />;
}

function ReservaRegistrada({ reserva, fecha }: { reserva: ReservaDeRecepcion; fecha: string }) {
  const segundos = useCuentaRegresiva(reserva.venceEn, reserva.ahora);
  const estado = reserva.estado === "CONFIRMADA" ? "Reserva confirmada" : segundos === 0 ? "Reserva expirada" : "Reserva pendiente de pago";
  return (
    <section className={`${TARJETA} flex flex-col items-start gap-3`}>
      <h2 className="font-titular text-3xl font-black text-cancha">{estado}</h2>
      <p>Código de la reserva <strong>{reserva.codigo}</strong></p>
      {reserva.venceEn && segundos !== undefined && segundos > 0 && (
        <p className="tabular-nums">Retención restante <strong role="timer" aria-label="Tiempo restante de la reserva">{tiempoRestante(segundos)}</strong> · Hasta las {horaEnLima(reserva.venceEn)}.</p>
      )}
      <Link href={`/recepcion?fecha=${fecha}`} className={BOTON_PRINCIPAL}>Ir a la agenda</Link>
    </section>
  );
}

export function ReservarEnRecepcion({ turno }: { turno: TurnoElegido }) {
  const [seleccion, setSeleccion] = useState<{ cliente: ClienteDeRecepcion; repetido?: boolean }>();
  const [reserva, setReserva] = useState<ReservaDeRecepcion>();
  if (reserva) return <ReservaRegistrada reserva={reserva} fecha={turno.fecha} />;
  if (!seleccion) return <ElegirCliente alElegir={(cliente, repetido) => setSeleccion({ cliente, repetido })} />;
  return (
    <div className="grid gap-4">
      <div className={`${TARJETA} flex flex-wrap items-center justify-between gap-3`}>
        <div><p className="text-sm text-grava">Cliente</p><p className="font-semibold">{identidad(seleccion.cliente)}</p>{seleccion.repetido && <p role="status" className="text-sm text-grava">El documento ya estaba registrado. Se usará la cuenta existente.</p>}</div>
        <button type="button" className={BOTON_SECUNDARIO} onClick={() => setSeleccion(undefined)}>Cambiar cliente</button>
      </div>
      <TurnoDelCliente key={seleccion.cliente.id} turno={turno} cliente={seleccion.cliente} alReservar={setReserva} />
    </div>
  );
}
