"use client"

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, Sparkles, CheckCircle, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Validação de email melhorada
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  useEffect(() => {
    // Verificar se usuario ja esta logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Sessão atual:', session ? 'Logado' : 'Não logado')
      if (session) {
        router.push('/dashboard')
      } else {
        setLoading(false)
      }
    })

    // Escutar mudancas de autenticacao
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Evento de autenticação:', event, session ? 'Logado' : 'Não logado')
      if (session) {
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Prevenir múltiplos envios
    if (submitting) {
      return
    }

    setSubmitting(true)

    console.log('Iniciando', isSignUp ? 'cadastro' : 'login', 'com email:', email)

    try {
      // Validação de email
      if (!isValidEmail(email)) {
        setError('Por favor, insira um email válido')
        setSubmitting(false)
        return
      }

      if (isSignUp) {
        // Validar tamanho da senha
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres')
          setSubmitting(false)
          return
        }

        // Validar confirmacao de senha
        if (password !== confirmPassword) {
          setError('As senhas não coincidem')
          setSubmitting(false)
          return
        }

        // Validar força da senha
        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
          setError('A senha deve conter letras e números para maior segurança')
          setSubmitting(false)
          return
        }

        console.log('Tentando criar conta...')

        // Criar conta
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              email_confirmed: false
            }
          }
        })

        console.log('Resposta do signUp:', { data, error })

        if (error) {
          console.error('Erro ao criar conta:', error)
          throw error
        }

        // Verificar se precisa confirmar email
        if (data?.user && !data?.session) {
          console.log('Conta criada! Aguardando confirmação de email.')
          setSuccess('✅ Conta criada com sucesso! Verifique seu email para confirmar o cadastro.')
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          // Mudar para modo login após 3 segundos
          setTimeout(() => {
            setIsSignUp(false)
            setSuccess('')
          }, 5000)
        } else if (data?.session) {
          console.log('Conta criada e logado automaticamente!')
          setSuccess('✅ Conta criada com sucesso! Redirecionando...')
        }
      } else {
        console.log('Tentando fazer login...')

        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        console.log('Resposta do signIn:', { data, error })

        if (error) {
          console.error('Erro ao fazer login:', error)
          throw error
        }

        console.log('Login bem-sucedido!')
        setSuccess('✅ Login realizado! Redirecionando...')
      }
    } catch (error: any) {
      console.error('Erro capturado:', error)
      
      // Mensagens de erro mais amigáveis e específicas
      let errorMessage = 'Ocorreu um erro. Tente novamente.'
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = '❌ Email ou senha incorretos'
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = '⚠️ Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.'
      } else if (error.message?.includes('User already registered')) {
        errorMessage = '⚠️ Este email já está cadastrado. Tente fazer login ou recuperar sua senha.'
        // Sugerir mudança para login
        setTimeout(() => {
          setIsSignUp(false)
          setError('')
        }, 3000)
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        errorMessage = '❌ A senha deve ter pelo menos 6 caracteres'
      } else if (error.message?.includes('Unable to validate email address')) {
        errorMessage = '❌ Email inválido. Verifique se digitou corretamente.'
      } else if (error.message?.includes('Email rate limit exceeded')) {
        errorMessage = '⚠️ Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`
      }
      
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-purple-950/20 to-[#0a0a0a] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
          <div className="relative animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-purple-950/20 to-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efeito de fundo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo e Titulo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            {/* Logo com efeito glow */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl transform group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Nome com animacao */}
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent tracking-tight mb-2 animate-gradient bg-[length:200%_auto]">
            tumaps
          </h1>
          <p className="text-gray-400 animate-fade-in-delay">Entre para comecar sua jornada magica</p>
        </div>

        {/* Card de Login com Glass Morphism */}
        <div className="relative group">
          {/* Borda gradiente animada */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl opacity-30 group-hover:opacity-50 blur transition-opacity duration-500"></div>
          
          <div className="relative bg-[#1a1a1a]/80 backdrop-blur-xl border border-purple-900/30 rounded-3xl p-8 shadow-2xl shadow-purple-900/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="animate-slide-up">
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-[#0a0a0a]/50 backdrop-blur-sm border border-[#4a4a4a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 hover:border-purple-500/50"
                  placeholder="seu@email.com"
                />
              </div>

              {/* Senha */}
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                  Senha {isSignUp && <span className="text-gray-500">(mínimo 6 caracteres, letras e números)</span>}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className="w-full px-4 py-3 bg-[#0a0a0a]/50 backdrop-blur-sm border border-[#4a4a4a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 pr-12 hover:border-purple-500/50"
                    placeholder="senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-all duration-300 hover:scale-110"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha (apenas no cadastro) */}
              {isSignUp && (
                <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full px-4 py-3 bg-[#0a0a0a]/50 backdrop-blur-sm border border-[#4a4a4a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 pr-12 hover:border-purple-500/50"
                      placeholder="confirme a senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-all duration-300 hover:scale-110"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Mensagem de sucesso */}
              {success && (
                <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-3 text-green-400 text-sm animate-fade-in flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* Mensagem de erro com animacao */}
              {error && (
                <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-3 text-red-400 text-sm animate-shake flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botao de submit com efeito especial */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full relative group bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      {isSignUp ? 'Criando conta...' : 'Entrando...'}
                    </>
                  ) : (
                    <>
                      {isSignUp ? 'Criar conta' : 'Entrar'}
                      <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                    </>
                  )}
                </span>
              </button>

              {/* Toggle entre login e cadastro */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                    setSuccess('')
                    setConfirmPassword('')
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm transition-all duration-300 hover:scale-105 inline-block"
                >
                  {isSignUp ? 'Ja tem uma conta? Entre' : 'Nao tem uma conta? Cadastre-se'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6 animate-fade-in-delay-2">
          Ao continuar, voce concorda com nossos Termos de Servico e Politica de Privacidade
        </p>

        {/* Dica de debug */}
        <div className="mt-4 text-center">
          <p className="text-gray-600 text-xs">
            💡 Dica: Abra o Console do navegador (F12) para ver detalhes técnicos
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.2s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 0.6s ease-out 0.4s both;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out both;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
