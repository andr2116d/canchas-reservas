import { BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";

interface AvisoDeReactivacionProps {
  nombres: string;
  reactivando: boolean;
  alReactivar: () => void;
  alCancelar: () => void;
}

/** Ofrece reactivar la cuenta desactivada que coincide, en vez de crear otra. */
export function AvisoDeReactivacion({ nombres, reactivando, alReactivar, alCancelar }: AvisoDeReactivacionProps) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="titulo-reactivacion"
      aria-describedby="detalle-reactivacion"
      className="rounded-2xl border border-botella/25 bg-tiza p-5"
    >
      <h2 id="titulo-reactivacion" className="font-titular text-2xl font-black text-tinta">
        {nombres} ya tuvo una cuenta de recepción
      </h2>
      <p id="detalle-reactivacion" className="mt-2 text-grava">
        Su documento o su correo pertenecen a una cuenta desactivada. Reactívala para conservar sus datos y su
        historial; la contraseña temporal que escribiste será la nueva.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={alReactivar} disabled={reactivando} className={BOTON_PRINCIPAL}>
          <TextoDeEnvio enviando={reactivando} texto="Reactivar su cuenta" textoAlEnviar="Reactivando…" />
        </button>
        <button type="button" onClick={alCancelar} disabled={reactivando} className={BOTON_SECUNDARIO}>
          Revisar los datos
        </button>
      </div>
    </div>
  );
}
