"use client";

import type { FormEvent, ReactNode } from "react";
import { NOMBRE_DEL_TIPO, TIPOS_DE_CANCHA, type TipoDeCancha } from "@/compartido/canchas/tipo-de-cancha";
import { BOTON_PRINCIPAL } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { type ModoDeAlta, useAltaDeCanchas } from "../hooks/use-alta-de-canchas";
import { ContadoresDeCanchas, NombresPropuestos } from "./alta-de-varias";
import { CampoDelNombre, Segmento, SelectorDeDetalles, SelectorDeLuz, SelectorDeTamano } from "./controles-de-cancha";
import { PreviaDelAlta } from "./previa-del-alta";

export interface AltaDeCanchasProps {
  /** Nombres de las canchas que ya existen, para proponer los siguientes. */
  existentes: string[];
  /** Tamaños que aún no tienen tarifa: sus turnos no se ofrecerán hasta guardarla. */
  tiposSinTarifa: TipoDeCancha[];
  alCrear: (ids: number[]) => void;
  /** Señal que apunta al panel después de crear las primeras canchas. */
  senal?: ReactNode;
}

const MODOS: { valor: ModoDeAlta; texto: string }[] = [
  { valor: "una", texto: "Una" },
  { valor: "varias", texto: "Varias a la vez" },
];

/** En la primera vez, cada grupo del formulario es un paso numerado para que se sepa por dónde seguir. */
function Paso({ numero, titulo, conPasos, children }: { numero: number; titulo: string; conPasos: boolean; children: ReactNode }) {
  if (!conPasos) return children;
  return (
    <section className="paso-del-alta">
      <h3><b>{numero}</b> {titulo}</h3>
      {children}
    </section>
  );
}

function AvisoDeTarifa({ tipos }: { tipos: TipoDeCancha[] }) {
  if (tipos.length === 0) return null;
  const nombres = tipos.map((tipo) => NOMBRE_DEL_TIPO[tipo]).join(" y ");
  return (
    <p className="rounded-xl bg-[#fbf1d9] px-3 py-2 text-sm text-[#6d4600]">
      {nombres} aún no tiene tarifa: sus turnos no se ofrecerán hasta guardarla en Reglas de reserva.
    </p>
  );
}

/** Alta de canchas: una por una o varias a la vez. Sin canchas, ocupa toda la tarjeta y guía con pasos. */
export function AltaDeCanchas({ existentes, tiposSinTarifa, alCrear, senal }: AltaDeCanchasProps) {
  const alta = useAltaDeCanchas(existentes, alCrear);
  const primeraVez = existentes.length === 0;
  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    void alta.enviar();
  };
  const tipos = alta.modo === "una" ? (alta.individual.tipo ? [alta.individual.tipo] : []) : TIPOS_DE_CANCHA.filter((t) => alta.grupo.cantidad[t] > 0);
  return (
    <section aria-labelledby="titulo-del-alta" className={primeraVez ? "alta-de-canchas alta-de-canchas--completa" : "alta-de-canchas"}>
      <div className="alta-de-canchas__cabeza">
        {senal}
        <h2 id="titulo-del-alta" className="font-titular text-3xl leading-none font-black text-tinta">
          {primeraVez ? "Agrega las canchas del local" : "Agregar canchas"}
        </h2>
        <p className="text-sm text-grava">
          {primeraVez
            ? "Aún no hay canchas. Empieza aquí: elige cuántas hay de cada tamaño y cómo son. Todas quedan operativas y luego puedes editar cada una."
            : "Todas empiezan operativas. Luego puedes editar cada una."}
        </p>
        <Segmento etiqueta="Cuántas agregar" opciones={MODOS} valor={alta.modo} alElegir={alta.elegirModo} />
      </div>
      <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
        {alta.modo === "una" ? <CamposDeUna alta={alta} conPasos={primeraVez} /> : <CamposDeVarias alta={alta} conPasos={primeraVez} />}
        <AvisoDeTarifa tipos={tiposSinTarifa.filter((tipo) => tipos.includes(tipo))} />
        {alta.errores.general && <p role="alert" className="text-sm font-medium text-error">{alta.errores.general}</p>}
        <button type="submit" disabled={alta.enviando} className={`${BOTON_PRINCIPAL} w-fit`}>
          <TextoDeEnvio enviando={alta.enviando} texto={textoDelBoton(alta)} textoAlEnviar="Agregando…" />
        </button>
      </form>
      {primeraVez && <PreviaDeLaPrimeraVez alta={alta} />}
    </section>
  );
}

