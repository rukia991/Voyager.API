import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../../context/useAuth';
import authService from '../../services/authService';
import recaptchaService from '../../services/recaptchaService';
import { defaultRouteForRole } from '../../services/rbac';
import { getApiErrorMessage } from '../../utils/apiError';

const OTP_LENGTH = 6;

const extractCooldownSeconds = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return null;
  }

  const response = (error as {
    response?: { data?: { message?: string; code?: string } };
  }).response;

  const message = response?.data?.message ?? '';
  const code = response?.data?.code ?? '';
  if (code !== 'ATTEMPT_COOLDOWN' && code !== 'ACCOUNT_LOCKED') {
    return null;
  }

  const match = message.match(/(\d+)\s+second\(s\)/i);
  return match ? Number.parseInt(match[1], 10) : null;
};

const Login: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [pendingEmail, setPendingEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [recaptchaToken, setRecaptchaToken] = useState(
    recaptchaService.shouldBypassRecaptcha ? 'dev-bypass' : '',
  );
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const { login } = useAuth();
  const navigate = useNavigate();

  const isCredentialStepValid =
    usernameOrEmail.trim().length > 0 &&
    password.length > 0 &&
    (recaptchaService.shouldBypassRecaptcha || recaptchaToken.length > 0);
  const otp = otpDigits.join('');
  const isOtpValid = otp.length === OTP_LENGTH && otpDigits.every((digit) => digit.length === 1);

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

  const clearOtp = () => {
    setOtpDigits(Array(OTP_LENGTH).fill(''));
  };

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCooldownSeconds((current) => {
        if (current <= 1) {
          setError((existing) =>
            existing?.includes('Try again in') ? null : existing,
          );
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [cooldownSeconds]);

  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (cooldownSeconds > 0) {
      setError(`Please wait ${cooldownSeconds} second(s) before trying again.`);
      return;
    }

    if (!isCredentialStepValid) {
      if (!recaptchaService.shouldBypassRecaptcha && !recaptchaToken) {
        setError('Please complete the reCAPTCHA.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.login({
        email: usernameOrEmail.trim(),
        password,
        recaptchaToken,
      });

      setPendingEmail(response.email);
      setMaskedEmail(response.maskedEmail);
      setShowOtpStep(true);
      setCooldownSeconds(0);
      clearOtp();
      setMessage(response.message);
    } catch (error: unknown) {
      const nextCooldown = extractCooldownSeconds(error);
      if (nextCooldown) {
        setCooldownSeconds(nextCooldown);
      }
      setError(getApiErrorMessage(error, 'Invalid email/username or password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isOtpValid || !pendingEmail) {
      setError(`Please enter the full ${OTP_LENGTH}-digit verification code.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.verifyLoginOtp({
        email: pendingEmail,
        otp,
      });

      login(response);
      navigate(defaultRouteForRole(response.role));
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Invalid verification code.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail) {
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      const response = await authService.resendLoginOtp({ email: pendingEmail });
      setMessage(response.message);
      clearOtp();
      otpRefs.current[0]?.focus();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Failed to resend verification code.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = sanitized;
      return next;
    });

    if (sanitized && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
    if (pastedDigits.length === 0) {
      return;
    }

    setOtpDigits(Array.from({ length: OTP_LENGTH }, (_, index) => pastedDigits[index] ?? ''));
    otpRefs.current[Math.min(pastedDigits.length, OTP_LENGTH) - 1]?.focus();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ position: 'absolute', top: '-150px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(124,92,191,0.2)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-150px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(240,147,251,0.15)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: showOtpStep ? '980px' : '900px',
          height: '600px',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#13172a',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: showOtpStep ? '56%' : '45%',
            padding: '44px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4Z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4b5563' }}>Voyager</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#f0f2f7', letterSpacing: '-0.2px', lineHeight: 1 }}>Control Center</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#f0f2f7', letterSpacing: '-0.5px', marginBottom: '6px', lineHeight: 1.1 }}>
              {showOtpStep ? 'Verify your login' : 'Welcome back'}
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
              {showOtpStep
                ? `Enter the ${OTP_LENGTH}-digit code sent to ${maskedEmail || pendingEmail}.`
                : 'Sign in to manage your campaigns and leads.'}
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '12px', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac', fontSize: '12px', fontWeight: 500 }}>
              {message}
            </div>
          )}

          {!showOtpStep ? (
            <form onSubmit={handleSubmitCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', letterSpacing: '0.05em' }}>
                  Email or Username
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter email or username"
                  style={inputStyle}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em' }}>Password</label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    style={{ fontSize: '11px', color: '#7c5cbf', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{ ...inputStyle, paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 0 }}
                  >
                    {showPassword
                      ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                  </button>
                </div>
              </div>

              {!recaptchaService.shouldBypassRecaptcha && (
                <div style={{ marginTop: '4px' }}>
                  <ReCAPTCHA
                    sitekey={recaptchaService.siteKey}
                    onChange={(value: string | null) => setRecaptchaToken(value ?? '')}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !isCredentialStepValid || cooldownSeconds > 0}
                style={{
                  width: '100%',
                  height: '44px',
                  marginTop: '4px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 55%, #f093fb 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: isCredentialStepValid && !isSubmitting && cooldownSeconds === 0 ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  opacity: !isCredentialStepValid || isSubmitting || cooldownSeconds > 0 ? 0.5 : 1,
                }}
              >
                {isSubmitting ? 'Checking...' : cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '10px' }}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpRefs.current[index] = element;
                    }}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    inputMode="numeric"
                    maxLength={1}
                    style={{
                      height: '52px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#f0f2f7',
                      textAlign: 'center',
                      fontSize: '22px',
                      fontWeight: 800,
                      outline: 'none',
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isOtpValid}
                style={{
                  width: '100%',
                  height: '44px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 55%, #f093fb 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: isOtpValid && !isSubmitting ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  opacity: !isOtpValid || isSubmitting ? 0.5 : 1,
                }}
              >
                {isSubmitting ? 'Signing in...' : 'Verify & Sign In'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpStep(false);
                    setMessage(null);
                    setError(null);
                    clearOtp();
                  }}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}
                >
                  Back to credentials
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: isResending ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', opacity: isResending ? 0.6 : 1 }}
                >
                  {isResending ? 'Resending...' : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: '12px', fontSize: '10px', color: '#6b7280', lineHeight: 1.6 }}>
            {showOtpStep ? 'Login is completed only after OTP verification succeeds.' : 'Protected by Google reCAPTCHA during sign in.'}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#4b5563' }}>New to Voyager? </span>
            <button
              onClick={() => navigate('/register')}
              style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
            >
              Create account
            </button>
          </div>
        </div>

        <div
          style={{
            flex: showOtpStep ? 0.8 : 1,
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #0d0f1e 0%, #1a1040 50%, #0d0f1e 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.06,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,191,0.3) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '10px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              {showOtpStep ? 'One more step to enter.' : 'Operate every journey'}<br />
              {showOtpStep ? 'Secure every session.' : 'from one place.'}
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
              {showOtpStep
                ? 'A verification code was sent to your registered email so the session is only opened by the real account owner.'
                : 'Track leads, automate outreach, and move faster with a workspace built for travel operations.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


