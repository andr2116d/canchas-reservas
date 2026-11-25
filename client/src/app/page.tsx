import { MapaDeTurnos } from "@/features/disponibilidad/componentes/mapa-de-turnos";
import { BarraDeLaPortada } from "@/features/portada/componentes/barra-de-la-portada";
import { ComoSeReserva } from "@/features/portada/componentes/como-se-reserva";
import { PieDeLaPortada } from "@/features/portada/componentes/pie-de-la-portada";
import { Presentacion } from "@/features/portada/componentes/presentacion";

/** Portada pública: cualquiera ve los turnos libres sin iniciar sesión. */
export default function Inicio() {
  return (
    <div id="inicio" className="portada">
      <a href="#turnos" className="saltar-al-contenido">Saltar a los turnos</a>
      <BarraDeLaPortada />
      <main>
        <Presentacion />
        <section id="turnos" aria-labelledby="turnos-titulo" className="portada__seccion">
          <div>
            <h2 id="turnos-titulo" className="font-titular text-5xl font-black text-cancha sm:text-6xl">Turnos libres</h2>
            <p className="text-grava">Elige el día y toca un turno libre. No necesitas iniciar sesión para mirar.</p>
          </div>
          <MapaDeTurnos contexto="publico" />
        </section>
        <ComoSeReserva />
      </main>
      <PieDeLaPortada />
    </div>
  );
}
