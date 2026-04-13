import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getDb } from '../db/index'
import { signToken } from '../lib/jwt'

// ─── Public: login ────────────────────────────────────────────────────────────

export async function loginRoute(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const { username, password } = z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }).parse(req.body)

    const user = getDb()
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as { id: number; username: string; password_hash: string } | undefined

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const token = await signToken({ sub: String(user.id), username: user.username })
    return { token, username: user.username }
  })
}

// ─── Protected: me + change password ─────────────────────────────────────────

export async function protectedAuthRoutes(app: FastifyInstance) {
  // GET /api/auth/me
  app.get('/auth/me', async (req) => {
    return { username: req.user!.username }
  })

  // PATCH /api/auth/password
  app.patch('/auth/password', async (req, reply) => {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword:     z.string().min(8, 'Password must be at least 8 characters'),
    }).parse(req.body)

    const db = getDb()
    const user = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(req.user!.sub) as { id: number; password_hash: string } | undefined

    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return reply.status(401).send({ error: 'Current password is incorrect' })
    }

    const newHash = bcrypt.hashSync(newPassword, 12)
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id)

    return reply.status(204).send()
  })
}
