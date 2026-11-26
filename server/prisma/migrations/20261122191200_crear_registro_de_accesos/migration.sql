CREATE TABLE registro_acceso (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ocurrido_en TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX registro_acceso_usuario_id_ocurrido_en_idx ON registro_acceso (usuario_id, ocurrido_en);
