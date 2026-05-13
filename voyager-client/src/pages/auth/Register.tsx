import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import authService from '../../services/authService';
import type { RegisterDTO } from '../../services/authService';
import recaptchaService from '../../services/recaptchaService';
import { getApiErrorMessage } from '../../utils/apiError';

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 24;

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterDTO>({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    recaptchaToken: recaptchaService.shouldBypassRecaptcha ? 'dev-bypass' : '',
    role: 'Client'
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const passwordChecks = useMemo(() => ({
    minLength: formData.password.length >= PASSWORD_MIN_LENGTH,
    maxLength: formData.password.length <= PASSWORD_MAX_LENGTH,
    uppercase: /[A-Z]/.test(formData.password),
    digit: /\d/.test(formData.password),
    special: /[^a-zA-Z0-9]/.test(formData.password),
    match: formData.password.length > 0 && formData.password === confirmPassword,
  }), [formData.password, confirmPassword]);

  const isFormValid =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    formData.userName.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    passwordChecks.minLength && passwordChecks.maxLength &&
    passwordChecks.uppercase && passwordChecks.digit &&
    passwordChecks.special && passwordChecks.match &&
    (recaptchaService.shouldBypassRecaptcha || formData.recaptchaToken.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isFormValid) {
      setError(
        !recaptchaService.shouldBypassRecaptcha && !formData.recaptchaToken
          ? 'Please complete the reCAPTCHA.'
          : 'Please complete all fields and meet password requirements.',
      );
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
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Registration failed.'));
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
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: '#6b7280', marginBottom: '5px', letterSpacing: '0.05em',
  };

  return (
    <div style={{
      minHeight: '50vh',
      background: 'var(--bg-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(124,92,191,0.2)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(240,147,251,0.15)', filter: 'blur(100px)', pointerEvents: 'none' }} />

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
        <div style={{
          width: '52%',
          padding: '40px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#f0f2f7', letterSpacing: '-0.5px', marginBottom: '4px', lineHeight: 1.1 }}>Create your account</h1>
            <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>Set up your workspace and launch your first campaign faster.</p>
          </div>

          {error && (
            <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input name="firstName" required autoComplete="given-name" value={formData.firstName} onChange={handleChange} placeholder="Jane" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input name="lastName" required autoComplete="family-name" value={formData.lastName} onChange={handleChange} placeholder="Doe" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={labelStyle}>Username</label>
                <input name="userName" required autoComplete="username" value={formData.userName} onChange={handleChange} placeholder="janedoe" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Work Email</label>
                <input name="email" type="email" required autoComplete="email" value={formData.email} onChange={handleChange} placeholder="jane@company.com" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Password</label>
                <input name="password" type={showPassword ? 'text' : 'password'} required autoComplete="new-password" value={formData.password} onChange={handleChange} placeholder="Create password" style={inputStyle} maxLength={PASSWORD_MAX_LENGTH} />
              </div>
              <div>
                <label style={labelStyle}>Confirm</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} required autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" style={{ ...inputStyle, paddingRight: '40px' }} maxLength={PASSWORD_MAX_LENGTH} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 0 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginBottom: '16px' }}>
              {[
                { ok: passwordChecks.minLength, label: `${PASSWORD_MIN_LENGTH}+ characters` },
                { ok: passwordChecks.maxLength, label: `${PASSWORD_MAX_LENGTH} characters max` },
                { ok: passwordChecks.uppercase, label: 'Uppercase letter' },
                { ok: passwordChecks.digit, label: 'One number' },
                { ok: passwordChecks.special, label: 'Special character' },
                { ok: passwordChecks.match, label: 'Passwords match' },
              ].map((req) => (
                <div key={req.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: req.ok ? '#34d399' : 'rgba(255,255,255,0.15)' }} />
                  <span style={{ fontSize: '11px', color: req.ok ? '#34d399' : '#4b5563' }}>{req.label}</span>
                </div>
              ))}
            </div>

            {!recaptchaService.shouldBypassRecaptcha && (
              <div style={{ marginBottom: '16px' }}>
                <ReCAPTCHA
                  sitekey={recaptchaService.siteKey}
                  onChange={(value: string | null) =>
                    setFormData(prev => ({ ...prev, recaptchaToken: value ?? '' }))
                  }
                />
              </div>
            )}

            <button type="submit" disabled={isSubmitting || !isFormValid}
              style={{
                width: '100%', height: '44px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 55%, #f093fb 100%)',
                border: 'none', borderRadius: '10px',
                color: 'white', fontWeight: 700, fontSize: '14px',
                cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                opacity: !isFormValid || isSubmitting ? 0.5 : 1,
              }}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '12px', fontSize: '10px', color: '#6b7280', lineHeight: 1.6 }}>
            Protected by Google reCAPTCHA during registration.
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#4b5563' }}>Already have access? </span>
            <button onClick={() => navigate('/login')}
              style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
              Sign in
            </button>
          </div>
        </div>

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
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '10px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              Set up once.<br />Scale with confidence.
            </h3>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: '260px', margin: '0 auto' }}>
              Keep your team aligned with one platform for lead handling, campaign execution, and lifecycle tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

