import { useEffect, useState } from 'react'
import { FormError } from '@/components/auth-form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ApiError, apiFetch, type User } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long' })

export function ProfilePage() {
  const { token, logout, clearSession } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let ignore = false
    apiFetch<User>('/account/profile', { token })
      .then((data) => {
        if (!ignore) setUser(data)
      })
      .catch((err: unknown) => {
        if (ignore) return
        // Token caducado o revocado: sin sesión, ProtectedRoute manda a /login.
        if (err instanceof ApiError && err.status === 401) clearSession(token)
        else if (err instanceof ApiError && err.status === 0)
          setError(err.message)
        else setError('No se pudo cargar tu perfil. Inténtalo de nuevo.')
      })
    return () => {
      ignore = true
    }
  }, [token, clearSession])

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Tu perfil</CardTitle>
          <CardDescription>Datos de tu cuenta en FlowSync.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FormError message={error} />
          {!user && !error && (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          )}
          {user && (
            <div className="flex items-center gap-4">
              <div
                aria-hidden
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground"
              >
                {user.initials}
              </div>
              <dl className="grid gap-1 text-sm">
                <dt className="sr-only">Nombre</dt>
                <dd className="font-medium">{user.fullName ?? 'Sin nombre'}</dd>
                <dt className="sr-only">Email</dt>
                <dd className="text-muted-foreground">{user.email}</dd>
                <dt className="sr-only">Miembro desde</dt>
                <dd className="text-muted-foreground">
                  Miembro desde {dateFormat.format(new Date(user.createdAt))}
                </dd>
              </dl>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
