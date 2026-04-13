import 'dotenv/config'
import Fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'path'
import { initDb } from './db/index'
import { hostsRoutes } from './routes/hosts'
import { groupsRoutes } from './routes/groups'
import { loginRoute, protectedAuthRoutes } from './routes/auth'
import { terminalWs } from './ws/terminal'
import { authPreHandler } from './lib/jwt'

const app = Fastify({ logger: { level: 'info' } })

const PORT    = Number(process.env.PORT  ?? 3001)
const IS_PROD = process.env.NODE_ENV === 'production'

async function bootstrap() {
  if (!IS_PROD) {
    await app.register(fastifyCors, { origin: 'http://localhost:5173' })
  }

  await app.register(fastifyWebsocket)

  initDb()

  // ── Public routes (no auth required) ────────────────────────────────────
  await app.register(loginRoute, { prefix: '/api' })

  // ── Protected routes ─────────────────────────────────────────────────────
  await app.register(async (scope) => {
    scope.addHook('preHandler', authPreHandler)
    await scope.register(protectedAuthRoutes, { prefix: '/api' })
    await scope.register(hostsRoutes,         { prefix: '/api' })
    await scope.register(groupsRoutes,        { prefix: '/api' })
  })

  // ── WebSocket (JWT verified inside handler) ──────────────────────────────
  await app.register(terminalWs)

  // ── Serve built frontend in production ───────────────────────────────────
  if (IS_PROD) {
    await app.register(fastifyStatic, {
      root: path.join(__dirname, '../../frontend/dist'),
      prefix: '/',
      wildcard: false,
    })
    app.setNotFoundHandler((_req, reply) => {
      reply.sendFile('index.html')
    })
  }

  await app.listen({ port: PORT, host: '0.0.0.0' })
  app.log.info(`ISOverShell running on http://0.0.0.0:${PORT}`)
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
