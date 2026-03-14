import { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import HomePage from './pages/website/HomePage';

import AuthBridge from './components/layout/AuthBridge';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import CustomersPage from './pages/manager/CustomersPage';
import ShiftPage from './pages/manager/ShiftPage';
import OrdersPage from './pages/manager/OrdersPage';
import HistoryPage from './pages/manager/HistoryPage';

// ─── Toast Context ────────────────────────────────────
type ToastType = 'info' | 'success' | 'error';
type ToastFn = (message: string, type?: ToastType) => void;

export const ToastContext = createContext<ToastFn | null>(null);
export const useToast = (): ToastFn => useContext(ToastContext)!;

interface Toast { id: number; message: string; type: ToastType; }

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast: ToastFn = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Dashboard shell ──────────────────────────────────
function DashboardShell() {
  return (
    <div className="app-layout">
      <TopBar />
      <main className="main-content">
        <Routes>
          <Route index element={<ShiftPage />} />
          <Route path="current" element={<OrdersPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <ToastProvider>
        <Routes>
          {/* Public website */}
          <Route path="/" element={<HomePage />} />

          {/* Manager dashboard — wrapped in AuthBridge */}
          <Route
            path="/dashboard/*"
            element={
              <AuthBridge>
                <DashboardShell />
              </AuthBridge>
            }
          />

          {/* Catch-all → home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
