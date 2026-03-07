import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const Login: React.FC = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const isFormValid = usernameOrEmail.trim().length > 0 && password.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!isFormValid) return;

        setIsSubmitting(true);
        try {
            const response = await authService.login({ email: usernameOrEmail.trim(), password });
            login(response);
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.response?.data?.message || 'Invalid email/username or password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b13] px-4 py-6 sm:px-6 lg:p-10 font-[Inter]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-28 left-[-10%] h-[440px] w-[440px] rounded-full bg-indigo-500/15 blur-[120px]" />
                <div className="absolute -bottom-24 right-[-10%] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
            </div>

            <div className="relative flex w-full max-w-[1180px] overflow-hidden rounded-[32px] border border-white/10 bg-[#0c1018]/95 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm">
                <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:w-[46%] lg:px-12 xl:px-16">
                    <div className="mx-auto w-full max-w-[440px]">
                    <div className="mb-9 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white shadow-[0_10px_24px_rgba(102,126,234,0.35)]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M22 2 11 13" />
                                <path d="m22 2-7 20-4-9-9-4Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Voyager</p>
                            <p className="text-lg font-black tracking-tight text-white">Control Center</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-black leading-tight text-white">Welcome back</h1>
                        <p className="mt-2 text-sm text-slate-400">Sign in to manage campaigns, leads, and customer journeys.</p>
                    </div>

                    {error && (
                        <div aria-live="polite" className="mb-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label htmlFor="usernameOrEmail" className="ml-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Identity</label>
                            <input
                                id="usernameOrEmail"
                                type="text"
                                required
                                autoComplete="username"
                                value={usernameOrEmail}
                                onChange={(e) => setUsernameOrEmail(e.target.value)}
                                placeholder="Email or Username"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="ml-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Password</label>
                                <button type="button" className="text-[11px] font-semibold text-slate-500 hover:text-indigo-300 transition-colors" onClick={() => setError('Password reset is not available yet. Please contact your admin.')}>Forgot password?</button>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !isFormValid}
                            className="mt-2 h-[50px] w-full rounded-lg bg-white text-sm font-extrabold tracking-wide text-slate-900 shadow-[0_10px_24px_rgba(255,255,255,0.16)] transition-all hover:-translate-y-[1px] hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-slate-400 disabled:shadow-none"
                        >
                            {isSubmitting ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold tracking-wide text-slate-500">
                        New to Voyager?{' '}
                        <button
                            onClick={() => navigate('/register')}
                            className="inline-flex h-8 items-center rounded-md border border-white/15 px-3 text-xs font-semibold text-slate-200 transition-all hover:bg-white/10"
                        >
                            Create account
                        </button>
                    </p>
                    </div>
                </div>

                <div className="hidden lg:relative lg:flex lg:w-[54%] lg:flex-col lg:items-center lg:justify-center lg:bg-[#06080f] lg:p-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_58%)]" />
                    <div className="relative z-10 w-full max-w-xl rounded-[34px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-5 shadow-2xl backdrop-blur-2xl">
                        <div className="relative overflow-hidden rounded-[24px] border border-white/10">
                            <img
                                src="https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=1000&auto=format&fit=crop"
                                alt="Voyager destination"
                                className="h-[450px] w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                            <div className="absolute bottom-8 left-8 right-8">
                                <span className="inline-flex rounded-full bg-indigo-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Command View</span>
                                <h3 className="mt-3 text-3xl font-black leading-tight text-white">Operate every journey from one place.</h3>
                            </div>
                        </div>
                    </div>
                    <p className="relative z-10 mt-8 max-w-md text-center text-sm leading-relaxed text-slate-400">
                        Track leads, automate outreach, and move faster with a workspace built for travel operations.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
