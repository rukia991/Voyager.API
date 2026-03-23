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
            const destination = response.role === 'Customer' 
                ? '/portal/home' 
                : (response.role === 'Marketing Staff' ? '/campaigns' : '/dashboard');
            navigate(destination);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email/username or password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        height: '44px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: '#f0f2f7',
        padding: '0 14px',
        fontSize: '13px',
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s, box-shadow 0.2s',
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
            <div style={{ position: 'absolute', top: '-150px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(124,92,191,0.2)', filter: 'blur(100px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-150px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(240,147,251,0.15)', filter: 'blur(100px)', pointerEvents: 'none' }} />

            {/* CARD */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '900px',
                height: '520px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: '#13172a',
                boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                display: 'flex',
                overflow: 'hidden',
            }}>

                {/* ── LEFT: Form ── */}
                <div style={{
                    width: '45%',
                    padding: '44px 44px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4Z" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4b5563' }}>Voyager</div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#f0f2f7', letterSpacing: '-0.2px', lineHeight: 1 }}>Control Center</div>
                        </div>
                    </div>

                    {/* Heading */}
                    <div style={{ marginBottom: '24px' }}>
                        <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#f0f2f7', letterSpacing: '-0.5px', marginBottom: '6px', lineHeight: 1.1 }}>Welcome back</h1>
                        <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>Sign in to manage your campaigns and leads.</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '12px', fontWeight: 500 }}>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Email */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', letterSpacing: '0.05em' }}>
                                Email or Username
                            </label>
                            <input
                                type="text" required autoComplete="username"
                                value={usernameOrEmail}
                                onChange={e => setUsernameOrEmail(e.target.value)}
                                placeholder="Enter email or username"
                                style={inputStyle}
                                onFocus={e => { e.target.style.borderColor = '#7c5cbf'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,191,0.15)'; }}
                                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em' }}>Password</label>
                                <button type="button"
                                    onClick={() => setError('Contact your admin to reset password.')}
                                    style={{ fontSize: '11px', color: '#7c5cbf', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                                    Forgot password?
                                </button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    style={{ ...inputStyle, paddingRight: '44px' }}
                                    onFocus={e => { e.target.style.borderColor = '#7c5cbf'; e.target.style.boxShadow = '0 0 0 3px rgba(124,92,191,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 0 }}>
                                    {showPassword
                                        ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                        : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={isSubmitting || !isFormValid}
                            style={{
                                width: '100%', height: '44px', marginTop: '4px',
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
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#4b5563' }}>New to Voyager? </span>
                        <button onClick={() => navigate('/register')}
                            style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                            Create account
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

                    {/* Purple glow center */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,191,0.3) 0%, transparent 70%)', filter: 'blur(40px)' }} />

                    {/* Decorative shapes */}
                    <div style={{ position: 'absolute', top: '40px', right: '60px', width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #667eea, #764ba2)', opacity: 0.7, transform: 'rotate(20deg)', animation: 'floatShape 4s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', bottom: '80px', left: '50px', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #34d399, #8fd3f4)', opacity: 0.8, animation: 'floatShape 5s ease-in-out infinite reverse' }} />
                    <div style={{ position: 'absolute', top: '30%', left: '40px', width: '14px', height: '14px', background: '#fbbf24', opacity: 0.6, transform: 'rotate(45deg)', animation: 'floatShape 6s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', bottom: '35%', right: '40px', width: '18px', height: '18px', borderRadius: '50%', border: '3px solid #f093fb', opacity: 0.7, animation: 'floatShape 3.5s ease-in-out infinite reverse' }} />

                    {/* Hexagon with plane icon */}
                    <div style={{ position: 'relative', zIndex: 1, marginBottom: '28px' }}>
                        <div style={{
                            width: '110px', height: '110px',
                            background: 'linear-gradient(145deg, rgba(102,126,234,0.25), rgba(240,147,251,0.15))',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '28px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 40px rgba(102,126,234,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                        }}>
                            <span style={{ fontSize: '44px' }}>✈️</span>
                        </div>
                    </div>

                    {/* Text */}
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '10px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                            Operate every journey<br />from one place.
                        </h3>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
                            Track leads, automate outreach, and move faster with a workspace built for travel operations.
                        </p>
                    </div>

                    {/* Dots */}
                    <div style={{ position: 'absolute', bottom: '28px', display: 'flex', gap: '6px' }}>
                        {[1,2,3].map(i => (
                            <div key={i} style={{ width: i === 1 ? '20px' : '6px', height: '6px', borderRadius: '999px', background: i === 1 ? 'linear-gradient(90deg, #667eea, #f093fb)' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
                        ))}
                    </div>

                    <style>{`
                        @keyframes floatShape {
                            0%, 100% { transform: translateY(0) rotate(20deg); }
                            50% { transform: translateY(-12px) rotate(20deg); }
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default Login;