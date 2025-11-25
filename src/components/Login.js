'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Dumbbell, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const { user, loading: authLoading, firebaseError, signIn, signUp, resetPassword, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Mostrar erro se Firebase não estiver configurado
  useEffect(() => {
    if (firebaseError && firebaseError.includes('não está configurado')) {
      setError('Firebase não está configurado. Configure as variáveis de ambiente no arquivo .env.local');
    }
  }, [firebaseError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
      } else {
        result = await signIn(email, password);
      }

      if (result.success) {
        // Login bem-sucedido - o useEffect vai redirecionar automaticamente
        // Limpar campos
        setEmail('');
        setPassword('');
      } else {
        // Traduzir mensagens de erro comuns
        const errorMessages = {
          'auth/user-not-found': 'Usuário não encontrado.',
          'auth/wrong-password': 'Senha incorreta.',
          'auth/email-already-in-use': 'Este email já está em uso.',
          'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
          'auth/invalid-email': 'Email inválido.',
          'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
          'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.'
        };
        
        setError(errorMessages[result.error] || result.error || 'Ocorreu um erro. Tente novamente.');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.success) {
        // Login bem-sucedido - o useEffect vai redirecionar automaticamente
      } else {
        setError(result.error || 'Erro ao fazer login com Google.');
      }
    } catch (err) {
      setError('Erro ao fazer login com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setResetEmailSent(true);
      } else {
        const errorMessages = {
          'auth/user-not-found': 'Usuário não encontrado.',
          'auth/invalid-email': 'Email inválido.'
        };
        setError(errorMessages[result.error] || result.error || 'Erro ao enviar email de recuperação.');
      }
    } catch (err) {
      setError('Erro ao enviar email de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  // Mostrar aviso se Firebase não estiver configurado
  const showFirebaseConfigError = firebaseError && firebaseError.includes('não está configurado');

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-purple-500/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl mb-4 shadow-lg">
              <Lock className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Recuperar Senha</h1>
            <p className="text-purple-300">
              {resetEmailSent 
                ? 'Email enviado! Verifique sua caixa de entrada.' 
                : 'Digite seu email para receber o link de recuperação'}
            </p>
          </div>

          {resetEmailSent ? (
            <div className="space-y-4">
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-green-300 text-sm">
                Enviamos um email para <strong>{email}</strong> com instruções para redefinir sua senha.
              </div>
              <button
                onClick={() => {
                  setShowResetPassword(false);
                  setResetEmailSent(false);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-300 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Enviando...' : 'Enviar Email de Recuperação'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPassword(false);
                    setError('');
                  }}
                  className="text-purple-300 text-sm hover:text-purple-200 transition-colors"
                >
                  Voltar ao Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-purple-500/20 shadow-2xl">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl mb-4 shadow-lg">
            <Dumbbell className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Meus Treinos</h1>
          <p className="text-purple-300">
            {isSignUp ? 'Crie sua conta para começar' : 'Entre para continuar seu treino'}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {showFirebaseConfigError && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-2 text-yellow-300 text-sm">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">⚠️ Firebase não configurado</p>
                  <p className="text-yellow-200/80 text-xs mb-2">
                    Para usar a autenticação, você precisa configurar as variáveis de ambiente do Firebase.
                  </p>
                  <ol className="text-yellow-200/80 text-xs list-decimal list-inside space-y-1">
                    <li>Crie um arquivo <code className="bg-yellow-900/30 px-1 rounded">.env.local</code> na raiz do projeto</li>
                    <li>Adicione as variáveis do Firebase (veja <code className="bg-yellow-900/30 px-1 rounded">FIREBASE_SETUP.md</code>)</li>
                    <li>Reinicie o servidor de desenvolvimento</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          {error && !showFirebaseConfigError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-purple-200 text-sm font-medium mb-2">
              <Mail size={16} className="inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-purple-200 text-sm font-medium mb-2">
              <Lock size={16} className="inline mr-2" />
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Botão Principal */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>

          {/* Esqueceu senha (apenas no login) */}
          {!isSignUp && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-purple-300 text-sm hover:text-purple-200 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-purple-300">ou continue com</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          {/* Toggle Login/Cadastro */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-purple-300 text-sm hover:text-purple-200 transition-colors"
            >
              {isSignUp ? (
                <>
                  Já tem conta? <span className="font-semibold">Entre aqui</span>
                </>
              ) : (
                <>
                  Não tem conta? <span className="font-semibold">Cadastre-se</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-purple-500/20">
          <p className="text-center text-purple-300/60 text-xs">
            Ao continuar, você concorda com nossos<br/>
            <button className="hover:text-purple-300 underline">Termos de Uso</button> e{' '}
            <button className="hover:text-purple-300 underline">Política de Privacidade</button>
          </p>
        </div>
      </div>
    </div>
  );
}

