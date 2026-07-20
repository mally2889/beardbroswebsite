import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { htmlPartials } from './vite-plugins/html-partials.js';

export default defineConfig({
  plugins: [htmlPartials(import.meta.dirname)],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        work: resolve(import.meta.dirname, 'work.html'),
        about: resolve(import.meta.dirname, 'about/index.html'),
        services: resolve(import.meta.dirname, 'services/index.html'),
        contact: resolve(import.meta.dirname, 'contact/index.html'),
      },
    },
  },
});
