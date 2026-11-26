import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { type Cuenta, obtenerCuenta } from "@/compartido/cuenta/cuenta.servidor";
import { DocumentoFijo } from "@/compartido/formulario/documento-fijo";
import { RUTA_DE_ACCESO, RUTA_DE_CAMBIO, type Rol } from "@/compartido/sesion/destino-de-sesion";
import { exigirPanel } from "@/compartido/sesion/sesion.servidor";
import { ProveedorDeAvisos } from "@/compartido/ui/avisos-flotantes";
import { TARJETA } from "@/compartido/ui/estilos";
import { fechaEnLima } from "@/compartido/ui/fecha-en-lima";
import { RUTA_DEL_AVISO_DEL_PERSONAL } from "@/features/legal/ruta-del-aviso-del-personal";
import { obtenerMisAccesos, obtenerMisSesiones } from "../servicios/cuenta.servidor";
import { CambioDeTipoDeDocumento } from "./cambio-de-tipo-de-documento";
import { DatosDeIdentidad } from "./datos-de-identidad";
import { FormularioDeMiContrasena } from "./formulario-de-mi-contrasena";
import { FormularioDeMisDatos } from "./formulario-de-mis-datos";
import { MiCuentaEnPestanas } from "./mi-cuenta-en-pestanas";
import { MisSesiones } from "./mis-sesiones";

const ENLACE = "font-bold text-botella underline underline-offset-4";

function Bloque({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`${TARJETA} flex flex-col gap-5`}>
      <h2 id={id} className="font-titular text-3xl leading-none font-black text-tinta">{titulo}</h2>
      {children}
    </section>
  );
}

/** Datos propios: el jugador ve su identidad fija; el personal la corrige y ve su documento con candado. */
function PanelDeDatos({ cuenta }: { cuenta: Cuenta }) {
  const personal = cuenta.rol !== "JUGADOR";
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
      <Bloque id="titulo-mis-datos" titulo="Mis datos">
        {!personal && <DatosDeIdentidad cuenta={cuenta} />}
        <FormularioDeMisDatos cuenta={cuenta} />
      </Bloque>
      <div className="flex flex-col gap-6">
        {personal && (
          <Bloque id="titulo-documento" titulo="Documento">
            <DocumentoFijo cuenta={cuenta} />
            <CambioDeTipoDeDocumento cuenta={cuenta} />
          </Bloque>
        )}
        <Bloque id="titulo-privacidad" titulo="Privacidad">
          {personal ? (
            <p className="text-grava">Cómo tratamos tus datos por tu trabajo: <Link href={RUTA_DEL_AVISO_DEL_PERSONAL} className={ENLACE}>aviso de privacidad del personal</Link>.</p>
          ) : (
            <p className="text-grava">Aceptaste los términos y la política de privacidad al crear tu cuenta.</p>
          )}
        </Bloque>
      </div>
    </div>
  );
}

/** Lo último que pasó con la cuenta: sus accesos y, para administración, sus cambios en el historial. */
function PanelDeActividad({ cuenta, accesos }: { cuenta: Cuenta; accesos: { ocurridoEn: string }[] }) {
  return (
    <Bloque id="titulo-actividad" titulo="Últimos accesos">
      <ol className="flex flex-col divide-y divide-dashed divide-linea">
        {accesos.map(({ ocurridoEn }) => (
          <li key={ocurridoEn} className="py-2 text-tinta tabular-nums">{fechaEnLima(ocurridoEn)}</li>
        ))}
      </ol>
      <p className="text-sm text-grava">Si ves un acceso que no reconoces, cambia tu contraseña y cierra las demás sesiones.</p>
      {cuenta.rol === "ADMINISTRADOR" && (
        <Link href={`/administracion/historial?autor=${cuenta.id}`} className={ENLACE}>Ver mis cambios en el historial</Link>
      )}
    </Bloque>
  );
}

/** Cuenta propia, igual para los tres roles: datos, seguridad y actividad. */
export async function MiCuenta({ rol }: { rol: Rol }) {
  const { cookie, sesion } = await exigirPanel(rol);
  const [cuenta, sesiones, accesos] = await Promise.all([obtenerCuenta(cookie), obtenerMisSesiones(cookie), obtenerMisAccesos(cookie)]);
  if (!cuenta) redirect(RUTA_DE_ACCESO);

  return (
    <ProveedorDeAvisos>
      <MiCuentaEnPestanas
        paneles={{
          datos: <PanelDeDatos cuenta={cuenta} />,
          seguridad: (
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <Bloque id="titulo-contrasena" titulo="Contraseña">
                {sesion.requiereCambiarContrasena ? (
                  <p className="text-grava">Sigues con una contraseña temporal. <Link href={RUTA_DE_CAMBIO} className={ENLACE}>Cámbiala ahora</Link>.</p>
                ) : (
                  <FormularioDeMiContrasena />
                )}
              </Bloque>
              <Bloque id="titulo-sesiones" titulo="Sesiones abiertas">
                <MisSesiones sesiones={sesiones} />
              </Bloque>
            </div>
          ),
          actividad: <PanelDeActividad cuenta={cuenta} accesos={accesos} />,
        }}
      />
    </ProveedorDeAvisos>
  );
}
