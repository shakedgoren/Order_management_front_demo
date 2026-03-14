import { useState, useEffect, createContext, useContext } from 'react';
import { Role } from '../../types';

const ADMIN_PASSWORD = 'Sg280896';

interface AuthContextValue {
  role: Role;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
export const useAuth = () => useContext(AuthContext)!;

interface Props { children: React.ReactNode; }

export default function AuthBridge({ children }: Props) {
  const stored = localStorage.getItem('user_role') as Role | null;
  const [role, setRole] = useState<Role | null>(stored);
  const [selecting, setSelecting] = useState(!stored);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Re-check localStorage on mount (handles login from HomePage modal)
  useEffect(() => {
    const current = localStorage.getItem('user_role') as Role | null;
    if (current) {
      setRole(current);
      setSelecting(false);
    }
  }, []);

  const handleRoleSelect = (selected: Role) => {
    if (selected === 'admin') {
      setShowPasswordInput(true);
      setError('');
    } else {
      localStorage.setItem('user_role', 'employee');
      setRole('employee');
      setSelecting(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('user_role', 'admin');
      setRole('admin');
      setSelecting(false);
      setError('');
    } else {
      setError('סיסמה שגויה');
      setPassword('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    setRole(null);
    setSelecting(true);
    setShowPasswordInput(false);
    setPassword('');
  };

  useEffect(() => {
    const handleStorage = () => {
      const current = localStorage.getItem('user_role') as Role | null;
      if (!current) { setRole(null); setSelecting(true); }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (selecting) {
    return (
      <div className="auth-overlay">
        <div className="auth-card card">
          <div className="auth-logo">
            <img src="/logo.png" alt="logo" style={{ width: '100%', maxWidth: 300, height: 'auto', maxHeight: 300, objectFit: 'contain', margin: '0 auto' }} />
          </div>
          <h2 className="auth-title">ברוכים הבאים</h2>
          <p className="auth-subtitle">בחר את סוג המשתמש להמשך:</p>

          {!showPasswordInput ? (
            <div className="auth-options">
              <button className="btn btn-primary auth-btn" onClick={() => handleRoleSelect('admin')}>
                🛡️ מנהל מערכת
              </button>
              <button className="btn btn-outline auth-btn" onClick={() => handleRoleSelect('employee')}>
                👤 עובד משמרת
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleAdminLogin}>
              <div className="form-group">
                <label className="form-label">סיסמת מנהל</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="הזן סיסמה..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                {error && <p className="auth-error">{error}</p>}
              </div>
              <div className="auth-form-actions">
                <button type="submit" className="btn btn-primary">כניסה</button>
                <button type="button" className="btn btn-text" onClick={() => setShowPasswordInput(false)}>ביטול</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ role: role!, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
