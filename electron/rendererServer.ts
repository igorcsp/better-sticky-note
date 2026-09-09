import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'http'
import { createReadStream, existsSync, statSync } from 'fs'
import { join, normalize, extname, sep } from 'path'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
}

let server: Server | null = null

function makeHandler(rootDir: string) {
  const root = normalize(rootDir)
  return (req: IncomingMessage, res: ServerResponse) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
      const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
      const filePath = normalize(join(root, rel))
      // Confine every request to the renderer directory (block path traversal).
      if (filePath !== root && !filePath.startsWith(root + sep)) {
        res.writeHead(403).end('Forbidden')
        return
      }
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        res.writeHead(404).end('Not found')
        return
      }
      res.writeHead(200, {
        'Content-Type': MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      })
      createReadStream(filePath).pipe(res)
    } catch {
      res.writeHead(500).end('Server error')
    }
  }
}

/**
 * Serves the built renderer over http://localhost so Firebase's Google sign-in
 * popup sees an authorized domain. Loading the renderer from file:// makes
 * signInWithPopup fail with auth/unauthorized-domain, because file:// can never
 * be added to Firebase's authorized-domains list, whereas `localhost` is
 * authorized by default (independent of port).
 *
 * Binds to the loopback interface only, so nothing off-machine can reach it.
 * The port is fixed (with a small fallback range) rather than ephemeral: the
 * origin — including port — keys both the persisted auth token
 * (browserLocalPersistence) and Firestore's IndexedDB cache, so a stable port
 * is what lets the user stay signed in across launches.
 */
export function startRendererServer(rootDir: string, preferredPort = 51789): Promise<string> {
  const handler = makeHandler(rootDir)
  return new Promise((resolve, reject) => {
    const tryListen = (port: number, attemptsLeft: number) => {
      const s = createServer(handler)
      s.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
          tryListen(port + 1, attemptsLeft - 1)
        } else {
          reject(err)
        }
      })
      s.listen(port, '127.0.0.1', () => {
        server = s
        resolve(`http://localhost:${port}`)
      })
    }
    tryListen(preferredPort, 5)
  })
}

/** Closes the renderer server, if running. Called on app quit. */
export function stopRendererServer(): void {
  server?.close()
  server = null
}
