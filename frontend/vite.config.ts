import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // T242: Configure CDN for static assets
  build: {
    // Code splitting and lazy loading (T244)
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd'],
          'vendor-utils': ['axios', 'zustand'],
        },
      },
    },
    
    // Optimize bundle size
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    
    // Generate sourcemaps for production debugging
    sourcemap: process.env.NODE_ENV !== 'production',
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd'],
  },
  
  // Server configuration
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  
  // Preview server (for production build testing)
  preview: {
    port: 4173,
  },
})
