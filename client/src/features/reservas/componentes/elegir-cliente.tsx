"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { CampoDeTexto } from "@/compartido/formulario/campo-de-texto";
import { CamposDelDocumento } from "@/compartido/formulario/campos-del-documento";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { filtrarCelular } from "@/compartido/formulario/filtros-de-entrada";
import { marcarErroresDelServer } from "@/compartido/formulario/marcar-errores-del-server";
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO, TARJETA } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { esquemaDeAlta, esquemaDeBusqueda, VERSION_DEL_AVISO, type DatosDeAlta, type DatosDeBusqueda } from "../esquemas/recepcion.schema";
import { buscarClientes, mensajeDeRecepcion, registrarCliente, type ClienteDeRecepcion } from "../servicios/recepcion.api";

export function identidad(cliente: ClienteDeRecepcion) {
  const tipo = cliente.tipoDocumento === "DNI" ? "DNI" : "Carné de extranjería";
  return cliente.numeroDocumento ? `${cliente.nombre} · ${tipo} ${cliente.numeroDocumento}` : cliente.nombre;
}

type Seleccionar = (cliente: ClienteDeRecepcion, existentePorDocumento?: boolean) => void;

function AvisoDePrivacidad() {
  const { control, setValue, formState: { errors } } = useFormContext<DatosDeAlta>();
  const aviso = useWatch({ control, name: "versionDelAviso" });
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-2 text-sm text-tinta">
        <input type="checkbox" className="mt-1 accent-botella" checked={aviso === VERSION_DEL_AVISO} aria-invalid={Boolean(errors.versionDelAviso)} aria-describedby={errors.versionDelAviso && "error-aviso"} onChange={(evento) => setValue("versionDelAviso", evento.currentTarget.checked ? VERSION_DEL_AVISO : "", { shouldValidate: true })} />
        Informé al cliente sobre el aviso de privacidad.
      </label>
      <a href="/legal/privacidad" target="_blank" rel="noopener" className="w-fit text-sm font-bold text-botella underline">Leer el aviso de privacidad</a>
      {errors.versionDelAviso && <p id="error-aviso" role="alert" className="text-sm text-error">{errors.versionDelAviso.message}</p>}
    </div>
  );
}

function AltaDeCliente({ busqueda, alElegir, alVolver }: { busqueda: DatosDeBusqueda; alElegir: Seleccionar; alVolver: () => void }) {
  const formulario = useForm<DatosDeAlta>({
    resolver: zodResolver(esquemaDeAlta),
    defaultValues: {
      nombres: "", apellidos: "", fechaNacimiento: "", correo: "", versionDelAviso: "",
      tipoDocumento: busqueda.tipoDocumento,
      numeroDocumento: busqueda.por === "documento" ? busqueda.numeroDocumento : "",
      celular: busqueda.por === "celular" ? busqueda.celular : "",
    },
  });
  const [error, setError] = useState<string>();
  const { isSubmitting } = formulario.formState;
  const enviar = formulario.handleSubmit(async (datos) => {
    setError(undefined);
    const respuesta = await registrarCliente(datos);
    if (respuesta.tipo === "aceptado") return alElegir(respuesta.cuerpo.cliente, respuesta.cuerpo.existente);
    if (respuesta.tipo === "rechazado" && Object.keys(respuesta.errores).length) marcarErroresDelServer(formulario, respuesta.errores);
    else setError(mensajeDeRecepcion(respuesta));
  });

  return (
    <section className={TARJETA} aria-labelledby="alta-cliente">
      <h2 id="alta-cliente" className="mb-4 font-titular text-3xl font-black text-cancha">Registrar cliente</h2>
      <FormProvider {...formulario}>
        <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoDeTexto nombre="nombres" etiqueta="Nombres" maxLength={80} />
            <CampoDeTexto nombre="apellidos" etiqueta="Apellidos" maxLength={80} />
            <CampoDeTexto nombre="fechaNacimiento" etiqueta="Fecha de nacimiento" type="date" />
            <CampoDeTexto nombre="celular" etiqueta="Celular" inputMode="tel" filtrarEntrada={filtrarCelular} />
          </div>
          <CamposDelDocumento />
          <CampoDeTexto nombre="correo" etiqueta="Correo" type="email" maxLength={254} opcional />
          <AvisoDePrivacidad />
          <ErrorGeneral mensaje={error} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={BOTON_PRINCIPAL} disabled={isSubmitting}><TextoDeEnvio enviando={isSubmitting} texto="Guardar cliente" textoAlEnviar="Guardando…" /></button>
            <button type="button" className={BOTON_SECUNDARIO} onClick={alVolver} disabled={isSubmitting}>Volver a la búsqueda</button>
          </div>
        </form>
      </FormProvider>
    </section>
  );
}

