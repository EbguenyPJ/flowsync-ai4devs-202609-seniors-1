import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthCard, FormError, FormField } from '@/components/auth-form'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useAuth, type SignupInput } from '@/lib/auth'

type Field = keyof SignupInput
type FieldErrors = Partial<Record<Field, string>>

// Mismos límites que signupValidator en backend/app/validators/user.ts.
const PASSWORD_MIN = 8
const PASSWORD_MAX = 32
const PASSWORD_LENGTH_MESSAGE = `La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`

function validate({
  email,
  password,
  passwordConfirmation,
}: SignupInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!email) errors.email = 'Introduce tu email.'
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    errors.password = PASSWORD_LENGTH_MESSAGE
  }
  if (passwordConfirmation !== password) {
    errors.passwordConfirmation = 'Las contraseñas no coinciden.'
  }
  return errors
}

/** Traduce los errores 422 del backend (regla VineJS por campo) a mensajes claros. */
function messagesFromApi(error: ApiError): FieldErrors {
  const messages: FieldErrors = {}
  const { rules, fieldErrors } = error
  if (fieldErrors.email) {
    messages.email =
      rules.email === 'database.unique'
        ? 'Este email ya está registrado. ¿Quieres iniciar sesión?'
        : 'Introduce un email válido.'
  }
  if (fieldErrors.password) messages.password = PASSWORD_LENGTH_MESSAGE
  if (fieldErrors.passwordConfirmation) {
    messages.passwordConfirmation =
      rules.passwordConfirmation === 'sameAs'
        ? 'Las contraseñas no coinciden.'
        : PASSWORD_LENGTH_MESSAGE
  }
  return messages
}

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<SignupInput>({
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field: Field) {
    return (event: ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const input = { ...values, email: values.email.trim() }
    const clientErrors = validate(input)
    setFieldErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) return

    setSubmitting(true)
    try {
      await signup(input)
      navigate('/profile', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const messages = messagesFromApi(error)
        setFieldErrors(messages)
        // Un 422 de un campo que no pintamos no debe quedar en silencio.
        if (Object.keys(messages).length === 0)
          setFormError('Revisa los datos del formulario.')
      } else if (error instanceof ApiError && error.status === 0) {
        setFormError(error.message)
      } else {
        setFormError('No se pudo crear la cuenta. Inténtalo de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Regístrate con tu email y una contraseña."
      footer={
        <p>
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <FormError message={formError} />
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={update('email')}
          error={fieldErrors.email}
        />
        <FormField
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={update('password')}
          error={fieldErrors.password}
        />
        <FormField
          id="passwordConfirmation"
          label="Repite la contraseña"
          type="password"
          autoComplete="new-password"
          value={values.passwordConfirmation}
          onChange={update('passwordConfirmation')}
          error={fieldErrors.passwordConfirmation}
        />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthCard>
  )
}
