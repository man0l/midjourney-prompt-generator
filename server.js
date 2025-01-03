import express from 'express'
import fs from 'fs'
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

  app.use('*', async (req, res) => {
    const url = new URL(req.originalUrl, `http://${req.headers.host}`).pathname

    try {
      let template
      let render
      
      if (!isProduction) {
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
      } else {
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
        render = (await import('./dist/server/entry-server.js')).render
      }

      const appHtml = await render(url)
      const html = template.replace(`<div id="root"></div>`, `<div id="root">${appHtml}</div>`)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      if (e instanceof Response) {
        res.status(e.status).end(e.statusText)
        return
      }
      
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(e)
      }
      console.error(e)
      res.status(500).end(e.message)
    }
  })

  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}

createServer() 