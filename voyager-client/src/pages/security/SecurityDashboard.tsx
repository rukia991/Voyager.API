import { useCallback, useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import securityService, {
  type LockedAccountDTO,
  type SecurityAuditItemDTO,
  type SecurityDashboardDTO,
} from '../../services/securityService';
import { getApiErrorMessage } from '../../utils/apiError';

export default function SecurityDashboard() {
  const [data, setData] = useState<SecurityDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlockingUserId, setUnlockingUserId] = useState<number | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<SecurityAuditItemDTO | null>(null);
  const [selectedLockedAccount, setSelectedLockedAccount] = useState<LockedAccountDTO | null>(null);
  const [isLoadingReveal, setIsLoadingReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      setData(await securityService.getDashboard());
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load security dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      await loadDashboard();
    };

    initializeDashboard().catch(() => undefined);
  }, [loadDashboard]);

  const handleUnlock = async (userId: number, email: string) => {
    try {
      setUnlockingUserId(userId);
      setError(null);
      await securityService.unlockAccount({ userId, email });
      await loadDashboard();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to unlock account.'));
    } finally {
      setUnlockingUserId(null);
    }
  };

  const handleRevealAudit = async (id: number) => {
    try {
      setIsLoadingReveal(true);
      setError(null);
      setSelectedLockedAccount(null);
      setSelectedAudit(await securityService.getAuditDetail(id));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load full security audit details.'));
    } finally {
      setIsLoadingReveal(false);
    }
  };

  const handleRevealLockedAccount = async (userId: number) => {
    try {
      setIsLoadingReveal(true);
      setError(null);
      setSelectedAudit(null);
      setSelectedLockedAccount(await securityService.getLockedAccountDetail(userId));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load full locked account details.'));
    } finally {
      setIsLoadingReveal(false);
    }
  };

  const closeReveal = () => {
    setSelectedAudit(null);
    setSelectedLockedAccount(null);
  };

  const lockedAccountMatch = selectedAudit
    ? (data?.lockedAccounts ?? []).find((account) => account.userId === selectedAudit.userId) ?? null
    : selectedLockedAccount;

  return (
    <MainLayout>
      {loading ? (
        <div className="card" style={{ padding: '24px' }}>Loading security telemetry...</div>
      ) : (
        <>
          <section className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Security Center
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Lockouts, IP Tracking, and Audit Investigation
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '820px' }}>
                  IP addresses are shown in every event row below. Use <strong style={{ color: 'var(--text-primary)' }}>Reveal Full Details</strong> to inspect the raw email, IP address, and location for a single event. Locked accounts can be reopened from the <strong style={{ color: 'var(--text-primary)' }}>Locked Accounts</strong> panel with <strong style={{ color: 'var(--text-primary)' }}>Unlock Account</strong>.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={async () => {
                  await loadDashboard();
                }}
              >
                Refresh Security Data
              </button>
            </div>
          </section>

          {error && (
            <div className="card" style={{ padding: '16px', marginBottom: '20px', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          <section style={{ marginBottom: '20px' }}>
            <div className="grid-3">
              {[
                { label: 'Suspicious Logins', value: data?.suspiciousLoginCount ?? 0, accent: '#f59e0b' },
                { label: 'Failed Attempts', value: data?.failedLoginCount ?? 0, accent: '#ef4444' },
                { label: 'Locked Accounts', value: data?.lockedAccountCount ?? 0, accent: '#60a5fa' },
              ].map((item) => (
                <div key={item.label} className="stat-card">
                  <div style={{ fontSize: '28px', fontWeight: 800, color: item.accent }}>{item.value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card" style={{ marginBottom: '20px', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Locked Accounts</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Permanent locks are released here by Admin or SuperAdmin. Use reveal first if you want to inspect the last IP address before unlocking.
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {(data?.lockedAccounts ?? []).length === 0 && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No currently locked accounts.</div>
              )}
              {(data?.lockedAccounts ?? []).map((account) => (
                <div key={account.userId} className="card" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{account.userName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{account.email}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Failed attempts: {account.failedAccessCount} | Lockout ends: {account.lockoutEnd ? new Date(account.lockoutEnd).toLocaleString() : 'Manual unlock required'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Last attempt IP: {account.lastAttemptIpAddress || 'Unknown'}{account.lastAttemptAt ? ` | Last attempt: ${new Date(account.lastAttemptAt).toLocaleString()}` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={unlockingUserId === account.userId}
                      onClick={async () => {
                        await handleUnlock(account.userId, account.email);
                      }}
                    >
                      {unlockingUserId === account.userId ? 'Unlocking...' : 'Unlock Account'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={isLoadingReveal}
                      onClick={async () => {
                        await handleRevealLockedAccount(account.userId);
                      }}
                    >
                      {isLoadingReveal ? 'Loading...' : 'Reveal Full Details'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid-2" style={{ alignItems: 'start' }}>
            <TelemetryCard title="Suspicious Logins" items={data?.suspiciousLogins ?? []} onReveal={handleRevealAudit} />
            <TelemetryCard title="Failed Login Attempts" items={data?.failedAttempts ?? []} landscape onReveal={handleRevealAudit} />
          </section>

          <section style={{ marginTop: '20px' }}>
            <TelemetryCard title="Recent Successful Logins" items={data?.recentSuccessfulLogins ?? []} onReveal={handleRevealAudit} />
          </section>

          {(selectedAudit || selectedLockedAccount) && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
            >
              <button
                type="button"
                aria-label="Close full details panel"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                }}
                onClick={closeReveal}
              />
              <section
                className="card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="security-details-title"
                style={{
                  padding: '24px',
                  width: '100%',
                  maxWidth: '520px',
                  position: 'relative',
                  background: 'linear-gradient(180deg, rgba(10, 15, 28, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)',
                  boxShadow: '0 32px 90px rgba(0,0,0,0.55)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    background: 'rgba(49, 46, 129, 0.88)',
                    border: '1px solid rgba(167, 139, 250, 0.18)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                  }}
                >
                  <h2
                    id="security-details-title"
                    style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}
                  >
                    {selectedAudit ? 'Full Security Audit Details' : 'Full Locked Account Details'}
                  </h2>
                  <button type="button" className="btn btn-ghost" onClick={closeReveal}>
                    Close
                  </button>
                </div>

                {selectedAudit && (
                  <div style={{ display: 'grid', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(15, 23, 42, 0.78)', borderRadius: '16px', padding: '16px' }}>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Action:</strong> {selectedAudit.action}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Module:</strong> {selectedAudit.module}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {selectedAudit.email}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>IP Address:</strong> {selectedAudit.ipAddress}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Location:</strong> {selectedAudit.city || 'Unknown city'}, {selectedAudit.country || 'Unknown country'}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Details:</strong> {selectedAudit.details}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Timestamp:</strong> {new Date(selectedAudit.timestamp).toLocaleString()}</div>
                  </div>
                )}

                {selectedLockedAccount && (
                  <div style={{ display: 'grid', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(15, 23, 42, 0.78)', borderRadius: '16px', padding: '16px' }}>
                    <div><strong style={{ color: 'var(--text-primary)' }}>User:</strong> {selectedLockedAccount.userName}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {selectedLockedAccount.email}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Failed Attempts:</strong> {selectedLockedAccount.failedAccessCount}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Lockout End:</strong> {selectedLockedAccount.lockoutEnd ? new Date(selectedLockedAccount.lockoutEnd).toLocaleString() : 'Manual unlock required'}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Last Attempt IP:</strong> {selectedLockedAccount.lastAttemptIpAddress || 'Unknown'}</div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>Last Attempt:</strong> {selectedLockedAccount.lastAttemptAt ? new Date(selectedLockedAccount.lastAttemptAt).toLocaleString() : 'Unknown'}</div>
                  </div>
                )}

                {lockedAccountMatch && (
                  <div
                    style={{
                      marginTop: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(96, 165, 250, 0.2)',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      This account is currently locked. You can unlock it directly from this panel.
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={unlockingUserId === lockedAccountMatch.userId}
                      onClick={async () => {
                        await handleUnlock(lockedAccountMatch.userId, lockedAccountMatch.email);
                        closeReveal();
                      }}
                    >
                      {unlockingUserId === lockedAccountMatch.userId ? 'Unlocking...' : 'Unlock Account'}
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}

function TelemetryCard({
  title,
  items,
  landscape = false,
  onReveal,
}: {
  title: string;
  items: Array<{ id: number; email: string; action: string; module: string; ipAddress: string; country: string; city: string; details: string; timestamp: string }>;
  landscape?: boolean;
  onReveal?: (id: number) => Promise<void> | void;
}) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>{title}</div>
      <div style={{ display: 'grid', gap: '10px' }}>
        {items.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No events in the last 7 days.</div>}
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: landscape ? 'grid' : 'block',
              gridTemplateColumns: landscape ? 'minmax(170px, 220px) minmax(180px, 240px) 1fr minmax(160px, 200px)' : undefined,
              gap: landscape ? '12px' : undefined,
              alignItems: landscape ? 'center' : undefined,
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.email}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {item.action} • {item.module}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {item.ipAddress}
              <div style={{ marginTop: '4px' }}>{item.city || 'Unknown city'}, {item.country || 'Unknown country'}</div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: landscape ? 0 : '6px' }}>{item.details}</div>
            <div style={{ textAlign: landscape ? 'right' : 'left' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: landscape ? 0 : '6px' }}>
                {new Date(item.timestamp).toLocaleString()}
              </div>
              {onReveal && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: '8px', padding: '4px 10px', fontSize: '11px' }}
                  onClick={async () => {
                    await onReveal(item.id);
                  }}
                >
                  Reveal Full Details
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

