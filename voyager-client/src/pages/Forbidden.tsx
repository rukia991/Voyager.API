import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { defaultRouteForRole } from '../services/rbac';

export default function Forbidden() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      padding: '24px',
    }}>
      <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '10px', fontWeight: 700 }}>403 Forbidden</div>
        <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>You do not have access to this page.</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '18px' }}>
          Voyager blocked this route because your account role is not authorized for the requested URL.
        </p>
        <button className="btn btn-primary" onClick={() => navigate(user ? defaultRouteForRole(user.role) : '/login')}>
          Return to a valid page
        </button>
      </div>
    </div>
  );
}


