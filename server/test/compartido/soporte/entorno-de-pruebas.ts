import { urlBaseDePruebas } from './url-base-de-pruebas';

// Cada archivo de pruebas trabaja contra la base de pruebas y sin exigir HTTPS.
process.env.DATABASE_URL = urlBaseDePruebas();
process.env.NODE_ENV = 'test';
