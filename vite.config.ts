import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const projectRoot = process.cwd();

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: { alias: { '@': resolve(projectRoot, 'src') } },
});
