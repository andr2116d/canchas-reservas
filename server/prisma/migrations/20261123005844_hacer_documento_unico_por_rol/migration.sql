-- DropIndex
DROP INDEX "usuario_documento_hash_key";

-- CreateIndex
CREATE UNIQUE INDEX "usuario_documento_hash_rol_key" ON "usuario"("documento_hash", "rol");