type Alta = ReturnType<typeof useAltaDeCanchas>;

function textoDelBoton(alta: Alta): string {
  if (alta.modo === "una") return "Agregar cancha";
  const total = alta.propuestas.length;
  return total > 1 ? `Agregar ${total} canchas` : total === 1 ? "Agregar 1 cancha" : "Agregar canchas";
}

function CamposDeUna({ alta, conPasos }: { alta: Alta; conPasos: boolean }) {
  const { individual, cambiarIndividual, errores } = alta;
  return (
    <>
      <Paso numero={1} titulo="Nombre y tamaño" conPasos={conPasos}>
        <CampoDelNombre id="nombre-de-la-cancha-nueva" valor={individual.nombre} alEscribir={(nombre) => cambiarIndividual({ nombre })} error={errores.nombre} />
        <SelectorDeTamano valor={individual.tipo} alElegir={(tipo) => cambiarIndividual({ tipo })} error={errores.tipo} />
      </Paso>
      <Paso numero={2} titulo="Cómo es" conPasos={conPasos}>
        <SelectorDeLuz valor={individual.tieneIluminacion} alElegir={(tieneIluminacion) => cambiarIndividual({ tieneIluminacion })} error={errores.tieneIluminacion} />
        <SelectorDeDetalles elegidos={individual.caracteristicas} alCambiar={(caracteristicas) => cambiarIndividual({ caracteristicas })} />
      </Paso>
    </>
  );
}

function CamposDeVarias({ alta, conPasos }: { alta: Alta; conPasos: boolean }) {
  const { grupo, cambiarGrupo, propuestas, errores } = alta;
  return (
    <>
      <Paso numero={1} titulo="Cuántas de cada tamaño" conPasos={conPasos}>
        <ContadoresDeCanchas grupo={grupo} alCambiar={(cantidad) => cambiarGrupo({ cantidad })} error={errores.cantidad} />
      </Paso>
      <Paso numero={2} titulo="Cómo son" conPasos={conPasos}>
        <SelectorDeLuz valor={grupo.tieneIluminacion} alElegir={(tieneIluminacion) => cambiarGrupo({ tieneIluminacion })} error={errores.tieneIluminacion} />
        <SelectorDeDetalles elegidos={grupo.caracteristicas} alCambiar={(caracteristicas) => cambiarGrupo({ caracteristicas })} />
      </Paso>
      {propuestas.length > 0 && (
        <Paso numero={3} titulo="Revisa los nombres" conPasos={conPasos}>
          <NombresPropuestos propuestas={propuestas} errores={errores} alCambiar={(clave, nombre) => cambiarGrupo({ nombres: { ...grupo.nombres, [clave]: nombre } })} />
        </Paso>
      )}
    </>
  );
}

function PreviaDeLaPrimeraVez({ alta }: { alta: Alta }) {
  const enUna = alta.modo === "una";
  const { individual, grupo } = alta;
  const canchas = enUna ? (individual.tipo ? [{ clave: "una", tipo: individual.tipo, nombre: individual.nombre }] : []) : alta.propuestas;
  return (
    <PreviaDelAlta
      canchas={canchas}
      tieneIluminacion={enUna ? individual.tieneIluminacion : grupo.tieneIluminacion}
      caracteristicas={enUna ? individual.caracteristicas : grupo.caracteristicas}
      vacia={enUna ? "Elige el tamaño y aquí verás la cancha." : "Suma canchas con los botones + y aquí las verás."}
    />
  );
}
