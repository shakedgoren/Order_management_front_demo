import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthBridge';

export default function TopBar() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchUser = () => {
    logout();
    setMenuOpen(false);
  };

  const handleFullLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-brand-icon">
          <img src="/logo.png" alt="logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
        </div>
        <div>
          <div className="topbar-brand-name">ג'חנון על גלגלים</div>
          <div className="topbar-brand-role">{role === 'admin' ? 'מנהל מערכת' : 'צוות עובדים'}</div>
        </div>
      </div>
      <div className="topbar-actions" ref={menuRef} style={{ position: 'relative' }}>
        <button className="icon-btn" onClick={() => setMenuOpen(!menuOpen)} title="תפריט משתמש" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, fontSize: 18, borderRadius: '50%', background: 'var(--surf)', border: '1px solid var(--ink-12)', color: 'var(--ink)' }}>
          <span>👤</span>
        </button>
        {menuOpen && (
          <div style={{ position: 'absolute', top: '110%', left: 0, background: 'var(--white)', border: '1px solid var(--ink-12)', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 6, zIndex: 100, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={handleSwitchUser} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', width: '100%', textAlign: 'right', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: 'var(--ink)', borderRadius: 6, cursor: 'pointer' }}>
              <span>🔄</span> החלף משתמש
            </button>
            <div style={{ height: 1, background: 'var(--ink-06)', margin: '2px 0' }} />
            <button onClick={handleFullLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', width: '100%', textAlign: 'right', background: 'var(--red-soft, #fee2e2)', border: 'none', fontSize: 13, fontWeight: 700, color: 'var(--red)', borderRadius: 6, cursor: 'pointer' }}>
              <span>🚪</span> התנתק וחזור לאתר
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
