import Link from "next/link";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { MarcoInterno } from "@/compartido/marco/marco-interno";
import { PANELES, type Rol } from "@/compartido/sesion/destino-de-sesion";
import { exigirCambioDeContrasena } from "@/compartido/sesion/sesion.servidor";
import { describirTiempoRestante } from "@/compartido/sesion/tiempo-restante";
import { TARJETA } from "@/compartido/ui/estilos";
import { RUTA_DEL_AVISO_DEL_PERSONAL } from "@/features/legal/ruta-del-aviso-del-personal";
import { FormularioDeCambio } from "./formulario-de-cambio";

/** Pide cambiar la contraseña temporal, en el mismo marco que los paneles; se puede dejar para después. */
export async function PantallaDeCambio() {
  const sesion = await exigirCambioDeContrasena();
  const vence = sesion.contrasenaTemporalVenceEn;
  const descripcion =
    "Por seguridad, elige una contraseña que solo tú conozcas." +
    (vence
      ? ` Tu contraseña temporal vence en ${describirTiempoRestante(vence, new Date())}.`
      : "");

  return (
    <MarcoInterno
      rol={sesion.rol}
      venceEn={sesion.venceEn}
      conSecciones={false}
    >
      <EncabezadoDeSeccion
        titulo="Cambia tu contraseña temporal"
        descripcion={descripcion}
        tarjeta={<TarjetaDeCambio rol={sesion.rol} />}
      />
    </MarcoInterno>
  );
}

/** Formulario de la contraseña nueva, con el aviso del personal si corresponde. */
function TarjetaDeCambio({ rol }: { rol: Rol }) {
  return (
    <section aria-label="Contraseña nueva" className={TARJETA}>
      <FormularioDeCambio panel={PANELES[rol]} />
      {rol !== "JUGADOR" && (
        <p className="mt-5 text-center text-sm">
          <Link
            href={RUTA_DEL_AVISO_DEL_PERSONAL}
            className="font-bold text-botella underline underline-offset-4"
          >
            Aviso de privacidad del personal
          </Link>
        </p>
      )}
    </section>
  );
}
