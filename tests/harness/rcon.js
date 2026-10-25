// Minimal Minecraft RCON client (one persistent connection, commands are serialised).
const net = require('net')

class Rcon {
  constructor (host, port, password) {
    this.host = host
    this.port = port
    this.password = password
    this.reqId = 0
    this.queue = Promise.resolve()
  }

  connect () {
    return new Promise((resolve, reject) => {
      this.sock = net.createConnection({ host: this.host, port: this.port }, async () => {
        try {
          const res = await this._send(3, this.password)
          if (res.id === -1) return reject(new Error('RCON auth failed'))
          resolve(this)
        } catch (e) { reject(e) }
      })
      this.sock.on('error', reject)
      this.buf = Buffer.alloc(0)
      this.pending = null
      this.sock.on('data', d => {
        this.buf = Buffer.concat([this.buf, d])
        while (this.buf.length >= 4) {
          const len = this.buf.readInt32LE(0)
          if (this.buf.length < len + 4) break
          const pkt = this.buf.subarray(4, 4 + len)
          this.buf = this.buf.subarray(4 + len)
          const id = pkt.readInt32LE(0)
          const raw = pkt.subarray(8, pkt.length - 2)
          // a response belongs to the pending request by id (auth failure answers -1); others are stale and dropped
          if (this.pending && (id === this.pending.id || id === -1)) this.pending.part(id, raw)
        }
      })
    })
  }

  _send (type, body) {
    return new Promise((resolve, reject) => {
      const id = ++this.reqId
      const payload = Buffer.concat([Buffer.alloc(8), Buffer.from(body, 'utf8'), Buffer.alloc(2)])
      payload.writeInt32LE(id, 0)
      payload.writeInt32LE(type, 4)
      const header = Buffer.alloc(4)
      header.writeInt32LE(payload.length, 0)
      const timer = setTimeout(() => { this.pending = null; reject(new Error(`RCON timeout: ${body}`)) }, 15000)
      // Long output arrives in 4096-byte fragments (vanilla RconClient): the response ends with a shorter fragment,
      // or after a short pause when it is an exact multiple of 4096.
      const parts = []
      let settle = null
      const done = rid => { clearTimeout(timer); clearTimeout(settle); this.pending = null; resolve({ id: rid, body: Buffer.concat(parts).toString('utf8') }) }
      this.pending = {
        id,
        part: (rid, raw) => {
          parts.push(raw)
          clearTimeout(settle)
          if (raw.length < 4096 || type === 3) done(rid); else settle = setTimeout(() => done(rid), 150)
        }
      }
      this.sock.write(Buffer.concat([header, payload]))
    })
  }

  /** Runs a console command and resolves with its output (colour codes stripped). */
  command (cmd) {
    const run = this.queue.then(() => this._send(2, cmd)).then(r => r.body.replace(/§./g, ''))
    this.queue = run.catch(() => {})
    return run
  }

  close () { if (this.sock) this.sock.end() }
}

module.exports = { Rcon }
