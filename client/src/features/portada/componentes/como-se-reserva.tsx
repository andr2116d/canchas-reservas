const PASOS = [
  { titulo: "Elige día y turno", texto: "Mira los turnos libres de hoy y de los próximos 30 días, con su precio final." },
  { titulo: "Sepáralo con el adelanto", texto: "Ingresa a tu cuenta y paga el adelanto o el total. El resto se paga en el local." },
  { titulo: "Llega y juega", texto: "Muestra tu reserva en recepción y entra a la cancha." },
];

/** Los pasos para reservar, en orden. */
export function ComoSeReserva() {
  return (
    <section id="como-se-reserva" aria-labelledby="como-se-reserva-titulo" className="portada__seccion">
      <h2 id="como-se-reserva-titulo" className="font-titular text-5xl font-black text-cancha">Cómo se reserva</h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {PASOS.map((paso, indice) => (
          <li key={paso.titulo} className="rounded-2xl border border-linea bg-papel p-5">
            <span aria-hidden="true" className="font-titular text-4xl leading-none font-black text-botella">{indice + 1}</span>
            <h3 className="mt-2 font-bold">{paso.titulo}</h3>
            <p className="mt-1 text-sm text-grava">{paso.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
