import Image from "next/image";
import { BOTON_SOBRE_CANCHA } from "@/compartido/ui/estilos";
import foto from "../../../../public/imagenes/futbol-de-barrio.webp";

/** Foto del partido con el mensaje y el acceso directo a los turnos libres. */
export function Presentacion() {
  return (
    <section aria-labelledby="portada-titulo" className="portada__presentacion">
      <Image src={foto} alt="" fill priority sizes="100vw" placeholder="blur" className="portada__foto" />
      <div className="portada__mensaje">
        <p className="text-sm font-bold text-capitan">Fútbol 5 y 7 · Trujillo, La Libertad</p>
        <h1 id="portada-titulo" className="font-titular text-6xl leading-[0.9] font-black text-balance text-papel sm:text-8xl">Nos vemos en la cancha.</h1>
        <p className="max-w-[34ch] text-lg text-pretty text-tiza/90">Mira qué turnos quedan libres hoy y en los próximos 30 días, con su precio final.</p>
        <a href="#turnos" className={`${BOTON_SOBRE_CANCHA} w-fit`}>Ver turnos libres</a>
      </div>
    </section>
  );
}
