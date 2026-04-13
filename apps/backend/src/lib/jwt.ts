import { SignJWT, jwtVerify } from 'jose'
import type { FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: { sub: string; username: string }
  }
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'isovershell-dev-secret-change-in-production'
)

export async function signToken(payload: { sub: string; username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ sub: string; username: string }> {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload as { sub: string; username: string }
}

export async function authPreHandler(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization ?? ''
  if (!header.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Unauthorized' })
    return
  }
  try {
    req.user = await verifyToken(header.slice(7))
  } catch {
    reply.status(401).send({ error: 'Invalid or expired token' })
  }
}
