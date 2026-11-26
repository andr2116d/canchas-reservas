/** Un dato del proveedor que aún no se guardó: se dice en su lugar en vez de inventarlo. */
export function DatoPendiente({ texto = "se configura en administración" }: { texto?: string }) {
  return <span className="dato-por-configurar">{texto}</span>;
}
