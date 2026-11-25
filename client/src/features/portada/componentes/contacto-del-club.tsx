import Image from "next/image";
import Link from "next/link";
import type { ClubPublico } from "@/compartido/club/servicios/club";
import { agruparHorario } from "@/compartido/club/utilidades/horario-agrupado";
import fotoDelEquipo from "../../../../public/imagenes/equipo.jpg";

const POR_CONFIGURAR = <span className="dato-por-configurar">Se configura en administración</span>;

/** Cómo llegar y cuándo atiende el club, junto a una invitación a crear la cuenta. */
export function ContactoDelClub({ horario }: Pick<ClubPublico, "horario">) {
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6 rounded-3xl border border-linea bg-papel p-7">
        <address className="grid gap-3 not-italic">
          {["Dirección", "Teléfono", "Correo"].map((dato) => (
            <p key={dato} className="grid grid-cols-[6.5rem_1fr] gap-2"><span className="text-grava">{dato}</span>{POR_CONFIGURAR}</p>
          ))}
        </address>
        <section aria-labelledby="horario-titulo" className="flex flex-col gap-2">
          <h3 id="horario-titulo" className="font-extrabold">Horario de atención</h3>
          {horario ? (
            <dl className="flex flex-col gap-1">
              {agruparHorario(horario.dias).map((tramo) => (
                <div key={tramo.dias} className="flex justify-between gap-4 border-b border-dashed border-linea pb-1">
                  <dt>{tramo.dias}</dt>
                  <dd className="font-bold tabular-nums">{tramo.horas}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-grava">Pronto publicaremos nuestro horario.</p>
          )}
        </section>
      </div>
      <aside aria-labelledby="invitacion-titulo" className="invitacion-del-club">
        <Image src={fotoDelEquipo} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="invitacion-del-club__foto" />
        <h3 id="invitacion-titulo" className="font-titular text-5xl leading-none font-black text-papel">¿Armamos el partido?</h3>
        <p className="text-tiza/85">Crea tu cuenta y reserva tu próximo turno en un minuto.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/registro" className="boton-del-sitio boton-del-sitio--capitan boton-del-sitio--grande">Crear mi cuenta</Link>
          <a href="#turnos" className="boton-del-sitio boton-del-sitio--vidrio boton-del-sitio--grande">Ver turnos libres</a>
        </div>
      </aside>
    </div>
  );
}
