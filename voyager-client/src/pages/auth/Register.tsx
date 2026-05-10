import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/authService';
import type { RegisterDTO } from '../../services/authService';

const Register: React.FC = () => {
    const [searchParams] = useSearchParams();
    const plan = searchParams.get('plan') || 'Basic';
    const tenantIdParam = searchParams.get('tid');

    const [formData, setFormData] = useState<RegisterDTO>({
        firstName: '', 
        lastName: '', 
        userName: '', 
        email: '', 
        password: '', 
        role: tenantIdParam ? 'Customer' : 'Admin', 
        subscriptionPlan: plan,
        tenantIdEntry: tenantIdParam ? parseInt(tenantIdParam) : undefined
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
        passwordChecks.minLength && passwordChecks.uppercase &&
        passwordChecks.digit && passwordChecks.match;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!isFormValid) { setError('Please complete all fields and meet password requirements.'); return; }
        setIsSubmitting(true);
        try {
            await authService.register({ ...formData, firstName: formData.firstName.trim(), lastName: formData.lastName.trim(), userName: formData.userName.trim(), email: formData.email.trim() });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', height: '42px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', color: '#f0f2f7',
        padding: '0 14px', fontSize: '13px',
        outline: 'none', fontFamily: 'inherit',
        boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '11px', fontWeight: 600,
        color: '#6b7280', marginBottom: '5px', letterSpacing: '0.05em',
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
        }}>
            {/* Ambient glows */}
            <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(124,92,191,0.2)', filter: 'blur(100px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(240,147,251,0.15)', filter: 'blur(100px)', pointerEvents: 'none' }} />

            {/* CARD */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '940px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: '#13172a',
                boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                display: 'flex',
                overflow: 'hidden',
                minHeight: '580px',
            }}>

                {/* ── LEFT: Form ── */}
                <div style={{
                    width: '52%',
                    padding: '40px 44px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{
                            width: '80px', height: 'auto', 
                            background: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, overflow: 'hidden',
                        }}>
                            <img src="/logo.png" alt="Voyager Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                    </div>

                    {/* Heading */}
                    <div style={{ marginBottom: '20px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#f0f2f7', letterSpacing: '-0.5px', marginBottom: '4px', lineHeight: 1.1 }}>
                            {tenantIdParam ? 'Join the agency' : 'Create your account'}
                        </h1>
                        <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
                            {tenantIdParam ? 'Create your traveler account to start planning your next trip.' : 'Set up your workspace and launch your first campaign faster.'}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '12px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} autoComplete="off">
                        {/* First + Last */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <div>
                                <label style={labelStyle}>First Name</label>
                                <input name="firstName" required autoComplete="off" value={formData.firstName} onChange={handleChange} placeholder="First name" style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = '#7c5cbf'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,191,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
                            </div>
                            <div>
                                <label style={labelStyle}>Last Name</label>
                                <input name="lastName" required autoComplete="off" value={formData.lastName} onChange={handleChange} placeholder="Last name" style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = '#7c5cbf'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,191,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
                            </div>
                        </div>

                        {/* Username + Email */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <div>
                                <label style={labelStyle}>Username</label>
                                <input name="userName" required autoComplete="off" value={formData.userName} onChange={handleChange} placeholder="Username" style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = '#7c5cbf'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,191,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
                            </div>
                            <div>
                                <label style={labelStyle}>Work Email</label>
                                <input name="email" type="email" required autoComplete="off" value={formData.email} onChange={handleChange} placeholder="Email address" style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = '#7c5cbf'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,191,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
                            </div>
                        </div>

                        {/* Password + Confirm */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                            <div>
                                <label style={labelStyle}>Password</label>
                                <input name="password" type={showPassword ? 'text' : 'password'} required autoComplete="off" value={formData.password} onChange={handleChange} placeholder="Create password" style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = '#7c5cbf'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,191,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
                            </div>
                            <div>
                                <label style={labelStyle}>Confirm</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPassword ? 'text' : 'password'} required autoComplete="off" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password"
                                        style={{ ...inputStyle, paddingRight: '40px' }}
                                        onFocus={e => { e.target.style.borderColor = '#7c5cbf'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,191,0.15)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 0 }}>
                                        {showPassword
                                            ? <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                            : <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Password requirements — inline compact */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginBottom: '16px' }}>
                            {[
                                { ok: passwordChecks.minLength, label: '8+ characters' },
                                { ok: passwordChecks.uppercase, label: 'Uppercase letter' },
                                { ok: passwordChecks.digit, label: 'One number' },
                                { ok: passwordChecks.match, label: 'Passwords match' },
                            ].map((req, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: req.ok ? '#34d399' : 'rgba(255,255,255,0.15)', transition: 'background 0.2s' }} />
                                    <span style={{ fontSize: '11px', color: req.ok ? '#34d399' : '#4b5563', transition: 'color 0.2s' }}>{req.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={isSubmitting || !isFormValid}
                            style={{
                                width: '100%', height: '44px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 55%, #f093fb 100%)',
                                border: 'none', borderRadius: '10px',
                                color: 'white', fontWeight: 700, fontSize: '14px',
                                cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
                                fontFamily: 'inherit',
                                opacity: !isFormValid || isSubmitting ? 0.5 : 1,
                                boxShadow: isFormValid ? '0 4px 20px rgba(102,126,234,0.35)' : 'none',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { if (isFormValid) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {isSubmitting ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#4b5563' }}>Already have access? </span>
                        <button onClick={() => navigate('/login')}
                            style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                            Sign in
                        </button>
                    </div>
                </div>

                {/* ── RIGHT: Visual Panel ── */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(145deg, #0d0f1e 0%, #1a1040 50%, #0d0f1e 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px',
                }}>
                    {/* Grid pattern */}
                    <div style={{
                        position: 'absolute', inset: 0, opacity: 0.06,
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }} />

                    {/* Glow */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,191,0.3) 0%, transparent 70%)', filter: 'blur(40px)' }} />

                    {/* Floating shapes */}
                    <div style={{ position: 'absolute', top: '50px', right: '50px', width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #667eea, #764ba2)', opacity: 0.75, transform: 'rotate(20deg)', animation: 'floatA 4s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', bottom: '90px', left: '45px', width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #34d399, #8fd3f4)', opacity: 0.8, animation: 'floatA 5s ease-in-out infinite reverse' }} />
                    <div style={{ position: 'absolute', top: '35%', left: '36px', width: '12px', height: '12px', background: '#fbbf24', opacity: 0.65, transform: 'rotate(45deg)', animation: 'floatA 6s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', bottom: '38%', right: '36px', width: '16px', height: '16px', borderRadius: '50%', border: '3px solid #f093fb', opacity: 0.7, animation: 'floatA 3.5s ease-in-out infinite reverse' }} />

                    {/* Icon */}
                    <div style={{ position: 'relative', zIndex: 1, marginBottom: '24px' }}>
                        <div style={{
                            width: '100px', height: '100px',
                            background: 'linear-gradient(145deg, rgba(102,126,234,0.22), rgba(240,147,251,0.12))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '26px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 40px rgba(102,126,234,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                        }}>
                            <span style={{ fontSize: '40px' }}>🗺️</span>
                        </div>
                    </div>

                    {/* Text */}
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '10px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                            Set up once.<br />Scale with confidence.
                        </h3>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: '260px', margin: '0 auto' }}>
                            Keep your team aligned with one platform for lead handling, campaign execution, and lifecycle tracking.
                        </p>
                    </div>

                    {/* Dots */}
                    <div style={{ position: 'absolute', bottom: '28px', display: 'flex', gap: '6px' }}>
                        {[1,2,3].map(i => (
                            <div key={i} style={{ width: i === 2 ? '20px' : '6px', height: '6px', borderRadius: '999px', background: i === 2 ? 'linear-gradient(90deg, #667eea, #f093fb)' : 'rgba(255,255,255,0.2)' }} />
                        ))}
                    </div>

                    <style>{`
                        @keyframes floatA {
                            0%, 100% { transform: translateY(0) rotate(20deg); }
                            50% { transform: translateY(-10px) rotate(20deg); }
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default Register;