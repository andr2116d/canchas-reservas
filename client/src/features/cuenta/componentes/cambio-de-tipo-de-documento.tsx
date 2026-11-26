"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { Cuenta } from "@/compartido/cuenta/cuenta.servidor";
import { ErrorGeneral } from "@/compartido/formulario/error-general";
import { filtrarCarneExtranjeria, filtrarDni } from "@/compartido/formulario/filtros-de-entrada";
import { useAvisar } from "@/compartido/ui/avisos-flotantes";
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "@/compartido/ui/estilos";
import { TarjetaFlotante } from "@/compartido/ui/tarjeta-flotante";
import { TextoDeEnvio } from "@/compartido/ui/texto-de-envio";
import { cambiarMiTipoDeDocumento } from "../servicios/cuenta.api";

type Tipo = "DNI" | "CARNE_EXTRANJERIA";
const OTRO = { DNI: "CARNE_EXTRANJERIA", CARNE_EXTRANJERIA: "DNI" } as const;
const NOMBRE = { DNI: "DNI", CARNE_EXTRANJERIA: "carné de extranjería" } as const;

/** El aviso legal, el número nuevo y la confirmación de haberlo leído. */
function FormularioDelDocumentoNuevo({ nuevo, alCambiar }: { nuevo: Tipo; alCambiar: () => void }) {
  const [numero, setNumero] = useState("");
  const [leido, setLeido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();
  const filtrar = nuevo === "DNI" ? filtrarDni : filtrarCarneExtranjeria;

  async function confirmar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    const resultado = await cambiarMiTipoDeDocumento(nuevo, numero);
    setEnviando(false);
    if (resultado.tipo === "hecho") alCambiar();
    else setError(resultado.tipo === "error" ? resultado.mensaje : Object.values(resultado.errores)[0]);
  }

  return (
    <form onSubmit={confirmar} className="flex flex-col gap-4">
      <div role="note" className="rounded-xl border border-[#e5c77a] bg-[#fbf1d9] p-4 text-sm text-tinta">
        <p className="font-bold">Se hace una sola vez</p>
        <p className="mt-1">
          Úsalo solo si tu documento cambió de verdad, por ejemplo al obtener tu DNI o tu carné de extranjería. La Ley 29733
          pide que los datos personales sean exactos y estén actualizados. El cambio queda registrado con fecha y hora.
        </p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-tinta">
        Número de {NOMBRE[nuevo]}
        <input value={numero} onChange={(e) => setNumero(filtrar(e.target.value))} inputMode={nuevo === "DNI" ? "numeric" : "text"} autoComplete="off" className="rounded-lg border border-linea bg-papel px-3.5 py-2.5 text-base font-normal" />
      </label>
      <label className="flex items-start gap-2 text-sm text-tinta">
        <input type="checkbox" checked={leido} onChange={(e) => setLeido(e.target.checked)} className="mt-0.5 size-4" />
        Leí el aviso y mi documento cambió.
      </label>
      <ErrorGeneral mensaje={error} />
      <button type="submit" disabled={!leido || numero === "" || enviando} className={`${BOTON_PRINCIPAL} w-fit`}>
        <TextoDeEnvio enviando={enviando} texto="Cambiar mi documento" textoAlEnviar="Cambiando…" />
      </button>
    </form>
  );
}

/** El cambio único de DNI a carné de extranjería, o al revés, en una tarjeta flotante. */
export function CambioDeTipoDeDocumento({ cuenta }: { cuenta: Cuenta }) {
  const router = useRouter();
  const avisar = useAvisar();
  const [abierta, setAbierta] = useState(false);
  if (!cuenta.puedeCambiarTipoDeDocumento || !cuenta.tipoDocumento) return null;
  const nuevo = OTRO[cuenta.tipoDocumento];
  const alCambiar = () => {
    setAbierta(false);
    avisar(`Tu documento ahora es ${NOMBRE[nuevo]}.`);
    router.refresh();
  };

  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} className={`${BOTON_SECUNDARIO} w-fit`}>
        Cambiar a {NOMBRE[nuevo]}
      </button>
      <TarjetaFlotante titulo={`Cambiar a ${NOMBRE[nuevo]}`} abierta={abierta} alCerrar={() => setAbierta(false)}>
        {abierta && <FormularioDelDocumentoNuevo nuevo={nuevo} alCambiar={alCambiar} />}
      </TarjetaFlotante>
    </>
  );
}
