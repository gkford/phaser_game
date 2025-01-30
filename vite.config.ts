import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        host: true,
        port: 8000,
    },
    base: './',
    build: {
        sourcemap: true,
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    },
    optimizeDeps: {
        include: ['phaser']
    }
})
