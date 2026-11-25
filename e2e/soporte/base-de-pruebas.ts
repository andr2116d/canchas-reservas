import { Client } from "pg";

/** URL de la base de pruebas: la misma de DATABASE_URL con el sufijo `_pruebas`. */
function urlDePruebas(): string {
  const base = new URL(process.env.DATABASE_URL ?? "");
  base.pathname = `${base.pathname.replace(/_pruebas$/, "")}_pruebas`;
  return base.toString();
}

async function enLaBase<T>(trabajo: (cliente: Client) => Promise<T>): Promise<T> {
  const cliente = new Client({ connectionString: urlDePruebas() });
  await cliente.connect();
  try {
    return await trabajo(cliente);
  } finally {
    await cliente.end();
  }
}

type EstadoDeReserva = "pendiente_de_pago" | "pendiente_de_validacion" | "confirmada" | "en_juego";

/**
 * Guarda una reserva de una hora directo en la base de pruebas, porque todavía no
 * hay forma de crearla por la web. El titular es el primer jugador registrado.
 */
export function guardarReserva(canchaId: number, fecha: string, hora: string, estado: EstadoDeReserva) {
  return enLaBase((cliente) =>
    cliente.query(
      `INSERT INTO reserva (cancha_id, titular_id, inicio, fin, estado, actualizado_en)
       SELECT $1, id, $2::timestamptz, $2::timestamptz + interval '1 hour', $3, now()
       FROM usuario WHERE rol = 'jugador' ORDER BY id LIMIT 1
       ON CONFLICT DO NOTHING`,
      [canchaId, `${fecha}T${hora}:00-05:00`, estado],
    ),
  );
}

/** Deja un tipo de cancha sin tarifa, como un local que aún no le puso precio. */
export function quitarTarifaDe(tipo: "futbol_5" | "futbol_7") {
  return enLaBase((cliente) => cliente.query("DELETE FROM tarifa_de_cancha WHERE tipo_de_cancha = $1", [tipo]));
}
