import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import type { RegisterDTO } from '../../services/authService';

const Register: React.FC = () => {
    const [formData, setFormData] = useState<RegisterDTO>({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        password: '',
        role: 'Customer'
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        try {
            await authService.register(formData);
            navigate('/login');
        } catch (err: any) {
            console.error('Registration failed:', err);
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#080c14] p-6 lg:p-10 font-[Inter]">
            <div className="flex w-full max-w-5xl overflow-hidden rounded-[40px] bg-[#0d1117] border border-white/5 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
                
                {/* Form Side */}
                <div className="flex w-full flex-col justify-center px-8 py-16 lg:w-[45%] lg:px-14 xl:px-20">
                    <div className="mb-10 flex items-center gap-3 anim-slide-up">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] text-2xl font-bold text-white shadow-[0_8px_24px_rgba(102,126,234,0.3)]">
                            ✈️
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-white">Voyager</span>
                    </div>

                    <div className="anim-slide-up delay-1">
                        <h1 className="pb-2 text-3xl font-black text-white">Join the Fleet</h1>
                        <p className="mb-10 text-sm font-medium text-slate-400">Voyager is more than a platform. It's an engine for growth.</p>
                    </div>

                    {error && (
                        <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-400 anim-shake">
                            {error}
                        </div>
                    )}

                    <form className="space-y-4 anim-slide-up delay-2" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                             <div className="space-y-1.5">
                                <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">First Name</label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Jane"
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-[#667eea] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-[#667eea] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Handle</label>
                            <input
                                id="userName"
                                name="userName"
                                required
                                value={formData.userName}
                                onChange={handleChange}
                                placeholder="janedoe"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-[#667eea] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Workspace</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="jane@company.com"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-[#667eea] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5 relative">
                                <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Set Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-[#667eea] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-1.5 relative">
                                <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Verify</label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-[#667eea] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-6 w-full h-[56px] rounded-2xl bg-[#667eea] text-white font-bold text-sm shadow-[0_12px_32px_rgba(102,126,234,0.3)] hover:translate-y-[-2px] hover:shadow-[0_16px_40px_rgba(102,126,234,0.4)] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Onboarding...' : 'Start your Voyage'}
                        </button>
                    </form>

                    <p className="mt-12 text-center text-xs font-bold text-slate-600 uppercase tracking-widest anim-slide-up delay-3">
                        Already onboard?{' '}
                        <button onClick={() => navigate('/login')} className="text-indigo-400 hover:text-indigo-300 transition-colors">Sign In</button>
                    </p>
                </div>

                {/* Illustration Side */}
                <div className="hidden lg:relative lg:flex lg:w-[55%] lg:flex-col lg:items-center lg:justify-center lg:bg-[#000000] lg:p-12">
                     <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-1/4 -right-1/4 h-[700px] w-[700px] rounded-full bg-emerald-600/5 blur-[120px]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0,transparent_70%)]" />
                    </div>

                    <div className="relative z-10 w-full max-w-lg rounded-[48px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6 shadow-2xl backdrop-blur-3xl">
                        <div className="relative overflow-hidden rounded-[32px] border border-white/10">
                            <img
                                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1100&auto=format&fit=crop"
                                alt="Travel planning"
                                className="h-[480px] w-full object-cover scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-10 left-10 right-10">
                                <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">Cloud Sync</span>
                                <h3 className="text-3xl font-black text-white leading-tight">Master your workflow.</h3>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-16 text-center max-w-sm">
                        <h2 className="text-2xl font-black leading-tight tracking-tight text-white mb-4">Scale with Confidence</h2>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            A robust ecosystem designed for high-performance travel teams. Secure, redundant, and built on best practices.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
