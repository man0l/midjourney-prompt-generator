import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import compression from 'compression'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

async function createServer() {
  const app = express()
  app.use(compression())

  let vite
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite')
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    })
    app.use(vite.middlewares)
  } else {
    app.use('/assets', express.static(path.join(__dirname, 'dist/client/assets')))
  }

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl

    try {
      let template
      let render
      
      // Read index.html
      if (!isProduction) {
        // In development: Use Vite to read and transform the template
        template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
      } else {
        // In production: Use the built template and server-entry
        template = await fs.readFile(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
        render = (await import('./dist/server/entry-server.js')).render
      }

      // Render the app and get meta tags
      const { html, metaTags, ssrScript } = await render(url)

      // Insert meta tags, SSR data script, and rendered app HTML into the template
      const rendered = template
        .replace('<!--app-head-->', `${metaTags}\n    ${ssrScript}`)
        .replace('<!--app-html-->', html)

      // Send the rendered HTML
      res.status(200).set({ 'Content-Type': 'text/html' }).end(rendered)
    } catch (e) {
      // If an error is caught, let Vite fix the stack trace in development
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(e)
      }
      console.error(e)
      next(e)
    }
  })

  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}

createServer() 