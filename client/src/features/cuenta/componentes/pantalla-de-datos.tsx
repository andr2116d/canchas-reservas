import { redirect } from "next/navigation";
import { obtenerDatosParaConfirmar } from "@/compartido/cuenta/cuenta.servidor";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { MarcoInterno } from "@/compartido/marco/marco-interno";
import { PANELES, RUTA_DE_ACCESO, RUTA_DE_CAMBIO } from "@/compartido/sesion/destino-de-sesion";
import { exigirCompletarDatos } from "@/compartido/sesion/sesion.servidor";
import { TARJETA } from "@/compartido/ui/estilos";
import { FormularioDeDatosPropios } from "./formulario-de-datos-propios";

/** Primer paso del primer ingreso del personal, antes de cambiar la contraseña temporal. */
export async function PantallaDeDatos() {
  const sesion = await exigirCompletarDatos();
  const cuenta = await obtenerDatosParaConfirmar(sesion.cookie);
  if (!cuenta) redirect(RUTA_DE_ACCESO);
  const confirma = Boolean(cuenta.numeroDocumento);
  const siguiente = sesion.requiereCambiarContrasena ? RUTA_DE_CAMBIO : PANELES[sesion.rol];

  return (
    <MarcoInterno rol={sesion.rol} venceEn={sesion.venceEn} conSecciones={false}>
      <EncabezadoDeSeccion
        sello={<span className="sello-del-rol">Paso 1 de 2</span>}
        titulo={confirma ? "Confirma tus datos" : "Completa tus datos"}
        descripcion={
          confirma
            ? "Administración cargó estos datos. Revisa que estén bien y corrige lo que haga falta; el documento no se cambia."
            : "Son tus datos como parte del personal de La Previa. Después eliges tu contraseña."
        }
        tarjeta={
          <section aria-label="Tus datos" className={TARJETA}>
            <FormularioDeDatosPropios cuenta={cuenta} siguiente={siguiente} />
          </section>
        }
      />
    </MarcoInterno>
  );
}
