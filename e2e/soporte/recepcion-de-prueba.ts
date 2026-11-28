import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { enLaBase } from "./base-de-pruebas";
import { unJugadorNuevo, VERSION_LEGAL_DEL_REGISTRO } from "./jugador-de-prueba";
import { montosDelTurno, type TurnoDePrueba } from "./reserva-de-prueba";

export function datosDeCliente() {
  const { nombres, apellidos, fechaNacimiento, numeroDocumento, celular, correo } = unJugadorNuevo();
  return { nombres, apellidos, fechaNacimiento, numeroDocumento, celular, correo, tipoDocumento: "DNI", versionDelAviso: VERSION_LEGAL_DEL_REGISTRO };
}

export async function altaPorRecepcion(request: APIRequestContext, datos = datosDeCliente()) {
  const respuesta = await request.post("/api/recepcion/clientes", { data: datos });
  expect(respuesta.status(), await respuesta.text()).toBe(201);
  return ((await respuesta.json()) as { cliente: { id: number }; existente: boolean });
}

export type CobroDePrueba = { monto: string; metodo: "EFECTIVO" | "YAPE" | "PLIN"; numeroOperacion?: string };

export function pedirDesdeRecepcion(peticion: APIRequestContext, turno: TurnoDePrueba, titularId: number, cobro?: CobroDePrueba, montos = montosDelTurno(turno.desde)) {
  return peticion.post("/api/recepcion/reservas", { data: { ...turno, ...montos, titularId, cobro } });
}

export async function reservarPorRecepcion(peticion: APIRequestContext, turno: TurnoDePrueba, titularId: number, cobro?: CobroDePrueba, montos?: { precio: string; adelanto: string }) {
  const respuesta = await pedirDesdeRecepcion(peticion, turno, titularId, cobro, montos);
  expect(respuesta.status(), await respuesta.text()).toBe(201);
  return (await respuesta.json()) as { codigo: string; estado: string; venceEn: string | null };
}

export const rutaDeReservaEnRecepcion = ({ canchaId, fecha, desde }: TurnoDePrueba) =>
  `/recepcion/disponibilidad/reservar?${new URLSearchParams({ cancha: String(canchaId), fecha, desde })}`;

export const campo = (pagina: Page, etiqueta: string) => pagina.getByLabel(new RegExp(`^${etiqueta}`));

export async function buscarDocumento(pagina: Page, documento: string) {
  await campo(pagina, "Número de documento").fill(documento);
  await pagina.getByRole("button", { name: "Buscar", exact: true }).click();
}

export async function llenarAlta(pagina: Page, datos: ReturnType<typeof datosDeCliente>) {
  await campo(pagina, "Nombres").fill(datos.nombres);
  await campo(pagina, "Apellidos").fill(datos.apellidos);
  await campo(pagina, "Fecha de nacimiento").fill(datos.fechaNacimiento);
  await campo(pagina, "Número de documento").fill(datos.numeroDocumento);
  await campo(pagina, "Celular").fill(datos.celular);
  await campo(pagina, "Correo").fill(datos.correo);
}

export function datosDelAviso(titularId: number) {
  return enLaBase(async (db) => (await db.query(
    `SELECT u.canal_aceptacion_legal AS canal, u.aceptacion_legal_en AS fecha,
      u.version_legal_aceptada AS version, autor.rol, u.contrasena_hash AS contrasena,
      u.numero_documento_cifrado AS documento, u.correo_cifrado AS correo
    FROM usuario u JOIN usuario autor ON u.aviso_de_privacidad_informado_por_id = autor.id
    WHERE u.id = $1`, [titularId],
  )).rows[0]);
}

export function datosDelCheckIn(codigo: string) {
  return enLaBase(async (db) => (await db.query(
    `SELECT r.estado, r.check_in_en AS "checkInEn", r.check_in_por_id AS "checkInPorId",
      r.ventana_de_llegada_id AS version
    FROM reserva r WHERE r.codigo = $1`, [codigo],
  )).rows[0]);
}

export function cobrosDeReserva(codigo: string) {
  return enLaBase(async (db) => (await db.query(
    `SELECT p.concepto, p.monto::text, p.metodo, p.numero_operacion AS operacion,
      p.registrado_por_id AS autor, p.registrado_en AS fecha
    FROM pago p JOIN reserva r ON p.reserva_id = r.id WHERE r.codigo = $1 ORDER BY p.id`, [codigo],
  )).rows);
}

export type EstadoParaCheckIn = "confirmada" | "pendiente_de_pago" | "pendiente_de_validacion" | "cancelada" | "expirada" | "ausente" | "en_juego" | "finalizada";

export function moverParaCheckIn(codigo: string, comienzo: Date, estado: EstadoParaCheckIn = "confirmada") {
  return enLaBase((db) => db.query(
    `UPDATE reserva SET inicio = $2, fin = $2::timestamptz + interval '1 hour', estado = $3::text::estado_de_reserva,
      vence_en = CASE WHEN $3::text = 'pendiente_de_pago' THEN now() + interval '15 minutes' END
    WHERE codigo = $1`, [codigo, comienzo, estado],
  ));
}

export function limpiarReservaDeRecepcion(codigo: string) {
  return enLaBase(async (db) => {
    await db.query("DELETE FROM pago WHERE reserva_id IN (SELECT id FROM reserva WHERE codigo = $1)", [codigo]);
    await db.query("DELETE FROM reserva WHERE codigo = $1", [codigo]);
  });
}
