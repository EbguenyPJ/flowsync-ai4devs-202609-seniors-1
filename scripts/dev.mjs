// Levanta backend y frontend a la vez (lo usa `make start`). Sin dependencias.
//
// Por qué no basta con `cmd1 & cmd2 & wait` en el Makefile:
// - En un sh no interactivo (el de make), POSIX hace que los procesos lanzados con `&`
//   ignoren SIGINT, así que Ctrl+C no les llega.
// - `node ace serve --hmr` solo se cierra con SIGINT; ignora SIGTERM.
// Aquí cada servidor va en su propio grupo de procesos y se le reenvía SIGINT al grupo
// entero (npm, el watcher y el servidor real). Si no se cierra, SIGKILL.

import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const GRACE_MS = 5000

const services = [
  { name: 'backend', cwd: join(root, 'backend') },
  { name: 'frontend', cwd: join(root, 'frontend') },
]

let shuttingDown = false
let exitCode = 0

for (const service of services) {
  // stdin ignorado: un grupo en segundo plano que lee de la terminal se para (SIGTTIN).
  service.child = spawn('npm', ['run', 'dev'], {
    cwd: service.cwd,
    stdio: ['ignore', 'inherit', 'inherit'],
    detached: true,
  })
  service.running = true

  service.child.on('error', (error) => {
    console.error(`[${service.name}] no se pudo arrancar: ${error.message}`)
    service.running = false
    shutdown(1)
  })

  service.child.on('exit', (code, signal) => {
    service.running = false
    if (!shuttingDown) {
      console.error(
        `[${service.name}] terminó (${signal ?? `código ${code}`}); parando el resto.`,
      )
      shutdown(code || 1)
    } else if (services.every((s) => !s.running)) {
      process.exit(exitCode)
    }
  })
}

function signalGroup(service, signal) {
  if (!service.running) return
  try {
    process.kill(-service.child.pid, signal)
  } catch {
    // El grupo ya no existe.
  }
}

function shutdown(code) {
  if (shuttingDown) return
  shuttingDown = true
  exitCode = code
  for (const service of services) signalGroup(service, 'SIGINT')
  if (services.every((s) => !s.running)) process.exit(exitCode)
  setTimeout(() => {
    for (const service of services) signalGroup(service, 'SIGKILL')
    process.exit(exitCode)
  }, GRACE_MS).unref()
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
process.on('SIGHUP', () => shutdown(0))
