import { io, type Socket } from "socket.io-client";

// En globalThis para que Fast Refresh, que vuelve a ejecutar este módulo, no abra otra conexión.
const global = globalThis as typeof globalThis & { __socketLaPrevia?: Socket };

export function obtenerSocket() {
  if (typeof window === "undefined") {
    throw new Error("El socket solo se crea en el navegador");
  }
  global.__socketLaPrevia ??= io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001", {
    autoConnect: true,
  });
  return global.__socketLaPrevia;
}
