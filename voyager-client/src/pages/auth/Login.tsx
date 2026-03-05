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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const response = await authService.login({ email: usernameOrEmail, password });
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
        <div className="flex min-h-screen items-center justify-center bg-[#080c14] p-6 lg:p-10 font-[Inter]">
            <div className="flex w-full max-w-5xl overflow-hidden rounded-[40px] bg-[#0d1117] border border-white/5 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
                
                {/* Form Side */}
                <div className="flex w-full flex-col justify-center px-8 py-16 lg:w-[45%] lg:px-14 xl:px-20">
                    <div className="mb-12 flex items-center gap-3 anim-slide-up">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] text-2xl font-bold text-white shadow-[0_8px_24px_rgba(102,126,234,0.3)]">
                            ✈️
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-white">Voyager</span>
                    </div>

                    <div className="anim-slide-up delay-1">
                        <h1 className="pb-2 text-3xl font-black text-white">Welcome Back</h1>
                        <p className="mb-10 text-sm font-medium text-slate-400">Elevate your travel operations today.</p>
                    </div>

                    {error && (
                        <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-400 anim-shake">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6 anim-slide-up delay-2" onSubmit={handleSubmit}>
                        <div className="space-y-1.5">
                            <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Identity</label>
                            <input
                                id="usernameOrEmail"
                                type="text"
                                required
                                value={usernameOrEmail}
                                onChange={(e) => setUsernameOrEmail(e.target.value)}
                                placeholder="Email or Username"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white placeholder:text-slate-600 focus:border-[#667eea] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-1.5 relative">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Security</label>
                                <button type="button" className="text-[10px] font-bold text-slate-600 hover:text-indigo-400 transition-colors uppercase tracking-widest">Forgot?</button>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white placeholder:text-slate-600 focus:border-[#667eea] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-4 w-full h-[56px] rounded-2xl bg-[#667eea] text-white font-bold text-sm shadow-[0_12px_32px_rgba(102,126,234,0.3)] hover:translate-y-[-2px] hover:shadow-[0_16px_40px_rgba(102,126,234,0.4)] active:translate-y-0 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Authenticating...' : 'Secure Login'}
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                            <div className="relative flex justify-center">
                                <span className="bg-[#0d1117] px-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">Enterprise SSO</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="flex w-full h-[52px] items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 text-sm font-bold text-slate-300 hover:bg-white/10 transition-all"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>
                    </form>

                    <p className="mt-12 text-center text-xs font-bold text-slate-600 uppercase tracking-widest anim-slide-up delay-3">
                        New here?{' '}
                        <button onClick={() => navigate('/register')} className="text-indigo-400 hover:text-indigo-300 transition-colors">Create Account</button>
                    </p>
                </div>

                {/* Illustration Side */}
                <div className="hidden lg:relative lg:flex lg:w-[55%] lg:flex-col lg:items-center lg:justify-center lg:bg-[#000000] lg:p-12">
                     <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-1/4 -right-1/4 h-[700px] w-[700px] rounded-full bg-indigo-600/10 blur-[120px]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0,transparent_70%)]" />
                    </div>

                    <div className="relative z-10 w-full max-w-lg rounded-[48px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6 shadow-2xl backdrop-blur-3xl">
                        <div className="relative overflow-hidden rounded-[32px] border border-white/10">
                            <img
                                src="https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=1000&auto=format&fit=crop"
                                alt="Voyager Vacation"
                                className="h-[480px] w-full object-cover scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-10 left-10 right-10">
                                <span className="bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">Featured Destination</span>
                                <h3 className="text-3xl font-black text-white leading-tight">Beyond the horizon.</h3>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-16 text-center max-w-sm">
                        <h2 className="text-2xl font-black leading-tight tracking-tight text-white mb-4">Centralize your Travel Empire</h2>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            A unified workspace for travel professionals to orchestrate campaigns, leads, and global operations with precision.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
