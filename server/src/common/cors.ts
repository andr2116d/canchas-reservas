export function origenCliente() {
  return process.env.CLIENT_URL ?? 'http://localhost:3000';
}

export function opcionesCors() {
  return { origin: origenCliente(), credentials: true };
}
