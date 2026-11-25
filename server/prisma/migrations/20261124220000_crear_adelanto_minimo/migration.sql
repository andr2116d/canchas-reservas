-- CreateTable
CREATE TABLE "adelanto_minimo" (
    "id" SERIAL NOT NULL,
    "porcentaje" SMALLINT NOT NULL,
    "guardado_por_id" INTEGER NOT NULL,
    "guardado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adelanto_minimo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adelanto_minimo_guardado_en_idx" ON "adelanto_minimo"("guardado_en");

-- AddForeignKey
ALTER TABLE "adelanto_minimo" ADD CONSTRAINT "adelanto_minimo_guardado_por_id_fkey" FOREIGN KEY ("guardado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- El adelanto es un porcentaje entero del precio del turno: de 1 a 100.
ALTER TABLE "adelanto_minimo" ADD CONSTRAINT "adelanto_minimo_porcentaje_check" CHECK ("porcentaje" BETWEEN 1 AND 100);
