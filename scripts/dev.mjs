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

const POLL_MS = 200

let shuttingDown = false

for (const service of services) {
  // stdin ignorado: un grupo en segundo plano que lee de la terminal se para (SIGTTIN).
  service.child = spawn('npm', ['run', 'dev'], {
    cwd: service.cwd,
    stdio: ['ignore', 'inherit', 'inherit'],
    detached: true,
  })

  service.child.on('error', (error) => {
    console.error(`[${service.name}] no se pudo arrancar: ${error.message}`)
    shutdown(1)
  })

  // Que salga npm no significa que haya salido el servidor (vite, ace serve y su
  // hijo siguen en el grupo): por eso el cierre mira el grupo, no este evento.
  service.child.on('exit', (code, signal) => {
    if (shuttingDown) return
    console.error(
      `[${service.name}] terminó (${signal ?? `código ${code}`}); parando el resto.`,
    )
    shutdown(code || 1)
  })
}

// Señal a todo el grupo del servicio. Devuelve false si ya no queda ningún proceso en él.
function signalGroup(service, signal) {
  if (service.child.pid === undefined) return false
  try {
    process.kill(-service.child.pid, signal)
    return true
  } catch {
    return false
  }
}

function shutdown(code) {
  if (shuttingDown) return
  shuttingDown = true
  for (const service of services) signalGroup(service, 'SIGINT')

  const deadline = Date.now() + GRACE_MS
  const timer = setInterval(() => {
    // La señal 0 no hace nada: solo comprueba si el grupo sigue vivo.
    const alive = services.filter((service) => signalGroup(service, 0))
    if (alive.length > 0 && Date.now() < deadline) return
    for (const service of alive) signalGroup(service, 'SIGKILL')
    clearInterval(timer)
    process.exit(code)
  }, POLL_MS)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
process.on('SIGHUP', () => shutdown(0))
