import { Suspense } from "react";
import { consultarElClub } from "@/compartido/club/servicios/club.servidor";
import { CargaDeContenido } from "@/compartido/ui/carga-de-contenido";
import { MapaDeTurnos } from "@/features/disponibilidad/componentes/mapa-de-turnos";
import { ProximosTurnos } from "@/features/disponibilidad/componentes/proximos-turnos";
import { CanchasDelClub } from "@/features/portada/componentes/canchas-del-club";
import { ComoReservar } from "@/features/portada/componentes/como-reservar";
import { ContactoDelClub } from "@/features/portada/componentes/contacto-del-club";
import { PreciosDelClub } from "@/features/portada/componentes/precios-del-club";
import { PreguntasFrecuentes } from "@/features/portada/componentes/preguntas-frecuentes";
import { Presentacion } from "@/features/portada/componentes/presentacion";
import { Promesas } from "@/features/portada/componentes/promesas";
import { SeccionDeLaPortada } from "@/features/portada/componentes/seccion-de-la-portada";

/** Las secciones que dependen de lo que guardó administración: canchas, precios, reglas y horario. */
async function SeccionesDelClub() {
  const club = await consultarElClub();
  return (
    <>
      <Promesas adelanto={club.adelanto} />
      <SeccionDeLaPortada id="canchas" antetitulo="Nuestras canchas" titulo="¿Cuántos juegan?" bajada="Cinco contra cinco o siete contra siete. Cada cancha te dice si tiene luz para jugar de noche." conFranjas>
        <CanchasDelClub canchas={club.canchas} />
      </SeccionDeLaPortada>
      <SeccionDeLaPortada id="precios" antetitulo="Precios" titulo="De día y bajo los reflectores." bajada="Precio de un turno completo por cancha, con IGV incluido. Divídelo entre tu equipo.">
        <PreciosDelClub tarifas={club.tarifas} horario={club.horario} adelanto={club.adelanto} />
      </SeccionDeLaPortada>
      <SeccionDeLaPortada id="turnos" antetitulo="En vivo" titulo="Turnos libres." bajada="Elige el día y toca un turno libre. Para mirar no necesitas cuenta." conFranjas>
        <MapaDeTurnos contexto="publico" />
      </SeccionDeLaPortada>
      <SeccionDeLaPortada id="como-reservar" antetitulo="Cómo reservar" titulo="De la previa al pitazo.">
        <ComoReservar />
      </SeccionDeLaPortada>
      <SeccionDeLaPortada id="preguntas" antetitulo="Antes del pitazo" titulo="Preguntas frecuentes." conFranjas>
        <PreguntasFrecuentes cancelacion={club.cancelacion} adicionales={club.adicionales} />
      </SeccionDeLaPortada>
      <SeccionDeLaPortada id="contacto" antetitulo="Contacto" titulo="Te esperamos.">
        <ContactoDelClub horario={club.horario} />
      </SeccionDeLaPortada>
    </>
  );
}

/** Portada pública: presenta el club y deja ver los turnos libres sin iniciar sesión. */
export default function Inicio() {
  return (
    <>
      <Presentacion proximos={<ProximosTurnos />} />
      <Suspense fallback={<CargaDeContenido texto="Cargando La Previa…" />}>
        <SeccionesDelClub />
      </Suspense>
    </>
  );
}
