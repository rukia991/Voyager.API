import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { getApiErrorMessage } from '../../utils/apiError';

const OTP_LENGTH = 6;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 24;

type ResetStep = 'email' | 'otp' | 'password' | 'success';

const steps: Array<{ key: ResetStep; title: string; description: string }> = [
  {
    key: 'email',
    title: 'Reset your password',
    description: `We will send you a ${OTP_LENGTH}-digit code.`,
  },
  {
    key: 'otp',
    title: 'Enter confirmation code',
    description: 'We sent a code to your email address.',
  },
  {
    key: 'password',
    title: 'Create a new password',
    description: `Use ${PASSWORD_MIN_LENGTH}+ characters with uppercase, number, and special character.`,
  },
  {
    key: 'success',
    title: 'Password reset',
    description: 'Success. Click to log in immediately.',
  },
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const otp = otpDigits.join('');
  const currentStepIndex = steps.findIndex((item) => item.key === step);

  const passwordChecks = useMemo(() => ({
    minLength: newPassword.length >= PASSWORD_MIN_LENGTH,
    maxLength: newPassword.length <= PASSWORD_MAX_LENGTH,
    uppercase: /[A-Z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    special: /[^a-zA-Z0-9]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  }), [confirmPassword, newPassword]);

  const canContinueOtp = otp.length === OTP_LENGTH && otpDigits.every((digit) => digit.length === 1);
  const canSubmitPassword =
    email.trim().length > 0 &&
    canContinueOtp &&
    passwordChecks.minLength &&
    passwordChecks.maxLength &&
    passwordChecks.uppercase &&
    passwordChecks.digit &&
    passwordChecks.special &&
    passwordChecks.match;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await authService.forgotPassword({ email: email.trim() });
      setMessage(response.message);
      setStep('otp');
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Failed to send OTP.'));
    } finally {
      setIsSubmitting(false);
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

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canContinueOtp) {
      setError(`Please enter the full ${OTP_LENGTH}-digit code.`);
      return;
    }

    setStep('password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!canSubmitPassword) {
      setError('Please complete the form and meet password requirements.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.resetPassword({
        email: email.trim(),
        otp,
        newPassword,
        confirmPassword,
      });

      setMessage(response.message);
      setStep('success');
      window.setTimeout(() => navigate('/login'), 1400);
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Password reset failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendOtp = async () => {
    if (!email.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.forgotPassword({ email: email.trim() });
      setMessage(response.message);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Failed to resend OTP.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '940px',
    minHeight: '580px',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#13172a',
    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
    display: 'flex',
  };

  const baseInputStyle: React.CSSProperties = {
    width: '100%',
    height: '44px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.06)',
    padding: '0 14px',
    fontSize: '14px',
    color: '#f0f2f7',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const primaryButtonStyle: React.CSSProperties = {
    width: '100%',
    height: '44px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 55%, #f093fb 100%)',
    color: 'white',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const sideNoteColor = '#6b7280';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '20px', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(124,92,191,0.2)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(240,147,251,0.15)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={cardStyle}>
        <aside style={{ width: '38%', minWidth: '300px', background: 'linear-gradient(145deg, #0d0f1e 0%, #1a1040 50%, #0d0f1e 100%)', color: 'white', padding: '34px 30px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,191,0.3) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(102,126,234,0.4)', color: 'white', fontWeight: 800 }}>V</div>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4b5563' }}>Voyager</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#f0f2f7', letterSpacing: '-0.2px', lineHeight: 1 }}>Account Recovery</div>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: '18px', flex: 1 }}>
            {steps.map((item, index) => {
              const isActive = currentStepIndex >= index;
              return (
                <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: '10px', opacity: isActive ? 1 : 0.56 }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.4)', background: isActive ? 'rgba(167,139,250,0.24)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                    {isActive ? '✓' : ''}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', lineHeight: 1.55, color: 'rgba(255,255,255,0.55)' }}>{item.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{ position: 'relative', zIndex: 1, marginTop: '18px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}
          >
            ← Back to log in
          </button>
        </aside>

        <section style={{ flex: 1, padding: '40px 44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(124,92,191,0.12)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '18px' }}>
              {step === 'success' ? '✓' : step === 'password' ? '🔒' : step === 'otp' ? '✉' : '↺'}
            </div>

            <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#f0f2f7', marginBottom: '8px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              {step === 'email' && 'Reset your password'}
              {step === 'otp' && 'Enter confirmation code'}
              {step === 'password' && 'Create a new password'}
              {step === 'success' && 'Password reset!'}
            </h1>

            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.65, marginBottom: '22px' }}>
              {step === 'email' && `Forgot your password? Please enter your email and we'll send you a ${OTP_LENGTH}-digit code.`}
              {step === 'otp' && <>We sent a code to <strong style={{ color: '#f0f2f7' }}>{email}</strong>.</>}
              {step === 'password' && 'Please choose a secure password with an uppercase letter, a number, and a special character.'}
              {step === 'success' && 'Your password has been successfully reset. You will be redirected to log in automatically.'}
            </p>

            {message && (
              <div style={{ marginBottom: '14px', borderRadius: '10px', padding: '12px 14px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#86efac', fontSize: '13px' }}>
                {message}
              </div>
            )}
            {error && (
              <div style={{ marginBottom: '14px', borderRadius: '10px', padding: '12px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '13px' }}>
                {error}
              </div>
            )}

            {step === 'email' && (
              <form onSubmit={handleSendOtp}>
                <label style={{ display: 'block', fontSize: '11px', color: sideNoteColor, marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em' }}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  style={{ ...baseInputStyle, marginBottom: '14px' }}
                />
                <button type="submit" disabled={isSubmitting} style={primaryButtonStyle}>
                  {isSubmitting ? 'Sending code...' : `Get ${OTP_LENGTH}-digit code`}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp}>
                <label style={{ display: 'block', fontSize: '11px', color: sideNoteColor, marginBottom: '10px', fontWeight: 600, letterSpacing: '0.05em' }}>Confirmation code</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      style={{
                        width: '56px',
                        height: '60px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.06)',
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: 800,
                        color: '#f0f2f7',
                        outline: 'none',
                      }}
                    />
                  ))}
                </div>
                <button type="submit" disabled={!canContinueOtp} style={{ ...primaryButtonStyle, cursor: canContinueOtp ? 'pointer' : 'not-allowed', opacity: canContinueOtp ? 1 : 0.55 }}>
                  Continue
                </button>
                <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: sideNoteColor }}>
                  Didn&apos;t receive the email?{' '}
                  <button type="button" onClick={() => void resendOtp()} disabled={isSubmitting} style={{ background: 'none', border: 'none', color: '#a78bfa', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    Click to resend
                  </button>
                </div>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handleResetPassword}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: sideNoteColor, marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em' }}>Set new password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} maxLength={PASSWORD_MAX_LENGTH} required style={baseInputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: sideNoteColor, marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em' }}>Confirm new password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} maxLength={PASSWORD_MAX_LENGTH} required style={baseInputStyle} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', margin: '16px 0 18px' }}>
                  {[
                    { ok: passwordChecks.minLength, label: `${PASSWORD_MIN_LENGTH}+ characters` },
                    { ok: passwordChecks.uppercase, label: 'Uppercase letter' },
                    { ok: passwordChecks.digit, label: 'One number' },
                    { ok: passwordChecks.special, label: 'Special character' },
                    { ok: passwordChecks.match, label: 'Passwords match' },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '999px', background: item.ok ? '#34d399' : 'rgba(255,255,255,0.16)' }} />
                      <span style={{ fontSize: '12px', color: item.ok ? '#34d399' : sideNoteColor }}>{item.label}</span>
                    </div>
                  ))}
                </div>

                <button type="submit" disabled={isSubmitting || !canSubmitPassword} style={{ ...primaryButtonStyle, cursor: canSubmitPassword ? 'pointer' : 'not-allowed', opacity: canSubmitPassword ? 1 : 0.55 }}>
                  {isSubmitting ? 'Resetting password...' : 'Reset password'}
                </button>
              </form>
            )}

            {step === 'success' && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={primaryButtonStyle}
              >
                Continue to log in
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

