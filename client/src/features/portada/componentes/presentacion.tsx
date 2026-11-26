import Image from "next/image";
import Link from "next/link";
import foto from "../../../../public/imagenes/futbol-de-barrio.webp";
import type { ReactNode } from "react";

/** Foto del partido, el mensaje del club, los accesos a reservar y, debajo, los próximos turnos. */
export function Presentacion({ proximos }: { proximos: ReactNode }) {
  return (
    <section aria-labelledby="presentacion-titulo" className="presentacion-del-club">
      <Image src={foto} alt="Un partido de fútbol 5 de noche, bajo los reflectores de una cancha de barrio." fill priority sizes="100vw" placeholder="blur" className="presentacion-del-club__foto" />
      <div className="envoltura-del-sitio flex flex-col gap-10 pt-36 pb-10">
        <div className="flex max-w-2xl flex-col gap-5">
          <p className="antetitulo-de-la-portada antetitulo-de-la-portada--sobre-foto">Fútbol 5 y 7 · Trujillo</p>
          <h1 id="presentacion-titulo" className="font-titular text-[clamp(3.6rem,10vw,7.5rem)] leading-[0.9] font-black text-balance text-papel">Nos vemos en la cancha.</h1>
          <p className="max-w-[34rem] text-lg text-pretty text-tiza/90">Mira en vivo qué turnos quedan, elige tu cancha y sepárala con un adelanto. El precio que ves es el que pagas.</p>
          <div className="flex flex-wrap gap-3">
            <a href="#turnos" className="boton-del-sitio boton-del-sitio--capitan boton-del-sitio--grande">Ver turnos libres</a>
            <Link href="/registro" className="boton-del-sitio boton-del-sitio--vidrio boton-del-sitio--grande">Crear mi cuenta</Link>
          </div>
        </div>
        {proximos}
      </div>
    </section>
  );
}
