import { useState, useEffect } from 'react';
import { getLicenseInfo, isLicenseAllowed, validateLicenseKey, type LicenseInfo } from '../lib/license';

interface LicenseGateProps {
  children: React.ReactNode;
  licenseKey: string;
  trialStartDate: string;
  onActivate: (key: string) => void;
  onTrialStart: (date: string) => void;
}

export function LicenseGate({ children, licenseKey, trialStartDate, onActivate, onTrialStart }: LicenseGateProps) {
  const [info, setInfo]           = useState<LicenseInfo | null>(null);
  const [keyInput, setKeyInput]   = useState('');
  const [keyError, setKeyError]   = useState('');
  const [keySuccess, setKeySuccess] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!trialStartDate) {
      onTrialStart(new Date().toISOString());
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    setInfo(getLicenseInfo(licenseKey, trialStartDate));
  }, [licenseKey, trialStartDate]);

  if (!info) return null;

  if (isLicenseAllowed(info)) {
    return (
      <>
        {(info.status === 'expiring_soon' || info.status === 'trial') && info.daysLeft <= 7 && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
            background: info.daysLeft <= 0 ? 'rgba(239,68,68,0.95)' : 'rgba(245,158,11,0.95)',
            color: '#fff', padding: '10px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            backdropFilter: 'blur(8px)',
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          }}>
            <span style={{ fontSize: 18 }}>{info.daysLeft <= 0 ? '🚨' : '⚠️'}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{info.message}</span>
            <button
              onClick={() => setActivating(true)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Enter Key
            </button>
          </div>
        )}

        {activating && (
          <KeyEntryModal
            keyInput={keyInput} setKeyInput={setKeyInput}
            keyError={keyError} setKeyError={setKeyError}
            keySuccess={keySuccess} setKeySuccess={setKeySuccess}
            onClose={() => { setActivating(false); setKeyInput(''); setKeyError(''); setKeySuccess(''); }}
            onActivate={(key) => {
              onActivate(key);
              setKeySuccess('✅ License activated!');
              setTimeout(() => { setActivating(false); setKeyInput(''); setKeyError(''); setKeySuccess(''); }, 1500);
            }}
          />
        )}
        {children}
      </>
    );
  }

  // ── HARD LOCKOUT ──────────────────────────────────────────────────────────
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0B0F1A', color: '#F1F5F9',
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
      padding: 24, textAlign: 'center',
    }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🔐</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', letterSpacing: -0.5 }}>WashTrack</div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>by SterlingDev</div>
      </div>

      <div style={{
        background: '#131B2E', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 20,
        padding: '28px 32px', maxWidth: 420, width: '100%',
        boxShadow: '0 0 60px rgba(239,68,68,0.1)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#F87171', marginBottom: 10 }}>
          {info.status === 'trial_expired' ? '⏱ Trial Expired' : '📋 License Expired'}
        </div>
        <p style={{ fontSize: 15, color: '#94A3B8', margin: '0 0 24px', lineHeight: 1.6 }}>
          {info.status === 'trial_expired'
            ? 'Your 30-day free trial has ended. To continue using WashTrack, please purchase a license.'
            : `Your WashTrack license expired ${Math.abs(info.daysLeft)} day${Math.abs(info.daysLeft) === 1 ? '' : 's'} ago. Please contact WashTrack to renew.`}
        </p>

        <div style={{ marginBottom: 12 }}>
          <input
            value={keyInput}
            onChange={e => { setKeyInput(e.target.value); setKeyError(''); }}
            placeholder="WT-XXX-YYYYMMDD-XXXXXX"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#0F172A', border: `1px solid ${keyError ? '#EF4444' : '#1E293B'}`,
              borderRadius: 10, padding: '12px 14px',
              color: '#F1F5F9', fontSize: 15, fontFamily: 'inherit',
              outline: 'none', letterSpacing: 1,
            }}
          />
        </div>
        {keyError   && <p style={{ color: '#F87171', fontSize: 13, margin: '0 0 10px', fontWeight: 600 }}>{keyError}</p>}
        {keySuccess && <p style={{ color: '#4ADE80', fontSize: 13, margin: '0 0 10px', fontWeight: 600 }}>{keySuccess}</p>}

        <button
          onClick={() => {
            const trimmed = keyInput.trim();
            if (!trimmed) { setKeyError('Please enter your license key.'); return; }
            const { ok } = validateLicenseKey(trimmed);
            if (!ok) { setKeyError('Invalid key. Check the key and try again.'); return; }
            onActivate(trimmed.toUpperCase());
            setKeySuccess('✅ License activated! Loading...');
          }}
          style={{
            width: '100%', padding: '13px 0',
            background: keyInput.trim() ? 'linear-gradient(135deg, #38BDF8, #6366F1)' : '#1E293B',
            border: 'none', borderRadius: 12,
            color: keyInput.trim() ? '#fff' : '#475569',
            fontWeight: 800, fontSize: 15, cursor: keyInput.trim() ? 'pointer' : 'default',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
          Activate License
        </button>
      </div>

      <div style={{ marginTop: 28, fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#64748B' }}>Need a license key?</p>
        <p style={{ margin: 0 }}>Contact WashTrack Support</p>
        <p style={{ margin: '4px 0 0', color: '#38BDF8', fontWeight: 600 }}>Facebook: WashTrack PH · by SterlingDev</p>
      </div>
    </div>
  );
}

function KeyEntryModal({
  keyInput, setKeyInput,
  keyError, setKeyError,
  keySuccess, setKeySuccess,
  onClose, onActivate,
}: {
  keyInput: string; setKeyInput: (v: string) => void;
  keyError: string; setKeyError: (v: string) => void;
  keySuccess: string; setKeySuccess: (v: string) => void;
  onClose: () => void;
  onActivate: (key: string) => void;
}) {
  function handleActivate() {
    const trimmed = keyInput.trim();
    if (!trimmed) { setKeyError('Please enter your license key.'); return; }
    const { ok } = validateLicenseKey(trimmed);
    if (!ok) { setKeyError('Invalid key. Check the key and try again.'); return; }
    onActivate(trimmed.toUpperCase());
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: 24,
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
    }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 28, width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>🔑 Enter License Key</h3>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--muted)' }}>
          Contact WashTrack to get a renewal key.
        </p>
        <input
          value={keyInput}
          onChange={e => { setKeyInput(e.target.value); setKeyError(''); }}
          placeholder="WT-XXX-YYYYMMDD-XXXXXX"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--input-bg, #0F172A)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 14px',
            color: 'var(--text)', fontSize: 15, fontFamily: 'inherit',
            outline: 'none', letterSpacing: 1, marginBottom: 8,
          }}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleActivate()}
        />
        {keyError   && <p style={{ color: '#F87171', fontSize: 13, margin: '0 0 10px', fontWeight: 600 }}>{keyError}</p>}
        {keySuccess && <p style={{ color: '#4ADE80', fontSize: 13, margin: '0 0 10px', fontWeight: 600 }}>{keySuccess}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--subtext, #94A3B8)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={handleActivate}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #38BDF8, #6366F1)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            Activate
          </button>
        </div>
      </div>
    </div>
  );
}
