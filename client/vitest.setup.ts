import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cada prueba empieza con la pantalla vacía.
afterEach(() => cleanup());
