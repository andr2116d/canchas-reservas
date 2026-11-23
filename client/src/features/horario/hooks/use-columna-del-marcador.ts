"use client";

import { type ChangeEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { bajar, dosCifras, subir } from "../utilidades/pasos-del-marcador";

interface Opciones {
  valor: number;
  maximo: number;
  paso: number;
  alCambiar: (valor: number) => void;
  alCompletar?: () => void;
}

/** La rueda cambia el valor solo cuando el campo tiene el foco, para no robar el scroll. */
function useRueda(alSubir: () => void, alBajar: () => void) {
  const ref = useRef<HTMLInputElement>(null);
  const acciones = useRef({ alSubir, alBajar });
  useEffect(() => {
    acciones.current = { alSubir, alBajar };
  });
  useEffect(() => {
    const entrada = ref.current;
    if (!entrada) return;
    const girar = (evento: WheelEvent) => {
      if (document.activeElement !== entrada || evento.deltaY === 0) return;
      evento.preventDefault();
      if (evento.deltaY < 0) acciones.current.alSubir();
      else acciones.current.alBajar();
    };
    entrada.addEventListener("wheel", girar, { passive: false });
    return () => entrada.removeEventListener("wheel", girar);
  }, []);
  return ref;
}

/**
 * Comportamiento de una cifra del marcador: flechas, Inicio y Fin, rueda y
 * escritura directa. Lo escrito se confirma al completar dos cifras o al salir.
 */
export function useColumnaDelMarcador({ valor, maximo, paso, alCambiar, alCompletar }: Opciones) {
  const [escrito, setEscritoVisible] = useState<string>();
  // Copia síncrona: al saltar a los minutos, el blur no debe confirmar lo ya confirmado.
  const escritoRef = useRef<string>(undefined);
  const setEscrito = (texto: string | undefined) => {
    escritoRef.current = texto;
    setEscritoVisible(texto);
  };
  const alSubir = () => alCambiar(subir(valor, paso, maximo));
  const alBajar = () => alCambiar(bajar(valor, paso, maximo));
  const ref = useRueda(alSubir, alBajar);

  function confirmar(texto: string) {
    setEscrito(undefined);
    if (texto !== "") alCambiar(Math.min(Number(texto), maximo));
  }

  const eventos = {
    onFocus: (evento: { target: HTMLInputElement }) => evento.target.select(),
    onChange(evento: ChangeEvent<HTMLInputElement>) {
      const cifras = evento.target.value.replace(/\D/g, "").slice(0, 2);
      if (cifras.length < 2) return setEscrito(cifras);
      confirmar(cifras);
      alCompletar?.();
    },
    onKeyDown(evento: KeyboardEvent<HTMLInputElement>) {
      const acciones: Record<string, () => void> = { ArrowUp: alSubir, ArrowDown: alBajar, Home: () => alCambiar(0), End: () => alCambiar(maximo) };
      const accion = acciones[evento.key];
      if (!accion) return;
      evento.preventDefault();
      accion();
    },
    onBlur: () => escritoRef.current !== undefined && confirmar(escritoRef.current),
  };

  return { ref, texto: escrito ?? dosCifras(valor), eventos, alSubir, alBajar };
}
