import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../app/AuthProvider'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ShieldAlert, Lock, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('elena.vance@technova.internal')
  const [password, setPassword] = useState('password123')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickDemoLogin = async () => {
    setEmail('elena.vance@technova.internal')
    setPassword('password123')
    setIsLoading(true)
    setError(null)
    try {
      await signIn('elena.vance@technova.internal', 'password123')
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand identity header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-950/50 mb-3">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            TalentGuard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 uppercase tracking-wider font-medium">
            Retention Command Center · TechNova HR
          </p>
        </div>

        <Card className="bg-slate-950/80 border-slate-800 text-slate-100 shadow-2xl backdrop-blur-md">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <CardTitle className="text-lg text-white font-bold">Authorized Sign-In</CardTitle>
            <CardDescription className="text-slate-400">
              Access capacity-constrained employee attrition analytics and intervention records
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  HR Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hr.manager@technova.internal"
                    className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Password
                  </label>
                  <span className="text-[11px] text-emerald-400 cursor-pointer hover:underline">
                    Demo Credentials
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 border-t border-slate-800/60 mt-4">
              <Button
                type="submit"
                disabled={isLoading}
                isLoading={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5"
              >
                Sign In to Command Center
              </Button>

              <div className="w-full text-center">
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-slate-950 px-2 text-slate-500 font-mono">Evaluation Shortcut</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleQuickDemoLogin}
                  disabled={isLoading}
                  className="w-full border-slate-700 bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 text-xs py-2 gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Login as Demo HR Manager (Elena Vance)</span>
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
