import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

/* ── tiny hook: is element visible? ── */
function useVisible(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ── animated counter ── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useVisible(0.3);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(target / 60);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(t); }
      else setCount(start);
    }, 20);
    return () => clearInterval(t);
  }, [visible, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}


const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [hoveredDest, setHoveredDest] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('scroll', onScroll);
    window.addEventListener('mousemove', onMouse);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMouse); };
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(f => (f + 1) % features.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      setShowBackToTop(window.scrollY > 400);
      const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
      reveals.forEach(el => {
        const rect = el.getBoundingClientRect();
        const visible = rect.top < window.innerHeight * 0.88;
        if (visible) el.classList.add('visible');
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const destinations = [
    { name: 'Boracay, Aklan', sub: 'Pristine white-sand paradise', image: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=1000&auto=format&fit=crop', price: '₱12,500', rating: '4.9', tag: 'Beach', color: '#06b6d4' },
    { name: 'El Nido, Palawan', sub: 'Emerald lagoons & limestone cliffs', image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=1000&auto=format&fit=crop', price: '₱18,200', rating: '5.0', tag: 'Nature', color: '#10b981' },
    { name: 'Siargao, Surigao', sub: "The Philippines' surf capital", image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=1000&auto=format&fit=crop', price: '₱15,800', rating: '4.8', tag: 'Surf', color: '#8b5cf6' },
  ];

  const features = [
    { icon: '🗺️', title: 'Interactive Maps', desc: 'Pin destinations on live maps. Customers explore visually, boosting engagement by 3x.', color: '#667eea' },
    { icon: '👥', title: 'Smart Lead Pipeline', desc: 'Auto-score leads, track every interaction, and never lose a potential booking again.', color: '#f093fb' },
    { icon: '📧', title: 'Email Automation', desc: 'Send the right message at the right time — triggered by lead behavior automatically.', color: '#34d399' },
    { icon: '📊', title: 'Live Analytics', desc: 'Real-time ROI, conversion funnels, and campaign performance at a glance.', color: '#fbbf24' },
    { icon: '⚡', title: 'Workflow Engine', desc: 'Build automation rules without code — assign leads, send emails, update statuses.', color: '#f87171' },
    { icon: '🛡️', title: 'Role-Based Access', desc: 'Granular permissions for every team member from staff to super admin.', color: '#60a5fa' },
  ];

  const testimonials = [
    { name: 'Maria Santos', role: 'Travel Agency Owner, Cebu', quote: 'Voyager tripled our lead conversions in the first month. Absolute game changer.', avatar: '👩‍💼' },
    { name: 'Jaime Cruz', role: 'Marketing Manager, Manila', quote: 'The automation engine saved our team 20 hours per week on manual follow-ups.', avatar: '👨‍💻' },
    { name: 'Ana Reyes', role: 'Tour Operator, Davao', quote: "Finally a system that understands how travel businesses actually work.", avatar: '👩‍🌾' },
  ];


  // Parallax offset for hero
  const px = (mousePos.x / window.innerWidth - 0.5) * 20;
  const py = (mousePos.y / window.innerHeight - 0.5) * 20;

  return (
    <div className="landing-page" style={{ background: '#f8fafc', overflowX: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <div
        className="scroll-progress"
        style={{ width: `${Math.max(0, Math.min(100, scrollProgress))}%` }}
      />
      {showBackToTop && (
        <button
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          Top
        </button>
      )}

      {/* ── CURSOR GLOW ── */}
      <div style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 9999,
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(102,126,234,0.06) 0%, transparent 70%)',
        transform: `translate(${mousePos.x - 200}px, ${mousePos.y - 200}px)`,
        transition: 'transform 0.1s ease',
      }} />

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 clamp(16px, 5vw, 64px)',
        height: scrolled ? '56px' : '70px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.06)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
          }}>✈️</div>
          <span style={{ fontWeight: 900, fontSize: '20px', color: '#0f172a', letterSpacing: '-0.5px' }}>Voyager</span>
        </div>

        <div className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {['Features', 'Destinations', 'About'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              padding: '8px 16px', color: '#64748b', fontWeight: 600, fontSize: '14px',
              textDecoration: 'none', borderRadius: '10px', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(102,126,234,0.08)'; e.currentTarget.style.color = '#667eea'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
            >{l}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button variant="ghost" className="hidden sm:block" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" onClick={() => navigate('/register')}>Get Started →</Button>
          <button onClick={() => setMenuOpen(o => !o)} className="md:hidden" style={{
            width: '40px', height: '40px', border: '1.5px solid #e2e8f0',
            borderRadius: '12px', background: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', color: '#475569',
          }}>{menuOpen ? '✕' : '☰'}</button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99,
        background: 'white', padding: '80px 24px 24px',
        transform: menuOpen ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        {['features', 'destinations', 'about'].map(l => (
          <a key={l} href={`#${l}`} onClick={() => setMenuOpen(false)} style={{
            padding: '12px 16px', color: '#475569', fontWeight: 600, fontSize: '15px',
            textDecoration: 'none', borderRadius: '12px', textTransform: 'capitalize',
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >{l}</a>
        ))}
        <Button variant="ghost" onClick={() => navigate('/login')} className="mt-2">Sign In</Button>
        <Button variant="primary" onClick={() => navigate('/register')}>Get Started →</Button>
      </div>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: 'clamp(80px, 12vw, 140px) clamp(16px, 5vw, 64px) clamp(48px, 8vw, 80px)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Animated bg blobs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(102,126,234,0.12) 0%, transparent 70%)', animation: 'float1 8s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,147,251,0.1) 0%, transparent 70%)', animation: 'float2 10s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '40%', left: '30%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)', animation: 'float3 12s ease-in-out infinite' }} />
        </div>

        <style>{`
                @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,20px) scale(1.05)} }
                @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-30px) scale(1.08)} }
                @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,15px)} }
                @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
                @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
                @keyframes slideInLeft { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
                @keyframes slideInRight { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
                .hero-left { animation: slideInLeft 0.8s ease both; }
                .hero-right { animation: slideInRight 0.8s ease 0.2s both; }
                .fade-up-1 { animation: fadeUp 0.7s ease 0.1s both; }
                .fade-up-2 { animation: fadeUp 0.7s ease 0.25s both; }
                .fade-up-3 { animation: fadeUp 0.7s ease 0.4s both; }
                .fade-up-4 { animation: fadeUp 0.7s ease 0.55s both; }

                /* SCROLL REVEAL */
                .reveal {
                    opacity: 0;
                    transform: translateY(40px);
                    transition: opacity 0.7s ease, transform 0.7s ease;
                }
                .reveal.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .reveal-left {
                    opacity: 0;
                    transform: translateX(-40px);
                    transition: opacity 0.7s ease, transform 0.7s ease;
                }
                .reveal-left.visible {
                    opacity: 1;
                    transform: translateX(0);
                }
                .reveal-right {
                    opacity: 0;
                    transform: translateX(40px);
                    transition: opacity 0.7s ease, transform 0.7s ease;
                }
                .reveal-right.visible {
                    opacity: 1;
                    transform: translateX(0);
                }
                .reveal-scale {
                    opacity: 0;
                    transform: scale(0.9);
                    transition: opacity 0.6s ease, transform 0.6s ease;
                }
                .reveal-scale.visible {
                    opacity: 1;
                    transform: scale(1);
                }

                /* Stagger delays for scroll reveal */
                .delay-100 { transition-delay: 0.1s !important; }
                .delay-200 { transition-delay: 0.2s !important; }
                .delay-300 { transition-delay: 0.3s !important; }
                .delay-400 { transition-delay: 0.4s !important; }
                .delay-500 { transition-delay: 0.5s !important; }

                /* Progress bar */
                .scroll-progress {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
                    z-index: 9999;
                    transition: width 0.1s linear;
                }

                /* Back to top */
                .back-to-top {
                    position: fixed;
                    bottom: 32px;
                    right: 32px;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    z-index: 999;
                    box-shadow: 0 4px 16px rgba(102,126,234,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .back-to-top:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 24px rgba(102,126,234,0.5);
                }
                `}</style>

        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '48px', position: 'relative', zIndex: 1 }}>

          {/* Left */}
          <div className="hero-left" style={{ flex: '1 1 360px', maxWidth: '580px' }}>
            <div className="fade-up-1" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px 6px 8px', borderRadius: '999px',
              background: 'white', border: '1px solid rgba(102,126,234,0.2)',
              boxShadow: '0 2px 12px rgba(102,126,234,0.12)',
              marginBottom: '28px',
            }}>
              <div style={{ padding: '4px 8px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '999px', fontSize: '10px', fontWeight: 800, color: 'white', letterSpacing: '0.05em' }}>NEW</div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Voyager 2.0 is here — smarter automation</span>
              <span style={{ color: '#667eea' }}>→</span>
            </div>

            <h1 className="fade-up-2" style={{ fontSize: 'clamp(40px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.03, letterSpacing: '-2px', color: '#0f172a', marginBottom: '24px' }}>
              Turn leads into{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>bookings</span>
                <svg style={{ position: 'absolute', bottom: '-4px', left: 0, width: '100%' }} height="6" viewBox="0 0 200 6">
                  <path d="M0 5 Q50 0 100 3 Q150 6 200 2" stroke="url(#ug)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <defs><linearGradient id="ug" x1="0" x2="1"><stop offset="0%" stopColor="#667eea" /><stop offset="100%" stopColor="#f093fb" /></linearGradient></defs>
                </svg>
              </span>
              <br />automatically.
            </h1>

            <p className="fade-up-3" style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#64748b', lineHeight: 1.75, marginBottom: '36px', maxWidth: '460px' }}>
              The all-in-one marketing platform for travel businesses. Campaigns, leads, emails, and analytics — unified and automated.
            </p>

            <div className="fade-up-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '44px' }}>
              <button onClick={() => navigate('/register')} style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none', color: 'white', fontWeight: 800, fontSize: '15px',
                cursor: 'pointer', borderRadius: '14px',
                boxShadow: '0 8px 28px rgba(102,126,234,0.4)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(102,126,234,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(102,126,234,0.4)'; }}
              >
                <span>Start for Free</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>No CC needed</span>
              </button>
              <button onClick={() => navigate('/login')} style={{
                padding: '14px 28px', background: 'white', border: '2px solid #e2e8f0',
                color: '#334155', fontWeight: 800, fontSize: '15px',
                cursor: 'pointer', borderRadius: '14px', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.color = '#667eea'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >Sign In</button>
            </div>


            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex' }}>
                {['#a78bfa', '#818cf8', '#60a5fa', '#34d399', '#fb923c'].map((c, i) => (
                  <div key={i} style={{ width: '34px', height: '34px', borderRadius: '50%', background: c, border: '2.5px solid white', marginLeft: i > 0 ? '-10px' : '0', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                    {['😊', '🤩', '😎', '🙌', '✈️'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '1px', marginBottom: '3px' }}>
                  {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ color: '#fbbf24', fontSize: '13px' }}>★</span>)}
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Loved by <strong style={{ color: '#475569' }}>10,000+</strong> travel professionals</span>
              </div>
            </div>
          </div>

          {/* Right — interactive card stack */}
          <div className="hero-right" style={{ flex: '1 1 340px', position: 'relative', minHeight: '480px' }}>
            {/* Parallax main image */}
            <div style={{ transform: `translate(${px * 0.5}px, ${py * 0.5}px)`, transition: 'transform 0.15s ease', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.15)' }}>
              <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop" alt="Travel" style={{ width: '100%', display: 'block', borderRadius: '28px' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)', borderRadius: '28px' }} />
            </div>

            {/* Floating card 1 — leads */}
            <div style={{
              position: 'absolute', bottom: '20px', left: '-24px',
              background: 'white', borderRadius: '18px', padding: '14px 18px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              transform: `translate(${px * -0.3}px, ${py * -0.3}px)`,
              transition: 'transform 0.15s ease',
              display: 'flex', alignItems: 'center', gap: '12px',
              minWidth: '200px',
            }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #84fab0, #8fd3f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📊</div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>New leads today</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                  +<Counter target={47} />
                </div>
              </div>
            </div>

            {/* Floating card 2 — conversion */}
            <div style={{
              position: 'absolute', top: '20px', right: '-20px',
              background: 'white', borderRadius: '18px', padding: '14px 18px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              transform: `translate(${px * 0.4}px, ${py * 0.4}px)`,
              transition: 'transform 0.15s ease',
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Conversion Rate</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}><Counter target={84} suffix="%" /></div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', width: '120px' }}>
                <div style={{ height: '100%', width: '84%', background: 'linear-gradient(90deg, #667eea, #f093fb)', borderRadius: '999px', animation: 'pulse 2s ease infinite' }} />
              </div>
            </div>

            {/* Floating card 3 — notification */}
            <div style={{
              position: 'absolute', top: '45%', left: '-16px',
              background: '#0f172a', borderRadius: '14px', padding: '10px 14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              transform: `translate(${px * -0.2}px, ${py * 0.2}px)`,
              transition: 'transform 0.15s ease',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', animation: 'pulse 1.5s ease infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap' }}>Lead converted → Boracay ✈️</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── ANIMATED STATS ── */}
      <section style={{ background: 'white', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px, 5vw, 64px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {[
            { target: 10000, suffix: '+', label: 'Travelers' },
            { target: 98, suffix: '%', label: 'Satisfaction' },
            { target: 3, suffix: 'x', label: 'More Conversions' },
            { target: 50000, suffix: '+', label: 'Emails Sent' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '32px 16px', textAlign: 'center', borderRight: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-1px', background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                <Counter target={s.target} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTERACTIVE FEATURES ── */}
      <section id="features" style={{ padding: 'clamp(64px, 10vw, 120px) clamp(16px, 5vw, 64px)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Everything you need</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.1 }}>Built for travel businesses</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {features.map((f, i) => (
              <div key={i}
                onMouseEnter={() => setActiveFeature(i)}
                style={{
                  padding: '28px', borderRadius: '20px', cursor: 'pointer',
                  background: activeFeature === i ? 'white' : '#f8fafc',
                  border: activeFeature === i ? `1.5px solid ${f.color}30` : '1.5px solid #f1f5f9',
                  boxShadow: activeFeature === i ? `0 12px 40px ${f.color}18` : 'none',
                  transform: activeFeature === i ? 'translateY(-4px)' : 'translateY(0)',
                  transition: 'all 0.3s ease',
                }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px',
                  background: activeFeature === i ? `${f.color}15` : 'rgba(0,0,0,0.04)',
                  border: activeFeature === i ? `1px solid ${f.color}25` : '1px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', marginBottom: '16px',
                  transition: 'all 0.3s',
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.65 }}>{f.desc}</p>
                {activeFeature === i && (
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: f.color, fontWeight: 700, fontSize: '13px' }}>
                    Learn more <span>→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section id="destinations" style={{ background: 'white', padding: 'clamp(64px, 10vw, 120px) clamp(16px, 5vw, 64px)', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', marginBottom: '44px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>📍 Featured Destinations</div>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                Explore the Jewels<br />of the Philippines
              </h2>
            </div>
            <button style={{ padding: '10px 20px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.color = '#667eea'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
            >View All →</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {destinations.map((dest, i) => (
              <div key={i}
                onMouseEnter={() => setHoveredDest(i)}
                onMouseLeave={() => setHoveredDest(null)}
                style={{ cursor: 'pointer' }}>
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  borderRadius: '24px', aspectRatio: '4/5', marginBottom: '16px',
                  boxShadow: hoveredDest === i ? `0 24px 60px ${dest.color}30` : '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'box-shadow 0.3s',
                }}>
                  <img src={dest.image} alt={dest.name} style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    transform: hoveredDest === i ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.6s ease',
                  }} />
                  {/* Tag */}
                  <div style={{
                    position: 'absolute', top: '16px', left: '16px',
                    padding: '5px 12px', background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(12px)', borderRadius: '999px',
                    color: 'white', fontSize: '11px', fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}>{dest.tag}</div>
                  {/* Hover overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: hoveredDest === i ? `linear-gradient(to top, ${dest.color}80 0%, transparent 60%)` : 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)',
                    transition: 'background 0.4s',
                  }} />
                  {/* Bottom info */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, marginBottom: '3px' }}>Starts from</div>
                      <div style={{ color: 'white', fontSize: '24px', fontWeight: 900 }}>{dest.price}</div>
                    </div>
                    <div style={{ background: '#fbbf24', padding: '6px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800, fontSize: '12px', color: '#000' }}>⭐ {dest.rating}</div>
                  </div>
                  {/* Hover CTA */}
                  {hoveredDest === i && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'white', borderRadius: '12px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, color: '#0f172a', animation: 'fadeUp 0.2s ease both' }}>
                      View Package →
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', transition: 'color 0.2s', ...(hoveredDest === i ? { color: dest.color } : {}) }}>{dest.name}</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{dest.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: 'clamp(64px, 10vw, 120px) clamp(16px, 5vw, 64px)', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Testimonials</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>Trusted by professionals</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: '20px', padding: '28px',
                border: '1px solid #f1f5f9',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(102,126,234,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', gap: '1px', marginBottom: '16px' }}>
                  {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: '#fbbf24', fontSize: '14px' }}>★</span>)}
                </div>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7, marginBottom: '20px', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: 'clamp(48px, 8vw, 96px) clamp(16px, 5vw, 64px)', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          borderRadius: '32px', padding: 'clamp(48px, 7vw, 80px)', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Animated orbs */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(102,126,234,0.15)', filter: 'blur(80px)', animation: 'float1 8s ease infinite' }} />
          <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(240,147,251,0.1)', filter: 'blur(80px)', animation: 'float2 10s ease infinite' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚀</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 900, color: 'white', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: '16px' }}>
              Ready to grow your<br />travel business?
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '40px', maxWidth: '420px', margin: '0 auto 40px', lineHeight: 1.7 }}>
              Join thousands of travel professionals. Start free, no credit card required.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/register')} style={{
                padding: '16px 36px', background: 'white', border: 'none',
                color: '#0f172a', fontWeight: 800, fontSize: '16px',
                borderRadius: '16px', cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
              >Start for Free →</button>
              <button onClick={() => navigate('/login')} style={{
                padding: '16px 36px', background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(255,255,255,0.15)', color: 'white',
                fontWeight: 700, fontSize: '16px', borderRadius: '16px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >Sign In</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #f1f5f9', background: 'white', padding: '32px clamp(16px, 5vw, 64px)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✈️</div>
            <span style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>Voyager</span>
          </div>
          <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '13px' }}>© 2026 Voyager. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Terms', 'Privacy'].map(l => (
              <a key={l} href="#" style={{ color: '#94a3b8', fontWeight: 600, fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
