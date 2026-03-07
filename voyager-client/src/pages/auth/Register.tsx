import React, { useMemo, useState } from 'react';
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

    const passwordChecks = useMemo(() => ({
        minLength: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        digit: /\d/.test(formData.password),
        match: formData.password.length > 0 && formData.password === confirmPassword,
    }), [formData.password, confirmPassword]);

    const isFormValid =
        formData.firstName.trim().length > 0 &&
        formData.lastName.trim().length > 0 &&
        formData.userName.trim().length > 0 &&
        formData.email.trim().length > 0 &&
        passwordChecks.minLength &&
        passwordChecks.uppercase &&
        passwordChecks.digit &&
        passwordChecks.match;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isFormValid) {
            setError('Please complete all fields and meet password requirements.');
            return;
        }

        setIsSubmitting(true);
        try {
            await authService.register({
                ...formData,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                userName: formData.userName.trim(),
                email: formData.email.trim(),
            });
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

    const reqClass = (ok: boolean) => ok ? 'text-emerald-300' : 'text-slate-500';
    const reqIcon = (ok: boolean) => ok ? 'bg-emerald-400' : 'bg-slate-600';

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b13] px-4 py-6 sm:px-6 lg:p-10 font-[Inter]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 right-[-10%] h-[440px] w-[440px] rounded-full bg-violet-500/15 blur-[120px]" />
                <div className="absolute -bottom-24 left-[-10%] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[120px]" />
            </div>

            <div className="relative flex w-full max-w-[1180px] overflow-hidden rounded-[32px] border border-white/10 bg-[#0c1018]/95 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm">
                <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:w-[46%] lg:px-12 xl:px-16">
                    <div className="mx-auto w-full max-w-[440px]">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white shadow-[0_10px_24px_rgba(102,126,234,0.35)]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M22 2 11 13" />
                                <path d="m22 2-7 20-4-9-9-4Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Voyager</p>
                            <p className="text-lg font-black tracking-tight text-white">Get Started</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-black leading-tight text-white">Create your account</h1>
                        <p className="mt-2 text-sm text-slate-400">Set up your workspace and launch your first campaign faster.</p>
                    </div>

                    {error && (
                        <div aria-live="polite" className="mb-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
                            {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="ml-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">First Name</label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    required
                                    autoComplete="given-name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Jane"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="ml-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Last Name</label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    required
                                    autoComplete="family-name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="userName" className="ml-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Username</label>
                            <input
                                id="userName"
                                name="userName"
                                required
                                autoComplete="username"
                                value={formData.userName}
                                onChange={handleChange}
                                placeholder="janedoe"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="ml-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Work Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="jane@company.com"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="password" className="ml-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create password"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="ml-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Confirm</label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm password"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-11 text-sm text-white placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
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
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[11px] font-medium">
                            <div className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${reqIcon(passwordChecks.minLength)}`} /><p className={reqClass(passwordChecks.minLength)}>At least 8 characters</p></div>
                            <div className="mt-1.5 flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${reqIcon(passwordChecks.uppercase)}`} /><p className={reqClass(passwordChecks.uppercase)}>At least one uppercase letter</p></div>
                            <div className="mt-1.5 flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${reqIcon(passwordChecks.digit)}`} /><p className={reqClass(passwordChecks.digit)}>At least one number</p></div>
                            <div className="mt-1.5 flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${reqIcon(passwordChecks.match)}`} /><p className={reqClass(passwordChecks.match)}>Passwords match</p></div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !isFormValid}
                            className="h-[50px] w-full rounded-lg bg-white text-sm font-extrabold tracking-wide text-slate-900 shadow-[0_10px_24px_rgba(255,255,255,0.16)] transition-all hover:-translate-y-[1px] hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-slate-400 disabled:shadow-none"
                        >
                            {isSubmitting ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold tracking-wide text-slate-500">
                        Already have access?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="inline-flex h-8 items-center rounded-md border border-white/15 px-3 text-xs font-semibold text-slate-200 transition-all hover:bg-white/10"
                        >
                            Sign in
                        </button>
                    </p>
                    </div>
                </div>

                <div className="hidden lg:relative lg:flex lg:w-[54%] lg:flex-col lg:items-center lg:justify-center lg:bg-[#06080f] lg:p-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_58%)]" />
                    <div className="relative z-10 w-full max-w-xl rounded-[34px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-5 shadow-2xl backdrop-blur-2xl">
                        <div className="relative overflow-hidden rounded-[24px] border border-white/10">
                            <img
                                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1100&auto=format&fit=crop"
                                alt="Travel planning"
                                className="h-[450px] w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                            <div className="absolute bottom-8 left-8 right-8">
                                <span className="inline-flex rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Launch Ready</span>
                                <h3 className="mt-3 text-3xl font-black leading-tight text-white">Set up once. Scale with confidence.</h3>
                            </div>
                        </div>
                    </div>
                    <p className="relative z-10 mt-8 max-w-md text-center text-sm leading-relaxed text-slate-400">
                        Keep your team aligned with one platform for lead handling, campaign execution, and customer lifecycle tracking.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
