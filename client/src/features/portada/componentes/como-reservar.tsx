const PASOS = [
  { titulo: "Elige día, hora y cancha", texto: "Mira los turnos libres de hoy y de los próximos 30 días, con su precio final." },
  { titulo: "Entra con tu cuenta", texto: "La crea quien reserva y paga, con 18 años cumplidos." },
  { titulo: "Paga el adelanto o el total", texto: "El turno queda tuyo cuando se confirma el pago." },
  { titulo: "Llega y juega", texto: "Muestra tu reserva en recepción. Si queda saldo, lo pagas ahí." },
];

/** Los pasos para reservar, en orden. */
export function ComoReservar() {
  return (
    <ol className="pasos-para-reservar">
      {PASOS.map((paso, i) => (
        <li key={paso.titulo}>
          <span aria-hidden="true" className="font-titular text-5xl leading-none font-black text-botella">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="text-lg font-extrabold">{paso.titulo}</h3>
          <p className="text-grava">{paso.texto}</p>
        </li>
      ))}
    </ol>
  );
}
