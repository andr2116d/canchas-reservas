type Props = {
  encendida: boolean;
};

export function IconoIluminacion({ encendida }: Props) {
  return (
    <span className="inline-flex" title={encendida ? "Con iluminación" : "Sin iluminación"}>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`size-4 ${encendida ? "text-cal-400" : "text-texto-apagado"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 1.9v.2h5.2v-.2c0-.7.3-1.4.9-1.9A6 6 0 0 0 12 3Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">{encendida ? "Con iluminación" : "Sin iluminación"}</span>
    </span>
  );
}
