/** Mensaje con lo que la recepcionista necesita para entrar, listo para pegar y enviar. */
export function datosParaEntregar({ correo, contrasena, sitio }: { correo: string; contrasena: string; sitio: string }) {
  return [
    "Tu acceso a La Previa",
    `Entra en: ${sitio}/iniciar-sesion`,
    `Correo: ${correo}`,
    `Contraseña temporal: ${contrasena}`,
    "Vence en 7 días. Al entrar se te pedirá cambiarla.",
  ].join("\n");
}
