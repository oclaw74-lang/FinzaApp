import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_NAME } from '@/lib/constants'

const registerSchema = z
  .object({
    email: z.string().email('Email invalido.'),
    password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contrasenas no coinciden.',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage(): JSX.Element {
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterForm): Promise<void> => {
    setServerError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setServerError(error.message)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md finza-card text-center">
          <div className="text-5xl mb-4">Email enviado</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu email!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Te enviamos un link de confirmacion. Una vez confirmado, podras iniciar sesion.
          </p>
          <Link to="/login" className="text-finza-blue font-medium hover:underline text-sm">
            Ir a iniciar sesion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-finza-blue rounded-xl flex items-center justify-center">
              <span className="font-bold text-white text-lg">F</span>
            </div>
            <span className="font-bold text-2xl text-finza-blue">{APP_NAME}</span>
          </div>
        </div>

        <div className="finza-card">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Crear cuenta</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Correo electronico"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Contrasena"
              type="password"
              placeholder="Minimo 8 caracteres"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirmar contrasena"
              type="password"
              placeholder="Repite tu contrasena"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {serverError && (
              <p className="text-sm text-alert-red bg-red-50 border border-red-200 rounded-lg p-3">
                {serverError}
              </p>
            )}

            <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Ya tienes cuenta?{' '}
            <Link to="/login" className="text-finza-blue font-medium hover:underline">
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
