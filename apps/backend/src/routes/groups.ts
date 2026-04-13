import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getDb } from '../db/index'

const GroupBody = z.object({
  name:  z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
  icon:  z.string().default('folder'),
})

export async function groupsRoutes(app: FastifyInstance) {
  app.get('/groups', async () => {
    return getDb().prepare('SELECT * FROM groups ORDER BY name ASC').all()
  })

  app.post('/groups', async (req, reply) => {
    const body = GroupBody.parse(req.body)
    const { lastInsertRowid } = getDb()
      .prepare('INSERT INTO groups (name, color, icon) VALUES (?, ?, ?)')
      .run(body.name, body.color, body.icon)
    return reply.status(201).send({ id: Number(lastInsertRowid) })
  })

  app.patch<{ Params: { id: string } }>('/groups/:id', async (req, reply) => {
    const body = GroupBody.partial().parse(req.body)
    const db = getDb()
    const fields: string[] = []
    const values: unknown[] = []

    if (body.name  !== undefined) { fields.push('name = ?');  values.push(body.name) }
    if (body.color !== undefined) { fields.push('color = ?'); values.push(body.color) }
    if (body.icon  !== undefined) { fields.push('icon = ?');  values.push(body.icon) }

    if (fields.length === 0) return reply.status(400).send({ error: 'Nothing to update' })
    values.push(req.params.id)
    db.prepare(`UPDATE groups SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return reply.status(204).send()
  })

  app.delete<{ Params: { id: string } }>('/groups/:id', async (req, reply) => {
    getDb().prepare('DELETE FROM groups WHERE id = ?').run(req.params.id)
    return reply.status(204).send()
  })
}
