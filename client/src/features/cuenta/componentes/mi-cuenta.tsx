import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerCuenta } from "@/compartido/cuenta/cuenta.servidor";
import { EncabezadoDeSeccion } from "@/compartido/marco/encabezado-de-seccion";
import { RUTA_DE_ACCESO, RUTA_DE_CAMBIO, type Rol } from "@/compartido/sesion/destino-de-sesion";
import { exigirPanel } from "@/compartido/sesion/sesion.servidor";
import { TARJETA } from "@/compartido/ui/estilos";
import { RUTA_DEL_AVISO_DEL_PERSONAL } from "@/features/legal/ruta-del-aviso-del-personal";
import { DatosDeIdentidad } from "./datos-de-identidad";
import { FormularioDeContacto } from "./formulario-de-contacto";
import { FormularioDeMiContrasena } from "./formulario-de-mi-contrasena";

const ENLACE = "font-bold text-botella underline underline-offset-4";

function Bloque({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={`${TARJETA} flex flex-col gap-5`}>
      <h2 id={id} className="font-titular text-3xl leading-none font-black text-tinta">{titulo}</h2>
      {children}
    </section>
  );
}

function Privacidad({ rol }: { rol: Rol }) {
  if (rol === "JUGADOR") {
    return <p className="text-grava">Aceptaste los términos y la política de privacidad al crear tu cuenta.</p>;
  }
  return (
    <p className="text-grava">
      Cómo tratamos tus datos por tu trabajo: <Link href={RUTA_DEL_AVISO_DEL_PERSONAL} className={ENLACE}>aviso de privacidad del personal</Link>.
    </p>
  );
}

/** Cuenta propia, igual para los tres roles: datos, seguridad y privacidad. */
export async function MiCuenta({ rol }: { rol: Rol }) {
  const { cookie, sesion } = await exigirPanel(rol);
  const cuenta = await obtenerCuenta(cookie);
  if (!cuenta) redirect(RUTA_DE_ACCESO);

  return (
    <>
      <EncabezadoDeSeccion titulo="Mi cuenta" descripcion="Tus datos, tu contraseña y cómo cuidamos tu información." />
      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <Bloque id="titulo-mis-datos" titulo="Mis datos">
          <DatosDeIdentidad cuenta={cuenta} />
          <FormularioDeContacto cuenta={cuenta} />
        </Bloque>
        <div className="flex flex-col gap-6">
          <Bloque id="titulo-seguridad" titulo="Seguridad">
            {sesion.requiereCambiarContrasena ? (
              <p className="text-grava">
                Sigues con una contraseña temporal. <Link href={RUTA_DE_CAMBIO} className={ENLACE}>Cámbiala ahora</Link>.
              </p>
            ) : (
              <FormularioDeMiContrasena />
            )}
          </Bloque>
          <Bloque id="titulo-privacidad" titulo="Privacidad">
            <Privacidad rol={rol} />
          </Bloque>
        </div>
      </div>
    </>
  );
}
