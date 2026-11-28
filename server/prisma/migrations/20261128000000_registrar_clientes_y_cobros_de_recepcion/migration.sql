ALTER TABLE "usuario"
  ALTER COLUMN "correo_cifrado" DROP NOT NULL,
  ALTER COLUMN "correo_hash" DROP NOT NULL,
  ALTER COLUMN "contrasena_hash" DROP NOT NULL,
  ADD COLUMN "celular_hash" TEXT,
  ADD COLUMN "aviso_de_privacidad_informado_por_id" INTEGER,
  ADD CONSTRAINT "usuario_aviso_de_privacidad_informado_por_id_fkey"
    FOREIGN KEY ("aviso_de_privacidad_informado_por_id") REFERENCES "usuario"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "usuario_credenciales_coherentes"
    CHECK (("correo_cifrado" IS NULL) = ("correo_hash" IS NULL)
      AND ("contrasena_hash" IS NULL OR "correo_hash" IS NOT NULL)
      AND ("rol" = 'jugador' OR "contrasena_hash" IS NOT NULL));

CREATE INDEX "usuario_rol_celular_hash_idx" ON "usuario"("rol", "celular_hash");

ALTER TYPE "canal_de_reserva" ADD VALUE 'recepcion';
CREATE TYPE "metodo_de_pago" AS ENUM ('efectivo', 'yape', 'plin');
CREATE TYPE "concepto_de_pago" AS ENUM ('adelanto');

CREATE TABLE "pago" (
  "id" SERIAL PRIMARY KEY,
  "reserva_id" INTEGER NOT NULL REFERENCES "reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "concepto" "concepto_de_pago" NOT NULL,
  "monto" DECIMAL(10,2) NOT NULL CHECK ("monto" > 0),
  "metodo" "metodo_de_pago" NOT NULL,
  "numero_operacion" TEXT,
  "registrado_por_id" INTEGER NOT NULL REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "registrado_en" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "pago_operacion_segun_metodo" CHECK (
    ("metodo" = 'efectivo' AND "numero_operacion" IS NULL)
    OR ("metodo" <> 'efectivo' AND "numero_operacion" IS NOT NULL AND length("numero_operacion") > 0)
  )
);

CREATE UNIQUE INDEX "pago_numero_operacion_key" ON "pago"("numero_operacion");
CREATE INDEX "pago_reserva_id_idx" ON "pago"("reserva_id");
CREATE INDEX "pago_registrado_por_id_registrado_en_idx" ON "pago"("registrado_por_id", "registrado_en");