export function ElegirCliente({ alElegir }: { alElegir: Seleccionar }) {
  const formulario = useForm<DatosDeBusqueda>({ resolver: zodResolver(esquemaDeBusqueda), defaultValues: { por: "documento", tipoDocumento: "DNI", numeroDocumento: "", celular: "" } });
  const por = useWatch({ control: formulario.control, name: "por" });
  const [encontrados, setEncontrados] = useState<ClienteDeRecepcion[]>();
  const [ultimaBusqueda, setUltimaBusqueda] = useState<DatosDeBusqueda>();
  const [registrar, setRegistrar] = useState(false);
  const [error, setError] = useState<string>();
  const { isSubmitting } = formulario.formState;
  const buscar = formulario.handleSubmit(async (datos) => {
    setError(undefined);
    setEncontrados(undefined);
    const respuesta = await buscarClientes(datos);
    if (respuesta.tipo === "aceptado") {
      setUltimaBusqueda(datos);
      setEncontrados(respuesta.cuerpo);
    } else if (respuesta.tipo === "rechazado" && Object.keys(respuesta.errores).length) {
      marcarErroresDelServer(formulario, respuesta.errores);
    } else setError(mensajeDeRecepcion(respuesta));
  });

  if (registrar && ultimaBusqueda) return <AltaDeCliente busqueda={ultimaBusqueda} alElegir={alElegir} alVolver={() => setRegistrar(false)} />;

  return (
    <section className={TARJETA} aria-labelledby="buscar-cliente">
      <h2 id="buscar-cliente" className="mb-4 font-titular text-3xl font-black text-cancha">Buscar cliente</h2>
      <FormProvider {...formulario}>
        <form noValidate onSubmit={buscar} className="flex flex-col gap-4">
          <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
            <legend className="mb-2 text-sm font-semibold">Buscar por</legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2"><input type="radio" value="documento" className="accent-botella" {...formulario.register("por")} /> Documento</label>
              <label className="flex items-center gap-2"><input type="radio" value="celular" className="accent-botella" {...formulario.register("por")} /> Celular</label>
            </div>
            {por === "documento" ? <CamposDelDocumento /> : <CampoDeTexto nombre="celular" etiqueta="Número de celular" inputMode="tel" filtrarEntrada={filtrarCelular} />}
          </fieldset>
          <ErrorGeneral mensaje={error} />
          <button type="submit" className={`${BOTON_PRINCIPAL} self-start`} disabled={isSubmitting}><TextoDeEnvio enviando={isSubmitting} texto="Buscar" textoAlEnviar="Buscando…" /></button>
        </form>
      </FormProvider>
      {encontrados?.length === 0 && <div className="mt-4 flex flex-col items-start gap-2"><p role="status">No se encontraron clientes.</p><button type="button" className={BOTON_SECUNDARIO} onClick={() => setRegistrar(true)}>Registrar cliente</button></div>}
      {Boolean(encontrados?.length) && <ul aria-label="Clientes encontrados" className="mt-4 flex flex-col gap-2">{encontrados?.map((cliente) => <li key={cliente.id}><button type="button" className={BOTON_SECUNDARIO} onClick={() => alElegir(cliente)}>{identidad(cliente)}</button></li>)}</ul>}
    </section>
  );
}
