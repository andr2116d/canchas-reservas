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

const LETRAS_DEL_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const unCodigo = () => Array.from({ length: 6 }, () => LETRAS_DEL_CODIGO[Math.floor(Math.random() * LETRAS_DEL_CODIGO.length)]).join("");

/** La regla de cancelación vigente; si nunca se guardó, guarda una que devuelve todo. */
async function reglaVigente(cliente: Client, autorId: number): Promise<number> {
  const vigente = await cliente.query<{ id: number }>("SELECT id FROM regla_de_cancelacion ORDER BY guardada_en DESC LIMIT 1");
  if (vigente.rows[0]) return vigente.rows[0].id;
  const nueva = await cliente.query<{ id: number }>("INSERT INTO regla_de_cancelacion (guardada_por_id) VALUES ($1) RETURNING id", [autorId]);
  await cliente.query("INSERT INTO rango_de_cancelacion (regla_id, desde_horas, porcentaje, ofrece_credito) VALUES ($1, 0, 100, false)", [nueva.rows[0].id]);
  return nueva.rows[0].id;
}

/**
 * Guarda una reserva de una hora directo en la base de pruebas, para preparar el mapa
 * sin pasar por la web. El titular es el primer jugador registrado.
 */
export function guardarReserva(canchaId: number, fecha: string, hora: string, estado: EstadoDeReserva) {
  return enLaBase(async (cliente) => {
    const jugador = await cliente.query<{ id: number }>("SELECT id FROM usuario WHERE rol = 'jugador' ORDER BY id LIMIT 1");
    const titular = jugador.rows[0].id;
    const inicio = `${fecha}T${hora}:00-05:00`;
    await cliente.query(
      `INSERT INTO reserva (cancha_id, titular_id, creada_por_id, inicio, fin, estado, codigo, precio,
         porcentaje_de_adelanto, adelanto, regla_de_cancelacion_id, canal, vence_en, actualizado_en)
       VALUES ($1, $2, $2, $3::timestamptz, $3::timestamptz + interval '1 hour', $4, $5, 60, 50, 30, $6, 'web',
         CASE WHEN $4 = 'pendiente_de_pago' THEN $3::timestamptz END, now())
       ON CONFLICT DO NOTHING`,
      [canchaId, titular, inicio, estado, unCodigo(), await reglaVigente(cliente, titular)],
    );
  });
}

/** Deja un tipo de cancha sin tarifa, como un local que aún no le puso precio. */
export function quitarTarifaDe(tipo: "futbol_5" | "futbol_7") {
  return enLaBase((cliente) => cliente.query("DELETE FROM tarifa_de_cancha WHERE tipo_de_cancha = $1", [tipo]));
}

/** Hace vencer ya la retención de una reserva pendiente de pago, como si hubieran pasado sus 15 minutos. */
export function vencerReserva(codigo: string) {
  return enLaBase((cliente) => cliente.query("UPDATE reserva SET vence_en = now() - interval '1 second' WHERE codigo = $1", [codigo]));
}

/** Pasa una reserva a otro estado, como lo harán el pago o el check-in; la reserva deja de esperar pago. */
export function cambiarEstadoDeReserva(codigo: string, estado: "confirmada" | "en_juego") {
  return enLaBase((cliente) => cliente.query("UPDATE reserva SET estado = $2, vence_en = NULL WHERE codigo = $1", [codigo, estado]));
}
