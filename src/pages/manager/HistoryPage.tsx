import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../components/layout/AuthBridge';

interface ShabbatRecord {
  id: number;
  date: string;
  yavne_open: boolean;
  ayyanot_open: boolean;
  has_delivery: boolean;
  employees?: string[];
  orders?: OrderRecord[];
  total_revenue?: number;
  total_orders?: number;
}
interface OrderRecord {
  id: number;
  customer_name?: string;
  customer?: { name: string };
  items?: { item_name: string; quantity: number }[];
  total_price?: number;
  payment_type?: string;
  location?: string;
  order_type?: string;
  status?: string;
  created_at?: string;
  is_walk_in?: boolean;
}

const fmt = (p: number) => `₪${(p || 0).toLocaleString('he-IL')}`;

export default function HistoryPage() {
  const { role } = useAuth();
  const [records, setRecords] = useState<ShabbatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ShabbatRecord | null>(null);
  const [detailOrders, setDetailOrders] = useState<OrderRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/shabbat/?closed=true&limit=20');
        setRecords(r.data?.results ?? r.data ?? []);
      } catch { setRecords([]); }
      setLoading(false);
    })();
  }, []);

  // טעינת הזמנות כשנכנסים לפרטי שבת
  const handleSelect = async (rec: ShabbatRecord) => {
    setSelected(rec);
    setDetailOrders([]);
    setDetailLoading(true);
    try {
      // ניסיון 1: orders מקוננות בתוך ה-shabbat
      const r = await api.get(`/shabbat/${rec.id}/`);
      const full: ShabbatRecord = r.data;
      if (full.orders && full.orders.length > 0) {
        setDetailOrders(full.orders);
      } else {
        // ניסיון 2: endpoint נפרד של orders לפי shabbat
        const r2 = await api.get(`/orders/?shabbat_id=${rec.id}&limit=200`);
        setDetailOrders(r2.data?.results ?? r2.data ?? []);
      }
    } catch {
      // ניסיון אחרון: orders endpoint ישיר
      try {
        const r2 = await api.get(`/orders/?shabbat_id=${rec.id}&limit=200`);
        setDetailOrders(r2.data?.results ?? r2.data ?? []);
      } catch { setDetailOrders([]); }
    }
    setDetailLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('למחוק את השבת הזו לצמיתות? לא ניתן לשחזר.')) return;
    setDeleting(id);
    try {
      await api.delete(`/shabbat/${id}/delete/`);
      setRecords(prev => prev.filter(r => r.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      alert('שגיאה במחיקה — נסי שוב');
    }
    setDeleting(null);
  };

  const totalRevenue = records.reduce((s, r) => s + (r.total_revenue || 0), 0);
  const totalOrders = records.reduce((s, r) => s + (r.total_orders || 0), 0);

  // ── Detail view ──
  if (selected) {
    const rev = detailOrders.filter(o => !o.is_walk_in).reduce((s, o) => s + (o.total_price || 0), 0);
    const visibleOrders = detailOrders
      .filter(o => !o.is_walk_in)
      .sort((a, b) => {
        const getPriority = (o: OrderRecord) => {
          if (o.order_type === 'delivery') return 1;
          if (o.location === 'yavne') return 2;
          return 3;
        };
        return getPriority(a) - getPriority(b);
      });
    return (
      <div>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="back-btn" onClick={() => setSelected(null)}>←</button>
            <div>
              <h1 className="page-title">📜 {selected.date}</h1>
              <p className="page-subtitle">{detailLoading ? 'טוען...' : `${visibleOrders.length} הזמנות · ${fmt(rev)}`}</p>
            </div>
          </div>
          {role === 'admin' && (
            <button
              onClick={() => handleDelete(selected.id)}
              disabled={deleting === selected.id}
              style={{ padding: '8px 16px', borderRadius: 12, border: '1.5px solid rgba(220,38,38,0.3)', background: 'var(--red-bg)', color: 'var(--red)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {deleting === selected.id ? '...' : '🗑️ מחק שבת'}
            </button>
          )}
        </div>

        {detailLoading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : visibleOrders.length === 0 ? (
          <div className="empty-s"><div className="ei">📋</div><h3>אין הזמנות</h3><p>לא נמצאו הזמנות לשבת זו</p></div>
        ) : (
          <div className="hist-list">
            {visibleOrders.map(o => {
              const name = o.customer?.name || o.customer_name || 'לא ידוע';
              const items = (o.items || []).map(i => `${i.item_name} ×${i.quantity}`).join(' · ') || '—';
              const locLbl = o.location === 'yavne' ? 'יבנה' : 'עיינות';
              const typeLbl = o.order_type === 'delivery' ? '🛵 משלוח' : '🏪 איסוף';
              return (
                <div key={o.id} className="hist-row">
                  <div className="hr-left">
                    <div className="hr-name">{name}</div>
                    <div className="hr-detail">{items}</div>
                    <div className="hr-detail" style={{ marginTop: 2, display: 'flex', gap: 8 }}>
                      <span>{locLbl}</span>
                      <span>{typeLbl}</span>
                      {o.payment_type && o.payment_type !== 'none' && (
                        <span style={{ color: 'var(--amber)', fontWeight: 700 }}>
                          {{ bit: 'ביט', cash: 'מזומן', credit: 'אשראי', paybox: 'פייבוקס' }[o.payment_type] ?? o.payment_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hr-right">
                    <div className="hr-price">{fmt(o.total_price || 0)}</div>
                    <div className="hr-date">{o.status === 'done' ? '✅ בוצע' : '⏳ ממתין'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── List view ──
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">היסטוריית הזמנות 📊</h1>
        <p className="page-subtitle">{records.length} משמרות</p>
      </div>

      {/* Stats */}
      <div className="stats-strip" style={{ marginBottom: 20 }}>
        <div className="stat-c">
          <div className="stat-v">{records.length}</div>
          <div className="stat-l">משמרות</div>
        </div>
        <div className="stat-c accent">
          <div className="stat-v">{fmt(totalRevenue)}</div>
          <div className="stat-l">הכנסות</div>
        </div>
        <div className="stat-c">
          <div className="stat-v">{totalOrders}</div>
          <div className="stat-l">הזמנות</div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="empty-s">
          <div className="ei">📊</div>
          <h3>אין היסטוריה</h3>
          <p>לאחר סגירת משמרות הן יופיעו כאן</p>
        </div>
      ) : (
        <>
          <div className="sec-row">
            <div className="sec-title">📜 משמרות קודמות</div>
          </div>
          <div className="hist-list" style={{ marginTop: 12 }}>
            {records.map(rec => {
              const locs = [rec.yavne_open && 'יבנה', rec.ayyanot_open && 'עיינות'].filter(Boolean).join(' + ');
              return (
                <div key={rec.id} className="hist-row">
                  <div className="hr-left" style={{ cursor: 'pointer', flex: 1 }} onClick={() => handleSelect(rec)}>
                    <div className="hr-name">{rec.date}</div>
                    <div className="hr-detail">{locs || 'עמדות לא ידועות'} · {rec.total_orders ?? 0} הזמנות</div>
                    {rec.employees && rec.employees.length > 0 && (
                      <div className="hr-detail" style={{ marginTop: 2 }}>👥 {rec.employees.slice(0, 3).join(', ')}{rec.employees.length > 3 ? ` +${rec.employees.length - 3}` : ''}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div className="hr-price">{fmt(rec.total_revenue || 0)}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 700, cursor: 'pointer' }} onClick={() => handleSelect(rec)}>פרטים →</span>
                      {role === 'admin' && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(rec.id); }}
                          disabled={deleting === rec.id}
                          style={{ padding: '2px 9px', borderRadius: 8, border: '1.5px solid rgba(220,38,38,0.3)', background: 'var(--red-bg)', color: 'var(--red)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                          {deleting === rec.id ? '...' : '🗑️ מחק'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
