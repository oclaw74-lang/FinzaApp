import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

const loginSchema = z.object({
  email: z.string().email('Email invalido.'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres.'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage(): JSX.Element {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm): Promise<void> => {
    setServerError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setServerError('Credenciales incorrectas. Verifica tu email y contrasena.')
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-finza-blue rounded-xl flex items-center justify-center">
              <span className="font-bold text-white text-lg">F</span>
            </div>
            <span className="font-bold text-2xl text-finza-blue">{APP_NAME}</span>
          </div>
          <p className="text-gray-500 text-sm">{APP_TAGLINE}</p>
        </div>

        <div className="finza-card">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Iniciar sesion</h1>

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
              placeholder="..."
              error={errors.password?.message}
              {...register('password')}
            />

            {serverError && (
              <p className="text-sm text-alert-red bg-red-50 border border-red-200 rounded-lg p-3">
                {serverError}
              </p>
            )}

            <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            No tienes cuenta?{' '}
            <Link to="/register" className="text-finza-blue font-medium hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
