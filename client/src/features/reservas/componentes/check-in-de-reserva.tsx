"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { BOTON_PRINCIPAL, TARJETA } from "@/compartido/ui/estilos";
import { horaEnLima } from "@/compartido/ui/fecha-en-lima";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { enSoles } from "@/compartido/ui/textos-del-local";
import { cobroParaEnviar, esquemaDeCobro, type DatosDeCobro } from "../esquemas/recepcion.schema";
import { useCheckIn } from "../hooks/use-check-in";
import { registrarCheckIn, type CheckInRealizado, type DetalleDelCheckIn } from "../servicios/check-in.api";
import { mensajeDeRecepcion } from "../servicios/recepcion.api";
import { CamposDelCobro } from "./campos-del-cobro";

type CobroPendiente = Extract<DetalleDelCheckIn, { tipo: "listo" }>;

function MontosDelCheckIn({ detalle }: { detalle: CobroPendiente }) {
  const montos = [["Precio total con IGV", detalle.precio], ["Ya pagado", detalle.pagado], ["Saldo pendiente", detalle.saldo]];
  return (
    <dl className="grid grid-cols-1 gap-2 rounded-xl bg-tiza p-4 tabular-nums sm:grid-cols-3">
      {montos.map(([texto, monto]) => <div key={texto}><dt className="text-sm text-grava">{texto}</dt><dd className="text-lg font-bold text-cancha">{enSoles(monto)}</dd></div>)}
    </dl>
  );
}

function CheckInConfirmado({ resultado }: { resultado: CheckInRealizado }) {
  return (
    <section className={`${TARJETA} flex flex-col items-start gap-3`}>
      <h2 className="font-titular text-3xl font-black text-cancha">{resultado.tipo === "realizado" ? "Check-in registrado" : "El check-in ya se hizo"}</h2>
      <p role="status">Reserva {resultado.codigo} · Registrado a las {horaEnLima(resultado.checkInEn)}.</p>
    </section>
  );
}

function ConfirmarCheckIn({ detalle, alRegistrar }: { detalle: CobroPendiente; alRegistrar: (resultado: CheckInRealizado) => void }) {
  const cobrar = detalle.saldo !== "0.00";
  const [error, setError] = useState<string>();
  const formulario = useForm<DatosDeCobro>({ resolver: zodResolver(esquemaDeCobro(detalle.saldo, detalle.saldo)), defaultValues: { cobrar, monto: detalle.saldo, metodo: "", numeroOperacion: "" } });
  const { isSubmitting } = formulario.formState;
  const enviar = formulario.handleSubmit(async (datos) => {
    setError(undefined);
    const respuesta = await registrarCheckIn(detalle.codigo, cobroParaEnviar(datos));
    if (respuesta.tipo === "aceptado") return alRegistrar(respuesta.cuerpo);
    if (respuesta.tipo === "rechazado" && Object.keys(respuesta.errores).length) marcarErroresDelServer(formulario, respuesta.errores);
    else setError(mensajeDeRecepcion(respuesta));
  });

  return (
    <section aria-labelledby="check-in-detalle" className={`${TARJETA} flex flex-col gap-4`}>
      <h2 id="check-in-detalle" className="font-titular text-3xl font-black text-cancha">Reserva {detalle.codigo}</h2>
      <MontosDelCheckIn detalle={detalle} />
      <FormProvider {...formulario}>
        <form noValidate className="flex flex-col gap-4" onSubmit={enviar}>
          {cobrar ? <CamposDelCobro ayuda="Registra el saldo exacto del turno." /> : <p className="text-sm font-semibold text-botella">El turno está pagado. Puedes registrar la llegada sin cobro.</p>}
          <ErrorGeneral mensaje={error} />
          <button type="submit" className={`${BOTON_PRINCIPAL} self-start`} disabled={isSubmitting}><TextoDeEnvio enviando={isSubmitting} texto={cobrar ? "Cobrar y hacer check-in" : "Hacer check-in"} textoAlEnviar="Registrando…" /></button>
        </form>
      </FormProvider>
    </section>
  );
}

export function CheckInDeReserva({ codigo }: { codigo: string }) {
  const consulta = useCheckIn(codigo);
  const [confirmado, setConfirmado] = useState<CheckInRealizado>();
  if (confirmado) return <CheckInConfirmado resultado={confirmado} />;
  if (!consulta) return <CargaDeContenido texto="Consultando la reserva…" />;
  if (consulta.tipo !== "aceptado") return <ErrorGeneral mensaje={mensajeDeRecepcion(consulta)} />;
  const detalle = consulta.cuerpo;
  return detalle.tipo === "ya-realizado" ? <CheckInConfirmado resultado={detalle} /> : <ConfirmarCheckIn detalle={detalle} alRegistrar={setConfirmado} />;
}
