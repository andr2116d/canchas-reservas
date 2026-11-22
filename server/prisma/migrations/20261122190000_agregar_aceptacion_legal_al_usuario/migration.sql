-- Las cuentas anteriores conservan sus datos sin atribuirles una aceptación.
ALTER TABLE usuario
    ADD COLUMN version_legal_aceptada TEXT,
    ADD COLUMN aceptacion_legal_en TIMESTAMPTZ(3),
    ADD COLUMN canal_aceptacion_legal TEXT;
