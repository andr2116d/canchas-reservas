import { expect, test } from "@playwright/test";
import { unJugadorNuevo } from "../../soporte/jugador-de-prueba";
import { correoDe, crearPorApi } from "../../soporte/recepcionistas-de-prueba";
import { cerrarSesion, confirmarMisDatos, entrarComoAdministrador, iniciarSesion } from "../../soporte/sesiones-de-prueba";

test("el jugador cambia su celular y su contraseña desde Mi cuenta", async ({ page }) => {
  const jugador = unJugadorNuevo();
  await page.request.post("/api/jugadores", {
    data: { ...jugador, tipoDocumento: "DNI", versionLegalAceptada: "registro-1" },
  });
  await page.goto("/inicio");
  await page.getByRole("button", { name: "Mi cuenta" }).click();
  await page.getByRole("link", { name: "Ver mi cuenta" }).click();
  await expect(page).toHaveURL("/inicio/cuenta");
  await expect(page.getByText(`DNI ${jugador.numeroDocumento}`)).toBeVisible();
  await expect(page.getByLabel(/^Nombres/)).toHaveCount(0);

  await page.getByLabel(/^Celular/).fill("");
  await page.getByLabel(/^Celular/).pressSequentially("912000111");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados.")).toBeVisible();
  await page.getByRole("tab", { name: "Seguridad" }).click();
  await page.getByLabel(/^Contraseña actual/).fill(jugador.contrasena);
  await page.getByLabel(/^Contraseña nueva/).fill("otraClave2026");
  await page.getByLabel(/^Confirma la contraseña nueva/).fill("otraClave2026");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText(/Contraseña cambiada/)).toBeVisible();

  await cerrarSesion(page);
  await iniciarSesion(page, jugador.correo, "otraClave2026");
  await expect(page).toHaveURL("/inicio");
});

test("la recepcionista corrige sus datos, ve su correo y su documento fijos y el aviso del personal", async ({ page }) => {
  await entrarComoAdministrador(page);
  const recepcionista = await crearPorApi(page);
  await cerrarSesion(page);
  await iniciarSesion(page, correoDe(recepcionista), "temporal2026");
  await confirmarMisDatos(page);
  await page.getByRole("button", { name: "Ahora no" }).click();
  await expect(page).toHaveURL("/recepcion");

  await page.goto("/recepcion/cuenta");
  await page.getByLabel(/^Nombres/).fill("Rosa María");
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page.getByText("Cambios guardados.")).toBeVisible();
  await expect(page.getByLabel(/^Correo/)).toHaveCount(0);
  await expect(page.getByText(correoDe(recepcionista))).toBeVisible();
  await expect(page.getByText(/lo asigna administración/)).toBeVisible();
  await expect(page.getByText(`DNI ${recepcionista.numeroDocumento}`)).toBeVisible();
  await expect(page.getByRole("link", { name: "aviso de privacidad del personal" })).toBeVisible();
  await page.getByRole("tab", { name: "Seguridad" }).click();
  await expect(page.getByRole("link", { name: "Cámbiala ahora" })).toBeVisible();
});
