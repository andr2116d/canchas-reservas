"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { conElTurno } from "./turno-elegido";
import { useTurnoDeLaDireccion } from "./use-turno-de-la-direccion";

/** Un enlace entre ingresar y crear la cuenta que lleva consigo el turno elegido, si lo hay. */
export function EnlaceConElTurno({ href, ...resto }: ComponentProps<typeof Link> & { href: string }) {
  const turno = useTurnoDeLaDireccion();
  return <Link href={conElTurno(href, turno)} {...resto} />;
}
