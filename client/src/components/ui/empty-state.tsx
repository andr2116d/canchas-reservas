export function EmptyState({ mensaje, accion }: { mensaje: string; accion?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-linea px-6 py-12 text-center">
      <p className="text-texto-suave">{mensaje}</p>
      {accion}
    </div>
  );
}
