import { defineConfig, devices } from "@playwright/test";
import { config as cargarEntorno } from "dotenv";
import { DOMINIO_DE_PRUEBA } from "./soporte/personal-de-prueba";

// La API y la web de pruebas usan puertos propios y la base `_pruebas`,
// para no chocar con el entorno de desarrollo ni tocar sus datos.
cargarEntorno({ path: "../server/.env", quiet: true });
const PUERTO_API = 3101;
const PUERTO_WEB = 3100;
const baseDePruebas = new URL(process.env.DATABASE_URL ?? "");
baseDePruebas.pathname = `${baseDePruebas.pathname.replace(/_pruebas$/, "")}_pruebas`;

const DISPONIBILIDAD = /pruebas\/disponibilidad\/.*\.spec\.ts/;
const RESERVAS = /pruebas\/reservas\/.*\.spec\.ts/;
const AGENDA = /pruebas\/agenda\/.*\.spec\.ts/;
const VENCIMIENTOS = /pruebas\/vencimientos\/.*\.spec\.ts/;

export default defineConfig({
  testDir: "./pruebas",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PUERTO_WEB}`,
    // Con la preferencia de cookies ya elegida el aviso no tapa la pantalla; la prueba del aviso la quita.
    storageState: {
      cookies: [{ name: "preferencia_de_cookies", value: "necesarias", domain: "localhost", path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" }],
      origins: [],
    },
    locale: "es-PE",
    trace: "retain-on-failure",
  },
  // La disponibilidad, las reservas, la agenda y los vencimientos usan y cambian reglas del local entero
  // (horario, tarifas, regla, plazo y canchas): corren al final, una tras otra, en escritorio y celular.
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] }, testIgnore: [DISPONIBILIDAD, RESERVAS, AGENDA, VENCIMIENTOS] },
    { name: "celular", use: { ...devices["Pixel 7"] }, testIgnore: [DISPONIBILIDAD, RESERVAS, AGENDA, VENCIMIENTOS] },
    {
      name: "disponibilidad-escritorio",
      use: { ...devices["Desktop Chrome"] },
      testMatch: DISPONIBILIDAD,
      dependencies: ["escritorio", "celular"],
    },
    {
      name: "disponibilidad-celular",
      use: { ...devices["Pixel 7"] },
      testMatch: DISPONIBILIDAD,
      dependencies: ["disponibilidad-escritorio"],
    },
    {
      name: "reservas-escritorio",
      use: { ...devices["Desktop Chrome"] },
      testMatch: RESERVAS,
      dependencies: ["disponibilidad-celular"],
    },
    {
      name: "reservas-celular",
      use: { ...devices["Pixel 7"] },
      testMatch: RESERVAS,
      dependencies: ["reservas-escritorio"],
    },
    {
      name: "agenda-escritorio",
      use: { ...devices["Desktop Chrome"] },
      testMatch: AGENDA,
      dependencies: ["reservas-celular"],
    },
    {
      name: "agenda-celular",
      use: { ...devices["Pixel 7"] },
      testMatch: AGENDA,
      dependencies: ["agenda-escritorio"],
    },
    {
      name: "vencimientos-escritorio",
      use: { ...devices["Desktop Chrome"] },
      testMatch: VENCIMIENTOS,
      dependencies: ["agenda-celular"],
    },
    {
      name: "vencimientos-celular",
      use: { ...devices["Pixel 7"] },
      testMatch: VENCIMIENTOS,
      dependencies: ["vencimientos-escritorio"],
    },
  ],
  webServer: [
    {
      command: "npm run db:preparar-pruebas -w server && npm run start -w server",
      cwd: "..",
      url: `http://localhost:${PUERTO_API}/api/cuenta`,
      env: {
        PORT: String(PUERTO_API),
        DATABASE_URL: baseDePruebas.toString(),
        NODE_ENV: "test",
        DOMINIO_CORPORATIVO: DOMINIO_DE_PRUEBA,
        // Todas las pruebas registran desde la misma IP.
        LIMITE_REGISTROS_POR_HORA: "1000",
        LIMITE_INICIOS_POR_IP: "1000",
        LIMITE_GENERAL_POR_MINUTO: "100000",
        LIMITE_HOJAS_POR_HORA: "1000",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run build -w client && npm run start -w client -- --port ${PUERTO_WEB}`,
      cwd: "..",
      url: `http://localhost:${PUERTO_WEB}/registro`,
      env: {
        API_URL: `http://localhost:${PUERTO_API}`,
        CARPETA_DE_BUILD: ".next-e2e",
        DOMINIO_CORPORATIVO: DOMINIO_DE_PRUEBA,
      },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
