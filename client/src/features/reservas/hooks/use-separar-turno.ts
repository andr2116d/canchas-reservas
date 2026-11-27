"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { RUTA_DE_ACCESO } from "@/compartido/sesion/destino-de-sesion";
import { conElTurno, type TurnoElegido } from "@/compartido/sesion/turno-elegido";
import type { ResumenDeReserva } from "../servicios/reservas";
import { separarTurno } from "../servicios/reservas.api";

export const rutaDeMiReserva = (codigo: string) => `/inicio/mis-reservas/${codigo}`;

/**
 * El material pedido y el envío: separa una sola vez con los montos que se ven. Si
 * cambiaron, vuelve a pedir el resumen y avisa; al separar, abre la reserva.
 */
export function useSepararTurno(turno: TurnoElegido, resumen: ResumenDeReserva, recargar: () => Promise<unknown>) {
  const router = useRouter();
  const bloqueado = useRef(false);
  const [pedidos, setPedidos] = useState<number[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string>();

  const alternar = (id: number) => setPedidos((antes) => (antes.includes(id) ? antes.filter((otro) => otro !== id) : [...antes, id]));

  async function separar() {
    if (bloqueado.current) return;
    bloqueado.current = true;
    setEnviando(true);
    setAviso(undefined);
    const { precio, adelanto } = resumen;
    const resultado = await separarTurno({ ...turno, precio, adelanto, adicionales: pedidos });
    if (resultado.tipo === "separada") return router.push(rutaDeMiReserva(resultado.codigo));
    if (resultado.tipo === "sin-sesion") return router.replace(conElTurno(RUTA_DE_ACCESO, turno));
    if (resultado.tipo === "montos-cambiaron") await recargar();
    setAviso(resultado.mensaje);
    setEnviando(false);
    bloqueado.current = false;
  }

  return { pedidos, alternar, separar, enviando, aviso };
}
