import { defineConfig } from 'astro/config'
import glsl from 'vite-plugin-glsl'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://astro.build/config
export default defineConfig({
  site: 'https://nemutas.github.io',
  base: '/floating-primitives',
  // base: import.meta.env.DEV ? '/' : '/floating-primitives',
  vite: {
    plugins: [glsl(), wasm(), topLevelAwait()],
    build: {
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          assetFileNames: '[ext]/[name][extname]',
          entryFileNames: 'script/entry.js',
        },
      },
      cssCodeSplit: false,
    },
  },
})
