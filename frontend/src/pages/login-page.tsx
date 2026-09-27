import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthCard, FormError, FormField } from '@/components/auth-form'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/profile', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setFormError('Email o contraseña incorrectos.')
      } else if (error instanceof ApiError && error.status === 422) {
        const messages: Record<string, string> = {}
        if (error.fieldErrors.email)
          messages.email = 'Introduce un email válido.'
        if (error.fieldErrors.password)
          messages.password = 'Introduce tu contraseña.'
        setFieldErrors(messages)
      } else if (error instanceof ApiError && error.status === 0) {
        setFormError(error.message)
      } else {
        setFormError('No se pudo iniciar sesión. Inténtalo de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Inicia sesión"
      description="Entra con tu email y contraseña."
      footer={
        <p>
          ¿No tienes cuenta?{' '}
          <Link
            to="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Regístrate
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormError message={formError} />
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <FormField
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Entrando…' : 'Iniciar sesión'}
        </Button>
      </form>
    </AuthCard>
  )
}
