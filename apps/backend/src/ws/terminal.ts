import { FastifyInstance } from 'fastify'
import { Client as SshClient, ConnectConfig } from 'ssh2'
import { getDb } from '../db/index'

export async function terminalWs(app: FastifyInstance) {
  app.get<{ Params: { hostId: string } }>(
    '/ws/terminal/:hostId',
    { websocket: true },
    (socket, req) => {
      const { hostId } = req.params
      const db = getDb()

      const host = db.prepare('SELECT * FROM hosts WHERE id = ?').get(hostId) as any
      if (!host) {
        socket.send(JSON.stringify({ type: 'error', payload: 'Host not found' }))
        socket.close()
        return
      }

      const cred = db.prepare('SELECT * FROM credentials WHERE host_id = ?').get(hostId) as any

      const ssh = new SshClient()
      let sshStream: any = null

      // Track session in history
      let historyId: number | null = null

      ssh.on('ready', () => {
        const { lastInsertRowid } = db.prepare(
          `INSERT INTO session_history (host_id) VALUES (?)`
        ).run(host.id)
        historyId = Number(lastInsertRowid)

        socket.send(JSON.stringify({ type: 'connected', payload: { host: host.label } }))

        ssh.shell({ term: 'xterm-256color', cols: 80, rows: 24 }, (err, stream) => {
          if (err) {
            socket.send(JSON.stringify({ type: 'error', payload: err.message }))
            ssh.end()
            return
          }

          sshStream = stream

          stream.on('data', (data: Buffer) => {
            socket.send(JSON.stringify({ type: 'data', payload: data.toString('utf8') }))
          })

          stream.stderr.on('data', (data: Buffer) => {
            socket.send(JSON.stringify({ type: 'data', payload: data.toString('utf8') }))
          })

          stream.on('close', () => {
            socket.send(JSON.stringify({ type: 'disconnect', payload: 'Session closed' }))
            closeSession()
            ssh.end()
          })
        })
      })

      ssh.on('error', (err) => {
        socket.send(JSON.stringify({ type: 'error', payload: err.message }))
        socket.close()
      })

      // Handle messages from browser
      socket.on('message', (raw: Buffer) => {
        try {
          const msg = JSON.parse(raw.toString())

          if (msg.type === 'data' && sshStream) {
            sshStream.write(msg.payload)
          } else if (msg.type === 'resize' && sshStream) {
            const { cols, rows } = msg.payload
            sshStream.setWindow(rows, cols, 0, 0)
          } else if (msg.type === 'disconnect') {
            sshStream?.close()
            ssh.end()
          }
        } catch { /* ignore malformed messages */ }
      })

      socket.on('close', () => {
        closeSession()
        sshStream?.close()
        ssh.end()
      })

      // Connect SSH
      const connectConfig: ConnectConfig = {
        host:     host.hostname,
        port:     host.port,
        username: host.username,
        readyTimeout: 10_000,
      }

      if (cred?.auth_type === 'password') {
        connectConfig.password = cred.encrypted_value
      } else if (cred?.auth_type === 'key') {
        connectConfig.privateKey = cred.encrypted_value
      }

      ssh.connect(connectConfig)

      function closeSession() {
        if (historyId !== null) {
          db.prepare(`
            UPDATE session_history
               SET disconnected_at = datetime('now'),
                   duration_seconds = CAST((julianday('now') - julianday(connected_at)) * 86400 AS INTEGER)
             WHERE id = ?
          `).run(historyId)
          historyId = null
        }
      }
    },
  )
}
