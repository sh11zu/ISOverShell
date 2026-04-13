import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getDb } from '../db/index'

const CreateHostBody = z.object({
  label:       z.string().min(1).max(100),
  hostname:    z.string().min(1),
  port:        z.number().int().min(1).max(65535).default(22),
  username:    z.string().min(1),
  auth_type:   z.enum(['password', 'key']),
  group_id:    z.number().int().nullable().optional(),
  tags:        z.array(z.string()).default([]),
  password:    z.string().optional(),
  private_key: z.string().optional(),
})

const UpdateHostBody = CreateHostBody.partial()

export async function hostsRoutes(app: FastifyInstance) {
  // GET /api/hosts
  app.get('/hosts', async () => {
    const rows = getDb().prepare('SELECT * FROM hosts ORDER BY label ASC').all() as any[]
    return rows.map(row => ({ ...row, tags: JSON.parse(row.tags) }))
  })

  // GET /api/hosts/:id
  app.get<{ Params: { id: string } }>('/hosts/:id', async (req, reply) => {
    const row = getDb().prepare('SELECT * FROM hosts WHERE id = ?').get(req.params.id) as any
    if (!row) return reply.status(404).send({ error: 'Host not found' })
    return { ...row, tags: JSON.parse(row.tags) }
  })

  // POST /api/hosts
  app.post('/hosts', async (req, reply) => {
    const body = CreateHostBody.parse(req.body)
    const db = getDb()

    const { lastInsertRowid } = db.prepare(`
      INSERT INTO hosts (label, hostname, port, username, auth_type, group_id, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.label, body.hostname, body.port,
      body.username, body.auth_type,
      body.group_id ?? null,
      JSON.stringify(body.tags),
    )

    if (body.auth_type === 'password' && body.password) {
      db.prepare(
        `INSERT INTO credentials (host_id, auth_type, encrypted_value) VALUES (?, 'password', ?)`
      ).run(lastInsertRowid, body.password) // TODO: encrypt with AES-256
    } else if (body.auth_type === 'key' && body.private_key) {
      db.prepare(
        `INSERT INTO credentials (host_id, auth_type, encrypted_value) VALUES (?, 'key', ?)`
      ).run(lastInsertRowid, body.private_key) // TODO: encrypt with AES-256
    }

    return reply.status(201).send({ id: Number(lastInsertRowid) })
  })

  // PATCH /api/hosts/:id
  app.patch<{ Params: { id: string } }>('/hosts/:id', async (req, reply) => {
    const body = UpdateHostBody.parse(req.body)
    const db = getDb()

    const fields: string[] = []
    const values: unknown[] = []

    if (body.label     !== undefined) { fields.push('label = ?');     values.push(body.label) }
    if (body.hostname  !== undefined) { fields.push('hostname = ?');  values.push(body.hostname) }
    if (body.port      !== undefined) { fields.push('port = ?');      values.push(body.port) }
    if (body.username  !== undefined) { fields.push('username = ?');  values.push(body.username) }
    if (body.auth_type !== undefined) { fields.push('auth_type = ?'); values.push(body.auth_type) }
    if (body.group_id  !== undefined) { fields.push('group_id = ?');  values.push(body.group_id) }
    if (body.tags      !== undefined) { fields.push('tags = ?');      values.push(JSON.stringify(body.tags)) }

    if (fields.length === 0) return reply.status(400).send({ error: 'Nothing to update' })

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(req.params.id)

    db.prepare(`UPDATE hosts SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    return reply.status(204).send()
  })

  // DELETE /api/hosts/:id
  app.delete<{ Params: { id: string } }>('/hosts/:id', async (req, reply) => {
    getDb().prepare('DELETE FROM hosts WHERE id = ?').run(req.params.id)
    return reply.status(204).send()
  })
}
