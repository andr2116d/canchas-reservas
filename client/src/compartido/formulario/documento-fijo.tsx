
export const NOMBRE_DEL_DOCUMENTO = { DNI: "DNI", CARNE_EXTRANJERIA: "Carné de extranjería" } as const;

/** El documento con candado: identifica a la persona y no se cambia. */
export function DocumentoFijo({ cuenta }: { cuenta: { tipoDocumento?: keyof typeof NOMBRE_DEL_DOCUMENTO; numeroDocumento?: string } }) {
  if (!cuenta.tipoDocumento || !cuenta.numeroDocumento) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-linea bg-tiza px-4 py-3">
      <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 shrink-0 text-grava" focusable="false">
        <rect x="4" y="9" width="12" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      <div className="min-w-0">
        <p className="font-bold text-tinta">
          {NOMBRE_DEL_DOCUMENTO[cuenta.tipoDocumento]} {cuenta.numeroDocumento}
        </p>
        <p className="text-xs text-grava">El documento identifica a la persona: no se cambia.</p>
      </div>
    </div>
  );
}
