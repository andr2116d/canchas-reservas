import Link from "next/link";
import { RUTA_DE_CAMBIO } from "../sesion/destino-de-sesion";

/** Recuerda a quien dejó el cambio para después que su contraseña sigue siendo temporal y cuánto le queda. */
export function AvisoDeContrasenaTemporal({ tiempoRestante }: { tiempoRestante?: string }) {
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-alerta/30 bg-[#fff6dc] px-4 py-3 text-sm text-tinta">
      <p>
        <strong className="font-bold">Sigues con una contraseña temporal.</strong>{" "}
        {tiempoRestante && <>Vence en {tiempoRestante}. </>}Cámbiala para que solo tú la conozcas.
      </p>
      <Link href={RUTA_DE_CAMBIO} className="font-bold text-botella underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-botella">
        Cambiarla ahora
      </Link>
    </div>
  );
}
