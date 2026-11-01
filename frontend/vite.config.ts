import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Public files keep their names, so version references when their contents change.
// Transform CSS selectors too, keeping img[src="..."] aligned with JSX URLs.
function versionPublicAssets(): Plugin {
  let root = ''
  let publicDir = ''
  return {
    name: 'version-public-assets',
    apply: 'build',
    enforce: 'pre',
    configResolved(config) {
      root = config.root
      publicDir = config.publicDir
    },
    transform(code, id) {
      const filename = id.split('?')[0]
      if (!publicDir || !filename.startsWith(resolve(root, 'src') + '/') || !/\.(?:[jt]sx?|css)$/.test(filename)) return
      const next = code.replace(/(["'`])(\/[^"'`?\s]+\.(?:png|svg|webp|jpe?g|gif|woff2?))\1/g, (match, quote, url) => {
        const file = resolve(publicDir, url.slice(1))
        if (!existsSync(file)) return match
        const version = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 12)
        return `${quote}${url}?v=${version}${quote}`
      })
      if (next !== code) return { code: next, map: null }
    },
  }
}

export default defineConfig({
  plugins: [versionPublicAssets(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
