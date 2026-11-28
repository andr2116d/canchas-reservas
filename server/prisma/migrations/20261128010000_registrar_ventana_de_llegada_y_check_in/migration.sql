ALTER TYPE "concepto_de_pago" ADD VALUE 'saldo';
ALTER TYPE "estado_de_reserva" ADD VALUE 'cancelada';
ALTER TYPE "estado_de_reserva" ADD VALUE 'ausente';
ALTER TYPE "estado_de_reserva" ADD VALUE 'finalizada';

CREATE TABLE "ventana_de_llegada" (
  "id" SERIAL PRIMARY KEY,
  "minutos_antes" SMALLINT NOT NULL CHECK ("minutos_antes" BETWEEN 0 AND 120),
  "minutos_despues" SMALLINT NOT NULL CHECK ("minutos_despues" BETWEEN 0 AND 120),
  "guardado_por_id" INTEGER NOT NULL REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "guardado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ventana_de_llegada_guardado_en_idx" ON "ventana_de_llegada"("guardado_en");

ALTER TABLE "reserva"
  ADD COLUMN "ventana_de_llegada_id" INTEGER REFERENCES "ventana_de_llegada"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD COLUMN "check_in_en" TIMESTAMPTZ(3),
  ADD COLUMN "check_in_por_id" INTEGER REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "reserva_check_in_completo" CHECK (("check_in_en" IS NULL) = ("check_in_por_id" IS NULL));
