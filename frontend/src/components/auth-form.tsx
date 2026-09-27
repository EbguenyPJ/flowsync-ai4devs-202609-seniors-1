import type { ComponentProps, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Tarjeta centrada común a login y registro. */
export function AuthCard({
  title,
  description,
  footer,
  children,
}: {
  title: string
  description: string
  footer: ReactNode
  children: ReactNode
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          {footer}
        </CardFooter>
      </Card>
    </main>
  )
}

/** Error general del formulario (credenciales, red...), visible y anunciado. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

/** Label + input + error del campo, enlazados para lectores de pantalla. */
export function FormField({
  id,
  label,
  error,
  ...inputProps
}: { id: string; label: string; error?: string } & ComponentProps<'input'>) {
  const errorId = `${id}-error`
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
