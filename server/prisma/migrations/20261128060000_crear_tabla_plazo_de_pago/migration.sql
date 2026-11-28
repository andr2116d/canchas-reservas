-- CreateTable
CREATE TABLE "plazo_de_pago" (
    "id" SERIAL NOT NULL,
    "minutos" SMALLINT NOT NULL,
    "guardado_por_id" INTEGER NOT NULL,
    "guardado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plazo_de_pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plazo_de_pago_guardado_en_idx" ON "plazo_de_pago"("guardado_en");

-- AddForeignKey
ALTER TABLE "plazo_de_pago" ADD CONSTRAINT "plazo_de_pago_guardado_por_id_fkey" FOREIGN KEY ("guardado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- El plazo para pagar es un número entero de minutos: de 1 a 1440 (24 horas).
ALTER TABLE "plazo_de_pago" ADD CONSTRAINT "plazo_de_pago_minutos_check" CHECK ("minutos" BETWEEN 1 AND 1440);
