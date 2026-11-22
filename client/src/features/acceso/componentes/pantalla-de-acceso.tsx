import Link from "next/link";
import { Suspense } from "react";
import { FondoDeCancha } from "@/compartido/ui/fondo-de-cancha";
import { CAMBIO_DE_ACCESO, TransicionDeAcceso } from "@/compartido/ui/transicion-de-acceso";
import { AvisoDeInactividad, type ParametrosDeAcceso } from "./aviso-de-inactividad";
import { FormularioDeAcceso } from "./formulario-de-acceso";
import { RedirigirSiHaySesion } from "./redirigir-si-hay-sesion";
import { TarjetaDeAcceso } from "./tarjeta-de-acceso";

/**
 * Pantalla de inicio de sesión. La cancha y la tarjeta son estáticas para que
 * entren con la transición desde el registro; la consulta de la sesión y el
 * aviso de inactividad cargan aparte, sin retrasar la tarjeta.
 */
export function PantallaDeAcceso({ parametros }: { parametros: ParametrosDeAcceso }) {
  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-cancha">
      <Suspense fallback={null}>
        <RedirigirSiHaySesion />
      </Suspense>
      <FondoDeCancha encuadre="acceso" />
      <TransicionDeAcceso parte="tarjeta">
        <TarjetaDeAcceso titulo="Inicia sesión" sobreCancha>
          <Suspense fallback={null}>
            <AvisoDeInactividad parametros={parametros} />
          </Suspense>
          <FormularioDeAcceso />
          <p className="mt-4 text-center text-sm text-grava sm:mt-6">
            ¿Todavía no tienes cuenta?{" "}
            <Link
              href="/registro"
              transitionTypes={[CAMBIO_DE_ACCESO]}
              className="inline-flex min-h-11 items-center rounded-sm font-bold text-botella underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botella"
            >
              Crea tu cuenta de jugador
            </Link>
          </p>
        </TarjetaDeAcceso>
      </TransicionDeAcceso>
    </div>
  );
}
