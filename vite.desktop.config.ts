import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';

const rootDir=path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root:path.join(rootDir,'desktop'),
  base:'./',
  plugins:[react()],
  css:{postcss:{plugins:[tailwindcss()]}},
  resolve:{alias:{'@':rootDir}},
  build:{outDir:path.join(rootDir,'desktop-dist'),emptyOutDir:true},
});
